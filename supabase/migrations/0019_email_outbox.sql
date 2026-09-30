-- ---------------------------------------------------------------------------
-- 0019: email. The store sends order confirmations, order status updates, a
-- new-order alert to the shop owner, and contact-form messages, over SMTP.
--
-- The database only QUEUES email; the Next.js server sends it
-- (src/lib/email/dispatch.ts, via /api/email/dispatch). Queuing happens here,
-- in triggers and functions, so an email can't be forgotten by one code path
-- or lost when a send fails: it stays queued and the next dispatch retries it.
--
-- The site never holds the service-role key, so the sender reads and settles
-- the queue through two SECURITY DEFINER functions guarded by a shared secret
-- (EMAIL_DISPATCH_SECRET on the server; only its SHA-256 hash is stored here,
-- set once with set_email_dispatch_secret(), which visitors can't call).
-- Nobody can read the queue or the secret table directly: RLS is on with no
-- policies.
-- ---------------------------------------------------------------------------

-- The customer's language, so their order emails are in it. Set right after
-- checkout by set_order_locale() (place_order itself is unchanged).
alter table public.orders
  add column locale text not null default 'en' check (locale in ('en', 'am'));

-- ---------------------------------------------------------------------------
-- Contact form messages (a copy of each emailed message).
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (
    email = lower(email)
    and char_length(email) <= 254
    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  subject text check (char_length(subject) <= 150),
  message text not null check (char_length(message) between 10 and 3000),
  locale text not null default 'en' check (locale in ('en', 'am')),
  created_at timestamptz not null default now()
);
create index contact_messages_email_created_idx on public.contact_messages (email, created_at);
create index contact_messages_created_idx on public.contact_messages (created_at);

alter table public.contact_messages enable row level security;
create policy "contact_messages_admin_select" on public.contact_messages
  for select using ((select public.is_admin()));
create policy "contact_messages_admin_delete" on public.contact_messages
  for delete using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- The queue.
-- ---------------------------------------------------------------------------
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order_confirmation', 'order_alert', 'order_status', 'contact')),
  order_id uuid references public.orders(id) on delete cascade,
  contact_id uuid references public.contact_messages(id) on delete cascade,
  -- order_status only: the status the order moved to (it may have moved on
  -- again by the time the email goes out).
  status text,
  locale text not null default 'en' check (locale in ('en', 'am')),
  state text not null default 'pending' check (state in ('pending', 'sending', 'sent', 'failed', 'expired')),
  attempts int not null default 0,
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check ((kind = 'contact') = (contact_id is not null)),
  check ((kind = 'contact') = (order_id is null))
);
create index email_outbox_open_idx on public.email_outbox (created_at) where state in ('pending', 'sending');
create index email_outbox_order_idx on public.email_outbox (order_id);
create index email_outbox_contact_idx on public.email_outbox (contact_id);

alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

-- One row: the hash of the dispatch secret.
create table public.email_dispatch_settings (
  id boolean primary key default true check (id),
  secret_hash text not null
);
alter table public.email_dispatch_settings enable row level security;
revoke all on public.email_dispatch_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Queuing order emails.
-- ---------------------------------------------------------------------------
create function public.orders_queue_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- The line items are inserted after the order row (place_order), so they
    -- are read when the email is sent, not here.
    insert into public.email_outbox (kind, order_id, locale)
    values ('order_confirmation', new.id, new.locale), ('order_alert', new.id, 'en');
  elsif new.status is distinct from old.status
        and new.status in ('confirmed', 'shipped', 'delivered', 'cancelled') then
    insert into public.email_outbox (kind, order_id, status, locale)
    values ('order_status', new.id, new.status::text, new.locale);
  end if;
  return null;
end;
$$;

revoke execute on function public.orders_queue_emails() from public, anon, authenticated;

create trigger orders_after_insert_queue_emails
after insert on public.orders
for each row execute function public.orders_queue_emails();

create trigger orders_after_status_queue_emails
after update of status on public.orders
for each row execute function public.orders_queue_emails();

-- The customer's language, sent by the checkout right after place_order. Only
-- the order's owner, only within an hour of placing it; also re-labels that
-- order's emails still waiting in the queue.
create function public.set_order_locale(p_order_id uuid, p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_locale is null or p_locale not in ('en', 'am') then
    raise exception 'Invalid language.';
  end if;

  update public.orders
  set locale = p_locale
  where id = p_order_id
    and user_id = auth.uid()
    and created_at > now() - interval '1 hour';

  if found then
    update public.email_outbox
    set locale = p_locale
    where order_id = p_order_id
      and kind in ('order_confirmation', 'order_status')
      and state = 'pending';
  end if;
end;
$$;

revoke execute on function public.set_order_locale(uuid, text) from public, anon;
grant execute on function public.set_order_locale(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The contact form. Anyone may write; nobody but an admin may read. Limited
-- to 3 messages an hour per address and 30 an hour in all, so the form can't
-- be used to flood the shop's inbox.
-- ---------------------------------------------------------------------------
create function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_locale text default 'en'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_subject text := nullif(btrim(coalesce(p_subject, '')), '');
  v_message text := btrim(coalesce(p_message, ''));
  v_locale text := case when p_locale in ('en', 'am') then p_locale else 'en' end;
  v_id uuid;
begin
  if char_length(v_name) = 0 or char_length(v_name) > 100 then
    raise exception 'Please enter your name.';
  end if;
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.';
  end if;
  if char_length(coalesce(v_subject, '')) > 150 then
    raise exception 'The subject is too long.';
  end if;
  if char_length(v_message) < 10 or char_length(v_message) > 3000 then
    raise exception 'Your message must be between 10 and 3000 characters.';
  end if;

  if (select count(*) from public.contact_messages where email = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many messages. Please try again later.';
  end if;

  insert into public.contact_messages (name, email, subject, message, locale)
  values (v_name, v_email, v_subject, v_message, v_locale)
  returning id into v_id;

  insert into public.email_outbox (kind, contact_id, locale) values ('contact', v_id, 'en');
end;
$$;

revoke execute on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- The sender's side: secret check, claim a batch, settle each email.
-- ---------------------------------------------------------------------------
create function public.set_email_dispatch_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is null then
    delete from public.email_dispatch_settings;
    return;
  end if;
  if char_length(p_secret) < 32 then
    raise exception 'The dispatch secret must be at least 32 characters.';
  end if;
  insert into public.email_dispatch_settings (id, secret_hash)
  values (true, encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'))
  on conflict (id) do update set secret_hash = excluded.secret_hash;
end;
$$;

-- Only the database owner (SQL editor / service role) may set it.
revoke execute on function public.set_email_dispatch_secret(text) from public, anon, authenticated;

create function public.email_dispatch_check(p_secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is null
     or not exists (
       select 1 from public.email_dispatch_settings
       where secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')
     ) then
    raise exception 'Not allowed.';
  end if;
end;
$$;

revoke execute on function public.email_dispatch_check(text) from public, anon, authenticated;

-- Hands the sender up to p_limit queued emails with everything needed to
-- write them. Each is leased for 5 minutes, so a sender that crashes mid-way
-- doesn't strand it and two senders never take the same one. Anything queued
-- more than 3 days ago is dropped (marked expired): an order confirmation
-- weeks late, e.g. after SMTP is first switched on, would only confuse.
create function public.claim_email_outbox(p_secret text, p_limit int default 10)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
begin
  perform public.email_dispatch_check(p_secret);

  update public.email_outbox
  set state = 'expired', locked_until = null
  where state in ('pending', 'sending') and created_at < now() - interval '3 days';

  with picked as (
    select id
    from public.email_outbox
    where state = 'pending' or (state = 'sending' and locked_until < now())
    order by created_at
    limit least(greatest(coalesce(p_limit, 10), 1), 50)
    for update skip locked
  ),
  claimed as (
    update public.email_outbox o
    set state = 'sending', attempts = o.attempts + 1, locked_until = now() + interval '5 minutes'
    from picked
    where o.id = picked.id
    returning o.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'kind', c.kind,
    'status', c.status,
    'locale', c.locale,
    'order', (
      select jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'status', o.status,
        'payment_method', o.payment_method,
        'subtotal', o.subtotal,
        'delivery_fee', o.delivery_fee,
        'discount', o.discount,
        'total', o.total,
        'delivery_address', o.delivery_address,
        'created_at', o.created_at,
        'customer_name', p.full_name,
        'customer_email', p.email,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total', oi.total
          ) order by oi.product_name)
          from public.order_items oi
          where oi.order_id = o.id
        ), '[]'::jsonb)
      )
      from public.orders o
      left join public.profiles p on p.id = o.user_id
      where o.id = c.order_id
    ),
    'contact', (
      select jsonb_build_object(
        'name', m.name,
        'email', m.email,
        'subject', m.subject,
        'message', m.message,
        'created_at', m.created_at
      )
      from public.contact_messages m
      where m.id = c.contact_id
    )
  ) order by c.created_at), '[]'::jsonb)
  into v_rows
  from claimed c;

  return v_rows;
end;
$$;

-- p_error null = sent. Otherwise it goes back in the queue for the next
-- dispatch, until the 5th attempt, when it is given up as failed.
create function public.complete_email_outbox(p_secret text, p_id uuid, p_error text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.email_dispatch_check(p_secret);

  if p_error is null then
    update public.email_outbox
    set state = 'sent', sent_at = now(), locked_until = null, last_error = null
    where id = p_id and state = 'sending';
  else
    update public.email_outbox
    set state = case when attempts >= 5 then 'failed' else 'pending' end,
        locked_until = null,
        last_error = left(p_error, 500)
    where id = p_id and state = 'sending';
  end if;
end;
$$;

-- Callable with the public key; the secret is what guards them.
revoke execute on function public.claim_email_outbox(text, int) from public;
grant execute on function public.claim_email_outbox(text, int) to anon, authenticated;
revoke execute on function public.complete_email_outbox(text, uuid, text) from public;
grant execute on function public.complete_email_outbox(text, uuid, text) to anon, authenticated;

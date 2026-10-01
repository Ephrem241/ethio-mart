-- ---------------------------------------------------------------------------
-- 0020: the admin's Messages page. Contact-form messages (0019) can be read,
-- marked read/unread, deleted and answered from the admin; an answer is
-- emailed to the customer through the same outbox as every other email (new
-- kind: contact_reply) and kept with the message as a thread.
--
-- Admins read messages and replies through RLS; every change goes through a
-- SECURITY DEFINER function that checks is_admin() itself.
-- ---------------------------------------------------------------------------

-- null = not read yet.
alter table public.contact_messages add column read_at timestamptz;

create table public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index contact_replies_message_idx on public.contact_replies (message_id, created_at);
create index contact_replies_admin_idx on public.contact_replies (admin_id);

alter table public.contact_replies enable row level security;
create policy "contact_replies_admin_select" on public.contact_replies
  for select using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- The outbox learns a fifth kind of email: an answer to a contact message.
-- ---------------------------------------------------------------------------
alter table public.email_outbox
  add column reply_id uuid references public.contact_replies(id) on delete cascade;
create index email_outbox_reply_idx on public.email_outbox (reply_id);

alter table public.email_outbox drop constraint email_outbox_kind_check;
alter table public.email_outbox drop constraint email_outbox_check;
alter table public.email_outbox drop constraint email_outbox_check1;
alter table public.email_outbox
  add constraint email_outbox_kind_check
    check (kind in ('order_confirmation', 'order_alert', 'order_status', 'contact', 'contact_reply')),
  add constraint email_outbox_contact_link_check
    check ((kind in ('contact', 'contact_reply')) = (contact_id is not null)),
  add constraint email_outbox_order_link_check
    check ((kind in ('contact', 'contact_reply')) = (order_id is null)),
  add constraint email_outbox_reply_link_check
    check ((kind = 'contact_reply') = (reply_id is not null));

-- ---------------------------------------------------------------------------
-- Admin actions.
-- ---------------------------------------------------------------------------
create function public.set_contact_message_read(p_message_id uuid, p_read boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed.';
  end if;
  update public.contact_messages
  set read_at = case when p_read then coalesce(read_at, now()) else null end
  where id = p_message_id;
  if not found then
    raise exception 'Message not found.';
  end if;
end;
$$;

revoke execute on function public.set_contact_message_read(uuid, boolean) from public, anon;
grant execute on function public.set_contact_message_read(uuid, boolean) to authenticated;

-- Stores the answer, marks the message read, and queues the email to the
-- customer (in the language they wrote in).
create function public.reply_to_contact_message(p_message_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_locale text;
  v_reply_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not allowed.';
  end if;
  if char_length(v_body) = 0 or char_length(v_body) > 5000 then
    raise exception 'A reply must be between 1 and 5000 characters.';
  end if;

  update public.contact_messages
  set read_at = coalesce(read_at, now())
  where id = p_message_id
  returning locale into v_locale;
  if not found then
    raise exception 'Message not found.';
  end if;

  insert into public.contact_replies (message_id, body, admin_id)
  values (p_message_id, v_body, auth.uid())
  returning id into v_reply_id;

  insert into public.email_outbox (kind, contact_id, reply_id, locale)
  values ('contact_reply', p_message_id, v_reply_id, v_locale);

  return v_reply_id;
end;
$$;

revoke execute on function public.reply_to_contact_message(uuid, text) from public, anon;
grant execute on function public.reply_to_contact_message(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The sender also needs the reply text and the customer's language. Same
-- signature and guard as 0019; only 'reply' and contact.locale are new.
-- ---------------------------------------------------------------------------
create or replace function public.claim_email_outbox(p_secret text, p_limit int default 10)
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
        'locale', m.locale,
        'created_at', m.created_at
      )
      from public.contact_messages m
      where m.id = c.contact_id
    ),
    'reply', (
      select jsonb_build_object('body', r.body, 'created_at', r.created_at)
      from public.contact_replies r
      where r.id = c.reply_id
    )
  ) order by c.created_at), '[]'::jsonb)
  into v_rows
  from claimed c;

  return v_rows;
end;
$$;

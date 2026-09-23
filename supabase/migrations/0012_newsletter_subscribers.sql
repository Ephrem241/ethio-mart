-- ---------------------------------------------------------------------------
-- The homepage newsletter form (components/home/newsletter.tsx) called a stub
-- that logged the address to the console and dropped it. This gives signups a
-- real home.
--
-- Visitors must be able to subscribe but must never be able to read the list,
-- so the table has NO insert policy for anon/authenticated: the only write
-- path is subscribe_to_newsletter(), which validates and normalises the
-- address itself. A repeat signup is a silent no-op, so the form can't be used
-- to discover who is already subscribed.
-- ---------------------------------------------------------------------------

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_valid check (
    email = lower(email)
    and char_length(email) <= 254
    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter_subscribers_admin_select" on public.newsletter_subscribers
  for select using (public.is_admin());
create policy "newsletter_subscribers_admin_delete" on public.newsletter_subscribers
  for delete using (public.is_admin());

create function public.subscribe_to_newsletter(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.';
  end if;

  insert into public.newsletter_subscribers (email) values (v_email)
  on conflict (email) do nothing;
end;
$$;

revoke execute on function public.subscribe_to_newsletter(text) from public;
grant execute on function public.subscribe_to_newsletter(text) to anon, authenticated;

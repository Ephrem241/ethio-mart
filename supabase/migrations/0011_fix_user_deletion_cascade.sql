-- ---------------------------------------------------------------------------
-- Found when a test cleanup could not delete an auth user: deleting a user
-- fails with "Database error deleting user" (HTTP 500) whenever that user has
-- a saved address, even though addresses.user_id is ON DELETE CASCADE.
--
-- Cause: the cascade deletes the user's address rows, which fires the
-- AFTER DELETE trigger addresses_promote_next_default (0003). Triggers run
-- with the privileges of whoever ran the triggering statement — here
-- Supabase's internal auth role, which has no rights on public.addresses — so
-- the UPDATE inside the trigger is denied and the whole user delete rolls back.
--
-- It affects deleting an account from the dashboard today, and any future
-- self-serve "delete my account".
--
-- Fix: run the trigger function with definer rights (pinned search_path, and
-- not callable through the API). When the WHOLE user is being deleted the
-- update targets rows that are being cascade-deleted anyway, so it is harmless.
-- ---------------------------------------------------------------------------

create or replace function public.addresses_promote_next_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_default then
    update public.addresses set is_default = true
    where id = (
      select id from public.addresses
      where user_id = old.user_id
      order by created_at asc limit 1
    );
  end if;
  return old;
end;
$$;

-- Trigger-only function: must not be callable via /rest/v1/rpc/*.
revoke execute on function public.addresses_promote_next_default() from public, anon, authenticated;

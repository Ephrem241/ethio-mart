-- ---------------------------------------------------------------------------
-- prevent_role_self_escalation() (0003) reset every role change unless the
-- caller was already an admin. Trusted contexts with no signed-in user — the
-- service-role key used by scripts/seed-admin.ts, or a direct SQL session —
-- have auth.uid() = null, so is_admin() is false and the very first admin
-- could never be created.
--
-- Only enforce the guard when there IS a signed-in user. This does not open
-- a hole: anon requests are already denied by RLS (profiles has no update
-- policy for anon), and a signed-in customer still cannot change their role.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

-- CREATE OR REPLACE keeps existing grants; restated so this file stands alone.
revoke execute on function public.prevent_role_self_escalation() from public, anon, authenticated;

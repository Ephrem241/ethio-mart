-- ---------------------------------------------------------------------------
-- Fixes flagged by the Supabase security advisor after 0001-0006.
-- ---------------------------------------------------------------------------

-- Pin search_path on every function that did not set one, so a role can't
-- shadow objects by changing its own search_path.
alter function public.set_updated_at() set search_path = public;
alter function public.addresses_default_on_insert() set search_path = public;
alter function public.addresses_promote_next_default() set search_path = public;
alter function public.set_default_address(uuid) set search_path = public;
alter function public.orders_enforce_status_transition() set search_path = public;
alter function public.place_order(jsonb, payment_method, payment_status, numeric, jsonb) set search_path = public;

-- Trigger-only SECURITY DEFINER functions must not be callable through
-- /rest/v1/rpc/*. Triggers do not check EXECUTE when they fire, so this does
-- not affect signup or role-escalation protection.
-- (is_admin() is intentionally NOT revoked: RLS policies call it as the
-- querying role, so anon/authenticated need EXECUTE on it.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_role_self_escalation() from public, anon, authenticated;

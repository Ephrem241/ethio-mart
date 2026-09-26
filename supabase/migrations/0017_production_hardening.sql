-- ---------------------------------------------------------------------------
-- Phase 18 (Production preparation): what Supabase's security and performance
-- advisors reported on the live project. No table, column or row changes; the
-- rules say exactly what they said before.
--
-- 1. rls_auto_enable() is the event-trigger function Supabase installs to turn
--    row-level security on for every new table. The database runs it when a
--    table is created; nothing ever needs to CALL it. As a public function it
--    could also be called by anyone over the REST API
--    (/rest/v1/rpc/rls_auto_enable). Take that away. The trigger keeps
--    working: event triggers do not check EXECUTE.
--
-- 2. Row-level-security policies that call auth.uid() are re-evaluated for
--    EVERY row they examine. Written as (select auth.uid()), Postgres
--    evaluates it once per query instead. Same meaning, faster as the tables
--    grow (advisor: auth_rls_initplan). The same is done for is_admin() in the
--    three policies every storefront page load goes through (products,
--    categories, product images).
--
-- Left as they are on purpose:
--  - is_admin() and subscribe_to_newsletter() stay callable by visitors.
--    is_admin() is used INSIDE the policies, which run with the visitor's own
--    privileges, and only ever answers about the caller. The newsletter
--    sign-up is meant to be public.
--  - place_order() is callable by signed-in customers only, as intended.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- addresses -----------------------------------------------------------------
alter policy addresses_select_own on public.addresses using ((select auth.uid()) = user_id);
alter policy addresses_insert_own on public.addresses with check ((select auth.uid()) = user_id);
alter policy addresses_update_own on public.addresses using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy addresses_delete_own on public.addresses using ((select auth.uid()) = user_id);

-- cart_items ----------------------------------------------------------------
alter policy cart_items_select_own on public.cart_items using ((select auth.uid()) = user_id);
alter policy cart_items_insert_own on public.cart_items with check ((select auth.uid()) = user_id);
alter policy cart_items_update_own on public.cart_items using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy cart_items_delete_own on public.cart_items using ((select auth.uid()) = user_id);

-- favorites -----------------------------------------------------------------
alter policy favorites_select_own on public.favorites using ((select auth.uid()) = user_id);
alter policy favorites_insert_own on public.favorites with check ((select auth.uid()) = user_id);
alter policy favorites_delete_own on public.favorites using ((select auth.uid()) = user_id);

-- orders and their lines ----------------------------------------------------
alter policy orders_select_own_or_admin on public.orders using ((select auth.uid()) = user_id or is_admin());

alter policy order_items_select_own_or_admin on public.order_items using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = (select auth.uid()) or is_admin())
  )
);

-- profiles ------------------------------------------------------------------
alter policy profiles_select_own_or_admin on public.profiles using ((select auth.uid()) = id or is_admin());
alter policy profiles_update_own on public.profiles using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- reviews -------------------------------------------------------------------
alter policy reviews_select_approved_or_own_or_admin on public.reviews using (is_approved = true or (select auth.uid()) = user_id or is_admin());
alter policy reviews_insert_own on public.reviews with check ((select auth.uid()) = user_id);
alter policy reviews_update_own_or_admin on public.reviews
  using ((select auth.uid()) = user_id or is_admin())
  with check ((select auth.uid()) = user_id or is_admin());
alter policy reviews_delete_own_or_admin on public.reviews using ((select auth.uid()) = user_id or is_admin());

-- the storefront's public reads: is_admin() is evaluated once, not per row ---
alter policy products_select_active_or_admin on public.products using (is_active = true or (select is_admin()));
alter policy categories_select_active_or_admin on public.categories using (is_active = true or (select is_admin()));
alter policy product_images_select on public.product_images using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (p.is_active or (select is_admin()))
  )
);

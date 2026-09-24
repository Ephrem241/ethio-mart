-- ---------------------------------------------------------------------------
-- Phase 15 (Performance): indexes for the queries the app really runs, and for
-- the ones Postgres runs on its own.
--
-- 1. Foreign keys with no index. When a product is deleted, Postgres must find
--    its rows in cart_items / favorites (cascade) and order_items (set null);
--    without an index on product_id each of those is a scan of the whole
--    table. The existing (user_id, product_id) unique indexes can't help,
--    because product_id is their SECOND column.
-- 2. "My orders, newest first" filters on user_id and sorts on created_at:
--    one composite index answers it from the index alone. It also covers
--    every lookup the old single-column orders_user_id_idx served, so that
--    one is dropped (less to maintain on every order insert).
--
-- Pure additions and one redundant drop: no data changes, safe to re-run.
-- ---------------------------------------------------------------------------

create index if not exists cart_items_product_id_idx on public.cart_items (product_id);
create index if not exists favorites_product_id_idx on public.favorites (product_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id) where product_id is not null;
create index if not exists reviews_user_id_idx on public.reviews (user_id);

create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
drop index if exists public.orders_user_id_idx;

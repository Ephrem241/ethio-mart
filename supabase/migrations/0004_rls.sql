alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.promotions enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.reviews enable row level security;

-- profiles: no INSERT policy at all (only the handle_new_user trigger,
-- SECURITY DEFINER, writes rows) — deny-by-default is correct here.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_update_all" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- categories
create policy "categories_select_active_or_admin" on public.categories
  for select using (is_active = true or public.is_admin());
create policy "categories_admin_insert" on public.categories
  for insert with check (public.is_admin());
create policy "categories_admin_update" on public.categories
  for update using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_delete" on public.categories
  for delete using (public.is_admin());

-- products
create policy "products_select_active_or_admin" on public.products
  for select using (is_active = true or public.is_admin());
create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

-- product_images (readable whenever the parent product is readable)
create policy "product_images_select" on public.product_images
  for select using (
    exists (select 1 from public.products p where p.id = product_images.product_id and (p.is_active or public.is_admin()))
  );
create policy "product_images_admin_insert" on public.product_images
  for insert with check (public.is_admin());
create policy "product_images_admin_update" on public.product_images
  for update using (public.is_admin()) with check (public.is_admin());
create policy "product_images_admin_delete" on public.product_images
  for delete using (public.is_admin());

-- favorites: own rows only
create policy "favorites_select_own" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites for delete using (auth.uid() = user_id);

-- cart_items: own rows only
create policy "cart_items_select_own" on public.cart_items for select using (auth.uid() = user_id);
create policy "cart_items_insert_own" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "cart_items_update_own" on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart_items_delete_own" on public.cart_items for delete using (auth.uid() = user_id);

-- addresses: own rows only, no admin access (least-privilege — admin sees
-- delivery info per-order via orders.delivery_address, never the full address book)
create policy "addresses_select_own" on public.addresses for select using (auth.uid() = user_id);
create policy "addresses_insert_own" on public.addresses for insert with check (auth.uid() = user_id);
create policy "addresses_update_own" on public.addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_delete_own" on public.addresses for delete using (auth.uid() = user_id);

-- orders: customer reads/creates own; only admin updates (status);
-- no delete policy at all — orders are never deleted.
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items: immutable snapshots — select/insert only, scoped via parent order
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- promotions: admin-only, zero customer/anon exposure (no consuming UI exists)
create policy "promotions_admin_all" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

-- homepage_sections: public read (guests must see the homepage), admin write
create policy "homepage_sections_select_public" on public.homepage_sections
  for select using (true);
create policy "homepage_sections_admin_insert" on public.homepage_sections
  for insert with check (public.is_admin());
create policy "homepage_sections_admin_update" on public.homepage_sections
  for update using (public.is_admin()) with check (public.is_admin());

-- reviews: approved reviews are public, own reviews always visible to their
-- author, admin sees everything for moderation. No submission UI ships this
-- phase, but the RLS shape is correct and future-ready.
create policy "reviews_select_approved_or_own_or_admin" on public.reviews
  for select using (is_approved = true or auth.uid() = user_id or public.is_admin());
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews_update_own_or_admin" on public.reviews
  for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (auth.uid() = user_id or public.is_admin());

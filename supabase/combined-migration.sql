-- ============================================================
-- migrations/0001_extensions_enums.sql
-- ============================================================
-- gen_random_uuid() is available by default on Supabase Postgres (pgcrypto),
-- but ensure it explicitly for portability.
create extension if not exists pgcrypto;

create type user_role as enum ('customer', 'admin');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
create type payment_method as enum ('cod', 'manual');
create type payment_status as enum ('pending', 'paid', 'failed');

-- ============================================================
-- migrations/0002_tables.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_am text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description_en text not null default '',
  description_am text not null default '',
  image_url text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index categories_sort_order_idx on public.categories (sort_order);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name_en text not null,
  name_am text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description_en text not null default '',
  description_am text not null default '',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  stock int not null default 0 check (stock >= 0),
  sku text not null unique,
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active) where is_active = true;
create index products_featured_idx on public.products (is_active, is_featured) where is_featured = true;
create index products_popular_idx on public.products (is_active, is_popular) where is_popular = true;

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order int not null default 0
);
create index product_images_product_id_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index favorites_user_id_idx on public.favorites (user_id);

-- ---------------------------------------------------------------------------
-- cart_items — scoped to authenticated users only; guest carts stay
-- client-side (see checkout, which already requires login).
-- ---------------------------------------------------------------------------
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index cart_items_user_id_idx on public.cart_items (user_id);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  city text not null,
  sub_city text not null,
  woreda text not null,
  address text not null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses (user_id);
-- At most one default address per user, enforced by Postgres, not app code.
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

-- ---------------------------------------------------------------------------
-- orders / order_items
-- delivery_address is a jsonb snapshot, NOT a foreign key to addresses — an
-- order must keep the delivery details it was placed with even if the
-- address book entry is later edited or deleted.
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  order_number text not null unique,
  status order_status not null default 'pending',
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null check (total >= 0),
  delivery_address jsonb not null,
  -- Append-only timeline, maintained entirely by a trigger (0003), never
  -- written directly by the app.
  status_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  -- ON DELETE SET NULL: order line items are point-in-time snapshots
  -- (product_name/unit_price already captured) — deleting a product must
  -- never delete or corrupt historical order data.
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) not null check (total >= 0)
);
create index order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- promotions — spec-completeness only (Section 34/36); no consuming UI
-- ships in Phase 12 since no phase ever built a promo-code feature.
-- ---------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  description text not null default '',
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount', 'free_delivery')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index promotions_code_idx on public.promotions (code) where code is not null;

-- ---------------------------------------------------------------------------
-- homepage_sections — two fixed named rows (Phase 11 built exactly one
-- hero + one promo slot, not a list).
-- ---------------------------------------------------------------------------
create table public.homepage_sections (
  section_key text primary key check (section_key in ('hero', 'promo')),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index reviews_product_id_idx on public.reviews (product_id) where is_approved = true;

-- ============================================================
-- migrations/0003_functions_triggers.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER so it can read profiles even from within a
-- policy on another table without recursive-RLS problems.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user(): creates the profiles row the instant a real Supabase
-- Auth user is created (self-signup or the seed-admin script). Role always
-- defaults to 'customer'; the seed-admin script promotes exactly one
-- account to 'admin' immediately afterward.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- prevent_role_self_escalation(): a customer PATCHing their own profile row
-- can never flip their own role to 'admin', even via a raw REST call.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
-- generic updated_at bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger homepage_sections_set_updated_at before update on public.homepage_sections
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- addresses default-address bookkeeping: first address for a user is
-- auto-default; deleting the default promotes the next-oldest remaining one.
-- ---------------------------------------------------------------------------
create or replace function public.addresses_default_on_insert()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.addresses where user_id = new.user_id) then
    new.is_default := true;
  end if;
  return new;
end;
$$;

create trigger addresses_before_insert_default
before insert on public.addresses
for each row execute function public.addresses_default_on_insert();

create or replace function public.addresses_promote_next_default()
returns trigger language plpgsql as $$
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

create trigger addresses_after_delete_promote
after delete on public.addresses
for each row execute function public.addresses_promote_next_default();

-- RPC used by the "set as default" action: atomically clears the old
-- default and sets the new one, scoped to the caller's own rows via RLS.
create or replace function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update public.addresses set is_default = false
  where user_id = auth.uid() and is_default = true;

  update public.addresses set is_default = true
  where id = p_address_id and user_id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- orders status-transition guard + auto timeline: delivered/cancelled are
-- terminal; no-op transitions are rejected; status_history is appended
-- automatically, single source of truth.
-- ---------------------------------------------------------------------------
create or replace function public.orders_enforce_status_transition()
returns trigger language plpgsql as $$
begin
  if old.status in ('delivered', 'cancelled') then
    raise exception 'Cannot change status of a % order.', old.status;
  end if;
  if new.status = old.status then
    raise exception 'Order is already in this status.';
  end if;
  new.status_history := old.status_history || jsonb_build_object('status', new.status, 'at', now());
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_before_status_update
before update of status on public.orders
for each row execute function public.orders_enforce_status_transition();

-- ---------------------------------------------------------------------------
-- place_order(): atomic checkout RPC. Locks each product row, re-validates
-- is_active/stock, recomputes price server-side (never trusts a
-- client-supplied price), inserts the order + line items, decrements stock
-- — all in one transaction.
-- p_items shape: [{ "product_id": "...", "quantity": 2 }, ...]
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_delivery_address jsonb,
  p_payment_method payment_method,
  p_payment_status payment_status,
  p_delivery_fee numeric,
  p_items jsonb
)
returns public.orders
language plpgsql
security invoker
as $$
declare
  v_item jsonb;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_order public.orders;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  -- Lock every referenced product row up front (stable order by id avoids
  -- deadlocks between two concurrent checkouts sharing products).
  perform 1 from public.products
  where id in (select (elem ->> 'product_id')::uuid from jsonb_array_elements(p_items) elem)
  order by id
  for update;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, name_en, price, stock, is_active into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid;

    if v_product.id is null or not v_product.is_active then
      raise exception 'Some items in your cart are no longer available. Please remove them and try again.';
    end if;
    if v_product.stock < (v_item ->> 'quantity')::int then
      raise exception 'Not enough stock for: %. Please update the quantity in your cart and try again.', v_product.name_en;
    end if;

    v_subtotal := v_subtotal + v_product.price * (v_item ->> 'quantity')::int;
  end loop;

  v_order_number := 'ETM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(v_order_id::text), 1, 4));

  insert into public.orders (
    id, user_id, order_number, status, payment_method, payment_status,
    subtotal, delivery_fee, discount, total, delivery_address, status_history
  ) values (
    v_order_id, auth.uid(), v_order_number, 'pending', p_payment_method, p_payment_status,
    v_subtotal, p_delivery_fee, 0, v_subtotal + p_delivery_fee, p_delivery_address,
    jsonb_build_array(jsonb_build_object('status', 'pending', 'at', now()))
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, name_en, price into v_product from public.products where id = (v_item ->> 'product_id')::uuid;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total)
    values (
      v_order_id, v_product.id, v_product.name_en, (v_item ->> 'quantity')::int,
      v_product.price, v_product.price * (v_item ->> 'quantity')::int
    );

    update public.products set stock = stock - (v_item ->> 'quantity')::int where id = v_product.id;
  end loop;

  return v_order;
end;
$$;

-- ============================================================
-- migrations/0004_rls.sql
-- ============================================================
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

-- ============================================================
-- migrations/0005_seed_homepage_sections.sql
-- ============================================================
insert into public.homepage_sections (section_key, content) values
('hero', jsonb_build_object(
  'headline', 'Find something you''ll love.',
  'subtext', 'Discover everyday products, special offers, and carefully selected essentials.',
  'cta_label', 'Shop Now',
  'cta_href', '/shop',
  'secondary_cta_label', 'Explore Categories',
  'secondary_cta_href', '/categories'
)),
('promo', jsonb_build_object(
  'eyebrow', 'Flash sale',
  'headline', 'Save on selected items, for a limited time',
  'subtext', 'Discounts across fashion, electronics, kitchen, and more.',
  'cta_label', 'Shop the deals',
  'cta_href', '#flash-deals'
));

-- ============================================================
-- migrations/0006_storage.sql
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('products',   'products',   true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('categories', 'categories', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('banners',    'banners',    true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars',    'avatars',    false, 2097152, array['image/jpeg','image/png','image/webp']);

-- public buckets: public read, admin-only write
create policy "products_bucket_public_read" on storage.objects
  for select using (bucket_id = 'products');
create policy "products_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'products' and public.is_admin());
create policy "products_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'products' and public.is_admin());
create policy "products_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'products' and public.is_admin());

create policy "categories_bucket_public_read" on storage.objects
  for select using (bucket_id = 'categories');
create policy "categories_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'categories' and public.is_admin());
create policy "categories_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'categories' and public.is_admin());
create policy "categories_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'categories' and public.is_admin());

create policy "banners_bucket_public_read" on storage.objects
  for select using (bucket_id = 'banners');
create policy "banners_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "banners_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'banners' and public.is_admin());
create policy "banners_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'banners' and public.is_admin());

-- avatars: private, per-user folder ({user_id}/...), admin can read all
create policy "avatars_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
create policy "avatars_write_own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- migrations/0007_security_hardening.sql
-- ============================================================
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

-- ============================================================
-- migrations/0008_fix_admin_promotion.sql
-- ============================================================
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

-- ============================================================
-- migrations/0009_place_order_definer.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- Found by running the checkout path as a real (non-admin) customer:
--
--  1. place_order was SECURITY INVOKER, so its `update products set stock = ...`
--     ran under the customer's RLS. Customers correctly have no UPDATE policy
--     on products, so the decrement silently changed 0 rows (stock 24 -> 24) and
--     the FOR UPDATE lock protected nothing — two customers could buy the last
--     unit at the same time.
--  2. orders_insert_own / order_items_insert_own let a customer INSERT an order
--     row directly (status 'delivered', payment_status 'paid', total 0),
--     bypassing place_order's stock check and server-side pricing entirely.
--
-- Fix: place_order runs with definer rights (so it can lock + decrement stock
-- and write the order), validates the caller itself, and is the ONLY way an
-- order or its line items can be created — customers lose direct INSERT.
-- ---------------------------------------------------------------------------

create or replace function public.place_order(
  p_delivery_address jsonb,
  p_payment_method payment_method,
  p_payment_status payment_status,
  p_delivery_fee numeric,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_order public.orders;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
begin
  -- Definer rights bypass RLS, so identity must be checked explicitly.
  if auth.uid() is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if p_delivery_fee is null or p_delivery_fee < 0 then
    raise exception 'Invalid delivery fee.';
  end if;

  -- Lock every referenced product row up front (stable order by id avoids
  -- deadlocks between two concurrent checkouts sharing products).
  perform 1 from public.products
  where id in (select (elem ->> 'product_id')::uuid from jsonb_array_elements(p_items) elem)
  order by id
  for update;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item ->> 'quantity')::int is null or (v_item ->> 'quantity')::int <= 0 then
      raise exception 'Invalid quantity.';
    end if;

    select id, name_en, price, stock, is_active into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid;

    if v_product.id is null or not v_product.is_active then
      raise exception 'Some items in your cart are no longer available. Please remove them and try again.';
    end if;
    if v_product.stock < (v_item ->> 'quantity')::int then
      raise exception 'Not enough stock for: %. Please update the quantity in your cart and try again.', v_product.name_en;
    end if;

    v_subtotal := v_subtotal + v_product.price * (v_item ->> 'quantity')::int;
  end loop;

  v_order_number := 'ETM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(v_order_id::text), 1, 4));

  insert into public.orders (
    id, user_id, order_number, status, payment_method, payment_status,
    subtotal, delivery_fee, discount, total, delivery_address, status_history
  ) values (
    v_order_id, auth.uid(), v_order_number, 'pending', p_payment_method, p_payment_status,
    v_subtotal, p_delivery_fee, 0, v_subtotal + p_delivery_fee, p_delivery_address,
    jsonb_build_array(jsonb_build_object('status', 'pending', 'at', now()))
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, name_en, price into v_product from public.products where id = (v_item ->> 'product_id')::uuid;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total)
    values (
      v_order_id, v_product.id, v_product.name_en, (v_item ->> 'quantity')::int,
      v_product.price, v_product.price * (v_item ->> 'quantity')::int
    );

    update public.products set stock = stock - (v_item ->> 'quantity')::int where id = v_product.id;
  end loop;

  return v_order;
end;
$$;

-- Only signed-in customers may call it (functions are executable by PUBLIC by default).
revoke execute on function public.place_order(jsonb, payment_method, payment_status, numeric, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, payment_method, payment_status, numeric, jsonb) to authenticated;

-- With place_order as the sole writer, customers no longer need (or get) direct INSERT.
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "order_items_insert_own" on public.order_items;

-- ============================================================
-- migrations/0010_server_owned_order_pricing.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- Found while wiring checkout to place_order (0009): the function still took
-- `p_payment_status` and `p_delivery_fee` from the CLIENT. Anyone calling
-- /rest/v1/rpc/place_order directly could therefore create an order flagged
-- 'paid' or with a delivery fee of 0 — the same "never trust a client-supplied
-- price" problem 0009 fixed for line prices, left open for these two fields.
--
-- Fix: the server decides both.
--   * delivery fee  -> looked up from a real `delivery_fees` table (this is the
--     "real DB-backed lookup" services/delivery.ts always said Phase 12 would
--     bring), falling back to the 'Other' row for an unlisted city.
--   * payment status -> derived from the payment method: cash on delivery is
--     'pending' until the courier collects. Non-COD methods are rejected (the
--     UI already marks them unavailable; now the database agrees).
-- The delivery address is also validated server-side, not only in the form.
-- ---------------------------------------------------------------------------

create table public.delivery_fees (
  city text primary key,
  fee numeric(12,2) not null check (fee >= 0)
);

alter table public.delivery_fees enable row level security;

-- Public read: the checkout page shows the fee before login-gated actions,
-- and the fee table holds nothing sensitive.
create policy "delivery_fees_select_public" on public.delivery_fees
  for select using (true);
create policy "delivery_fees_admin_insert" on public.delivery_fees
  for insert with check (public.is_admin());
create policy "delivery_fees_admin_update" on public.delivery_fees
  for update using (public.is_admin()) with check (public.is_admin());
create policy "delivery_fees_admin_delete" on public.delivery_fees
  for delete using (public.is_admin());

-- Same values services/delivery.ts hardcoded until now.
insert into public.delivery_fees (city, fee) values
  ('Addis Ababa', 100),
  ('Adama',       150),
  ('Bahir Dar',   200),
  ('Hawassa',     200),
  ('Dire Dawa',   200),
  ('Mekelle',     250),
  ('Gondar',      200),
  ('Jimma',       200),
  ('Other',       150);

-- Replace the 5-argument version (no other overload may remain, or the old
-- client-priced signature would stay callable).
drop function if exists public.place_order(jsonb, payment_method, payment_status, numeric, jsonb);

create function public.place_order(
  p_delivery_address jsonb,
  p_payment_method payment_method,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_delivery_fee numeric(12,2);
  v_order public.orders;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
begin
  -- Definer rights bypass RLS, so identity must be checked explicitly.
  if auth.uid() is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if p_payment_method <> 'cod' then
    raise exception 'This payment method isn''t available yet.';
  end if;

  if p_delivery_address is null
     or jsonb_typeof(p_delivery_address) <> 'object'
     or coalesce(btrim(p_delivery_address ->> 'full_name'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'phone'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'city'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'sub_city'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'woreda'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'address'), '') = '' then
    raise exception 'Delivery address is incomplete.';
  end if;

  select fee into v_delivery_fee from public.delivery_fees where city = p_delivery_address ->> 'city';
  if v_delivery_fee is null then
    select fee into v_delivery_fee from public.delivery_fees where city = 'Other';
  end if;
  if v_delivery_fee is null then
    raise exception 'Delivery is not available for this address.';
  end if;

  -- Lock every referenced product row up front (stable order by id avoids
  -- deadlocks between two concurrent checkouts sharing products).
  perform 1 from public.products
  where id in (select (elem ->> 'product_id')::uuid from jsonb_array_elements(p_items) elem)
  order by id
  for update;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item ->> 'quantity')::int is null or (v_item ->> 'quantity')::int <= 0 then
      raise exception 'Invalid quantity.';
    end if;

    select id, name_en, price, stock, is_active into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid;

    if v_product.id is null or not v_product.is_active then
      raise exception 'Some items in your cart are no longer available. Please remove them and try again.';
    end if;
    if v_product.stock < (v_item ->> 'quantity')::int then
      raise exception 'Not enough stock for: %. Please update the quantity in your cart and try again.', v_product.name_en;
    end if;

    v_subtotal := v_subtotal + v_product.price * (v_item ->> 'quantity')::int;
  end loop;

  v_order_number := 'ETM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(v_order_id::text), 1, 4));

  insert into public.orders (
    id, user_id, order_number, status, payment_method, payment_status,
    subtotal, delivery_fee, discount, total, delivery_address, status_history
  ) values (
    v_order_id, auth.uid(), v_order_number, 'pending', p_payment_method, 'pending',
    v_subtotal, v_delivery_fee, 0, v_subtotal + v_delivery_fee, p_delivery_address,
    jsonb_build_array(jsonb_build_object('status', 'pending', 'at', now()))
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, name_en, price into v_product from public.products where id = (v_item ->> 'product_id')::uuid;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total)
    values (
      v_order_id, v_product.id, v_product.name_en, (v_item ->> 'quantity')::int,
      v_product.price, v_product.price * (v_item ->> 'quantity')::int
    );

    update public.products set stock = stock - (v_item ->> 'quantity')::int where id = v_product.id;
  end loop;

  return v_order;
end;
$$;

revoke execute on function public.place_order(jsonb, payment_method, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, payment_method, jsonb) to authenticated;

-- ============================================================
-- migrations/0011_fix_user_deletion_cascade.sql
-- ============================================================
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

-- ============================================================
-- migrations/0012_newsletter_subscribers.sql
-- ============================================================
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

-- ============================================================
-- migrations/0013_homepage_amharic_copy.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- Phase 13 (Localization): the homepage hero and promo banner are editable
-- text stored as JSON in homepage_sections. Each visible text now has an
-- Amharic sibling key (`headline` -> `headline_am`, and so on); a missing or
-- empty Amharic value falls back to the English one in the storefront.
--
-- This gives the two seeded rows their Amharic copy. It is a plain data
-- update (no schema change) and it NEVER overwrites something an admin
-- already wrote: in `new || existing` the right-hand operand wins, so any
-- non-empty `*_am` value already present is kept. Empty-string `*_am` values
-- count as "not written" and are dropped first, so they don't block the
-- defaults from being filled in.
--
-- The Amharic wording is a first draft — have a native speaker review it
-- (the admin can edit every line under /admin/homepage without a migration).
-- ---------------------------------------------------------------------------

update public.homepage_sections hs
set content = jsonb_build_object(
  'headline_am', 'የሚወዱትን ያግኙ።',
  'subtext_am', 'የዕለት ተዕለት ምርቶችን፣ ልዩ ቅናሾችን እና በጥንቃቄ የተመረጡ አስፈላጊ ዕቃዎችን ያግኙ።',
  'cta_label_am', 'አሁን ይግዙ',
  'secondary_cta_label_am', 'ምድቦችን ያስሱ'
) || coalesce(
  (select jsonb_object_agg(e.key, e.value)
   from jsonb_each(hs.content) e
   where not (e.key like '%\_am' and e.value = '""'::jsonb)),
  '{}'::jsonb
)
where hs.section_key = 'hero';

update public.homepage_sections hs
set content = jsonb_build_object(
  'eyebrow_am', 'ፈጣን ቅናሽ',
  'headline_am', 'በተመረጡ ምርቶች ላይ ይቆጥቡ፣ ለተወሰነ ጊዜ ብቻ',
  'subtext_am', 'በፋሽን፣ በኤሌክትሮኒክስ፣ በወጥ ቤት ዕቃዎች እና በሌሎችም ላይ ቅናሾች።',
  'cta_label_am', 'ቅናሾችን ይመልከቱ'
) || coalesce(
  (select jsonb_object_agg(e.key, e.value)
   from jsonb_each(hs.content) e
   where not (e.key like '%\_am' and e.value = '""'::jsonb)),
  '{}'::jsonb
)
where hs.section_key = 'promo';

-- ============================================================
-- migrations/0014_free_delivery_threshold.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- The storefront announces "Free delivery on orders over 2,000 ETB". Nothing
-- in the database honoured that: delivery was priced per city only. A banner
-- promising something checkout doesn't do would be a lie, so the rule now
-- lives in the database, where the price is decided.
--
--   * store_settings: a small key/value table for shop-wide settings. Public
--     read (the storefront shows the threshold), admin write.
--   * 'free_delivery_threshold' (ETB): orders whose subtotal is strictly ABOVE
--     it ship free. Delete the row and there is no free delivery — and the
--     storefront stops advertising it, because the banner reads the same row.
--   * place_order applies it. The client only previews the fee; this is where
--     it is actually charged, like every other price in the order.
-- ---------------------------------------------------------------------------

create table public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  -- place_order reads this as a number; a malformed value must be rejected
  -- when it is written, not discovered when a customer checks out.
  constraint store_settings_free_delivery_threshold_valid check (
    key <> 'free_delivery_threshold'
    or (jsonb_typeof(value) = 'number' and (value #>> '{}')::numeric > 0)
  )
);

alter table public.store_settings enable row level security;

create policy "store_settings_select_public" on public.store_settings
  for select using (true);
create policy "store_settings_admin_insert" on public.store_settings
  for insert with check (public.is_admin());
create policy "store_settings_admin_update" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "store_settings_admin_delete" on public.store_settings
  for delete using (public.is_admin());

insert into public.store_settings (key, value) values ('free_delivery_threshold', '2000'::jsonb);

-- Same as 0010's place_order, plus the free-delivery rule after the subtotal
-- is known. Same signature, so existing grants carry over (re-stated below).
create or replace function public.place_order(
  p_delivery_address jsonb,
  p_payment_method payment_method,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_delivery_fee numeric(12,2);
  v_free_threshold numeric;
  v_order public.orders;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
begin
  -- Definer rights bypass RLS, so identity must be checked explicitly.
  if auth.uid() is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if p_payment_method <> 'cod' then
    raise exception 'This payment method isn''t available yet.';
  end if;

  if p_delivery_address is null
     or jsonb_typeof(p_delivery_address) <> 'object'
     or coalesce(btrim(p_delivery_address ->> 'full_name'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'phone'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'city'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'sub_city'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'woreda'), '') = ''
     or coalesce(btrim(p_delivery_address ->> 'address'), '') = '' then
    raise exception 'Delivery address is incomplete.';
  end if;

  select fee into v_delivery_fee from public.delivery_fees where city = p_delivery_address ->> 'city';
  if v_delivery_fee is null then
    select fee into v_delivery_fee from public.delivery_fees where city = 'Other';
  end if;
  if v_delivery_fee is null then
    raise exception 'Delivery is not available for this address.';
  end if;

  select (value #>> '{}')::numeric into v_free_threshold
  from public.store_settings
  where key = 'free_delivery_threshold' and jsonb_typeof(value) = 'number';

  -- Lock every referenced product row up front (stable order by id avoids
  -- deadlocks between two concurrent checkouts sharing products).
  perform 1 from public.products
  where id in (select (elem ->> 'product_id')::uuid from jsonb_array_elements(p_items) elem)
  order by id
  for update;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item ->> 'quantity')::int is null or (v_item ->> 'quantity')::int <= 0 then
      raise exception 'Invalid quantity.';
    end if;

    select id, name_en, price, stock, is_active into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid;

    if v_product.id is null or not v_product.is_active then
      raise exception 'Some items in your cart are no longer available. Please remove them and try again.';
    end if;
    if v_product.stock < (v_item ->> 'quantity')::int then
      raise exception 'Not enough stock for: %. Please update the quantity in your cart and try again.', v_product.name_en;
    end if;

    v_subtotal := v_subtotal + v_product.price * (v_item ->> 'quantity')::int;
  end loop;

  -- "Over" the threshold means strictly above it, exactly as advertised.
  if v_free_threshold is not null and v_subtotal > v_free_threshold then
    v_delivery_fee := 0;
  end if;

  v_order_number := 'ETM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(v_order_id::text), 1, 4));

  insert into public.orders (
    id, user_id, order_number, status, payment_method, payment_status,
    subtotal, delivery_fee, discount, total, delivery_address, status_history
  ) values (
    v_order_id, auth.uid(), v_order_number, 'pending', p_payment_method, 'pending',
    v_subtotal, v_delivery_fee, 0, v_subtotal + v_delivery_fee, p_delivery_address,
    jsonb_build_array(jsonb_build_object('status', 'pending', 'at', now()))
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, name_en, price into v_product from public.products where id = (v_item ->> 'product_id')::uuid;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total)
    values (
      v_order_id, v_product.id, v_product.name_en, (v_item ->> 'quantity')::int,
      v_product.price, v_product.price * (v_item ->> 'quantity')::int
    );

    update public.products set stock = stock - (v_item ->> 'quantity')::int where id = v_product.id;
  end loop;

  return v_order;
end;
$$;

revoke execute on function public.place_order(jsonb, payment_method, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, payment_method, jsonb) to authenticated;

-- ============================================================
-- migrations/0015_performance_indexes.sql
-- ============================================================
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

-- ============================================================
-- migrations/0016_ethio_mart_homepage_copy.sql
-- ============================================================
-- ---------------------------------------------------------------------------
-- Ethio Mart storefront redesign: the homepage copy the redesign shows.
--
-- Homepage text is admin-editable (Admin -> Homepage, stored in
-- homepage_sections). This moves the two seeded rows from the original wording
-- to the Ethio Mart wording, in English and Amharic — but ONLY while a row still
-- has its original seed headline. If an admin has already rewritten it, it is
-- left exactly as they wrote it.
--
--   * `\n` in the hero headline is a deliberate line break.
--   * `{maxDiscount}` in the promo headline is replaced by the storefront with
--     the biggest discount among products really on sale, so the banner can't
--     promise a discount that doesn't exist.
--   * The promo's optional `ends_at` (an ISO date-time) is NOT set here: with no
--     end date the storefront shows no countdown. Set it in Admin -> Homepage
--     to start one.
--
-- The Amharic wording is a first draft; have a native speaker review it.
-- ---------------------------------------------------------------------------

update public.homepage_sections
set content = content || jsonb_build_object(
      'headline', E'Everything You Love,\nAll in One Place.',
      'headline_am', E'የሚወዱትን ሁሉ፣\nበአንድ ቦታ።',
      'subtext', 'Discover quality products for your home, kitchen, family, and everyday life.',
      'subtext_am', 'ለቤትዎ፣ ለወጥ ቤትዎ፣ ለቤተሰብዎ እና ለዕለት ተዕለት ኑሮዎ ጥራት ያላቸው ምርቶችን ያግኙ።',
      'cta_label_am', 'አሁን ይግዙ',
      'secondary_cta_label_am', 'ምድቦችን ያስሱ'
    ),
    updated_at = now()
where section_key = 'hero'
  and content ->> 'headline' = 'Find something you''ll love.';

update public.homepage_sections
set content = content || jsonb_build_object(
      'eyebrow', 'Today''s Special Deals',
      'eyebrow_am', 'የዛሬ ልዩ ቅናሾች',
      'headline', 'Up to {maxDiscount}% Off',
      'headline_am', 'እስከ {maxDiscount}% ቅናሽ',
      'subtext', 'On selected home, kitchen, and lifestyle products.',
      'subtext_am', 'በተመረጡ የቤት፣ የወጥ ቤት እና የአኗኗር ዘይቤ ምርቶች ላይ።',
      'cta_label', 'Shop Deals',
      'cta_label_am', 'ቅናሾችን ይግዙ',
      'cta_href', '/deals'
    ),
    updated_at = now()
where section_key = 'promo'
  and content ->> 'headline' = 'Save on selected items, for a limited time';

-- The navigation now has a "Home" link (the homepage) beside the category
-- links, so the "Home" category is named for what it holds.
update public.categories
set name_en = 'Home & Living',
    name_am = 'ቤት እና አኗኗር'
where slug = 'home' and name_en = 'Home';


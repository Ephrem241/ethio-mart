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

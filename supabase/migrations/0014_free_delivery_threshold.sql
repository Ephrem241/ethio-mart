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

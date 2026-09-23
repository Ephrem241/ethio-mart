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

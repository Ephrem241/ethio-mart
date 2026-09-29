-- 0018: order status moves forward only, cancelling returns stock, and a
-- product in a switched-off category can no longer be ordered.
--
-- 1. Status transitions (replaces the guard from 0003). An order moves forward
--    along pending → confirmed → preparing → shipped → delivered — skipping a
--    stage is allowed (an operator may have missed one) — or to cancelled from
--    any open status. delivered and cancelled stay final. Going backwards, or
--    "changing" to the same status, is refused.
-- 2. Moving an order to cancelled puts every line's quantity back on its
--    product (place_order took it off). Lines whose product has since been
--    deleted (product_id is null) have nothing to return to and are skipped.
--    It happens in the trigger, so every way of cancelling is covered.
-- 3. place_order also refuses products whose category is inactive: the shop
--    hides them, so a stale cart must not be able to buy one.
--
-- The function is SECURITY DEFINER (with a pinned search_path) so the stock
-- update never depends on the caller's row-level-security rights; who may
-- change an order at all is still decided by the orders RLS policies.

create or replace function public.orders_enforce_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('delivered', 'cancelled') then
    raise exception 'Cannot change status of a % order.', old.status;
  end if;
  if new.status = old.status then
    raise exception 'Order is already in this status.';
  end if;
  -- Forward only: the enum is declared in lifecycle order (0001), so "later"
  -- is simply "greater"; cancelled (declared last) is allowed from any open status.
  if new.status <> 'cancelled' and new.status < old.status then
    raise exception 'An order can''t go from % to %.', old.status, new.status;
  end if;

  -- Summed per product first: an order can hold the same product on two lines,
  -- and UPDATE ... FROM would apply only one of them.
  if new.status = 'cancelled' then
    update public.products p
    set stock = p.stock + oi.quantity
    from (
      select product_id, sum(quantity)::int as quantity
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id
    ) oi
    where oi.product_id = p.id;
  end if;

  new.status_history := old.status_history || jsonb_build_object('status', new.status, 'at', now());
  new.updated_at := now();
  return new;
end;
$$;

-- place_order: as in 0014, plus the category check (see note 3 above).
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

    select p.id, p.name_en, p.price, p.stock, p.is_active, c.is_active as category_active into v_product
    from public.products p
    join public.categories c on c.id = p.category_id
    where p.id = (v_item ->> 'product_id')::uuid;

    if v_product.id is null or not v_product.is_active or not v_product.category_active then
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

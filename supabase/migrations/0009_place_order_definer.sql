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

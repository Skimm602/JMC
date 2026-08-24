-- ---------------------------------------------------------------------------
-- One-off cleanup: remove test purchases from the admin orders board.
--
-- This has to run in the Supabase SQL editor, not from the app. Orders carry
-- no delete policy for any role on purpose — supabase-orders-checkout.sql
-- leaves them insert/select only, and supabase-admin-setup.sql keeps them
-- even when the customer account is deleted, because "an order is a financial
-- record and should outlive the customer". Nothing in the running site can
-- remove one, which is correct for real trade and is exactly why clearing
-- test rows needs the postgres role.
--
-- Run STEP 1 first and read the result. Only orders whose ids you paste into
-- STEP 2 are touched; everything else — products, accounts, cart items,
-- support requests — is left alone.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- STEP 1 — review. Read-only, changes nothing. Run this on its own.
--
-- holds_stock marks the orders whose items have already come off the shelf:
-- stock leaves on the move out of 'paid' and only comes back on a cancel from
-- 'processing'/'shipped' (see admin_set_order_status in
-- supabase-admin-orders-products.sql). STEP 2 credits those back.
--
-- storage_files lists proof uploads. Deleting the row does NOT delete these —
-- see the note at the bottom.
-- ---------------------------------------------------------------------------
select
  o.id,
  o.created_at,
  o.status,
  o.total,
  pr.email                                                as customer_email,
  pr.full_name                                            as customer_name,
  count(oi.id)                                            as line_items,
  (o.status in ('processing', 'shipped', 'completed'))    as holds_stock,
  nullif(
    concat_ws(' | ',
      o.payment_proof_path,
      o.delivery_proof_path,
      o.vat_exempt_proof_path),
    '')                                                   as storage_files
from public.orders o
left join public.profiles pr on pr.id = o.user_id
left join public.order_items oi on oi.order_id = o.id
group by o.id, pr.email, pr.full_name
order by o.created_at desc;


-- ---------------------------------------------------------------------------
-- STEP 2 — delete. Paste the ids from STEP 1 into v_ids below, then run.
--
-- Deletes nothing while v_ids is empty, and refuses the whole batch if any id
-- is not a real order, so a mistyped id fails loudly instead of quietly
-- removing the rest. The Supabase editor runs this in one transaction: if it
-- raises, nothing is committed.
-- ---------------------------------------------------------------------------
do $$
declare
  -- ►► PASTE THE TEST ORDER IDs HERE, one per line, comma separated. ◄◄
  v_ids uuid[] := array[
    -- '00000000-0000-0000-0000-000000000000'
  ]::uuid[];

  v_missing     uuid[];
  v_products    int := 0;
  v_items       int := 0;
  v_orders      int := 0;
  v_item        record;
begin
  if v_ids is null or cardinality(v_ids) = 0 then
    raise exception
      'v_ids is empty — fill in the order ids from STEP 1. This script deletes nothing by default.';
  end if;

  -- Refuse the batch rather than delete a subset of it.
  select array_agg(x) into v_missing
    from unnest(v_ids) as x
   where not exists (select 1 from public.orders o where o.id = x);

  if v_missing is not null then
    raise exception 'Not real order ids, nothing deleted: %', v_missing;
  end if;

  -- Put stock back for the orders that already took it off the shelf. A
  -- null stock_quantity means that product's shelf is untracked, so it is
  -- left null rather than credited.
  for v_item in
    select oi.product_id, sum(oi.quantity) as qty
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
     where o.id = any(v_ids)
       and o.status in ('processing', 'shipped', 'completed')
     group by oi.product_id
  loop
    update public.products
       set stock_quantity = stock_quantity + v_item.qty
     where id = v_item.product_id
       and stock_quantity is not null;

    v_products := v_products + 1;
  end loop;

  delete from public.order_items where order_id = any(v_ids);
  get diagnostics v_items = row_count;

  delete from public.orders where id = any(v_ids);
  get diagnostics v_orders = row_count;

  raise notice 'Deleted % order(s) and % line item(s); credited stock back on % product(s).',
    v_orders, v_items, v_products;
end $$;


-- ---------------------------------------------------------------------------
-- STEP 3 — confirm. Should return zero rows for the ids you deleted.
-- ---------------------------------------------------------------------------
-- select id, status, total from public.orders order by created_at desc;


-- ---------------------------------------------------------------------------
-- Not handled here: proof uploads.
--
-- payment_proof_path, delivery_proof_path and vat_exempt_proof_path point at
-- objects in the payment-proofs, delivery-proofs and vat-exemption-proofs
-- buckets. Deleting an order row leaves those files in storage. They are
-- private buckets reachable only through signed URLs, so nothing is exposed,
-- but if you want them gone, take the paths from STEP 1's storage_files
-- column and remove them under Storage in the Supabase dashboard.
-- ---------------------------------------------------------------------------

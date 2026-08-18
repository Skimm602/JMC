-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  The confirmation call, as a step inside the order.
--
--  Checkout is open: a customer picks a product and places an order the
--  ordinary way. What changes is what happens next. The order lands as
--  `pending` and nothing moves until somebody from VIP has phoned to confirm
--  it — sizing, install, delivery. After that call an admin approves it, and
--  only then is the customer asked to pay and attach proof of it.
--
--    pending    order placed, waiting for the confirmation call
--    approved   call done; the customer may now pay and upload proof
--    paid       an admin has seen the proof and confirmed the money arrived
--    processing / shipped / completed
--
--  Stock is still deducted on the move to `paid`, unchanged — an approved
--  order has not been paid for, and reserving stock against an unpaid order
--  is how a warehouse ends up with none.
--
--  Payment happens outside the site, however the customer and the agent
--  agreed on the call. The site collects a photo of it; an admin reads that
--  before moving the order to paid.
--
--  Safe to run more than once.
-- ===========================================================================

begin;

-- ===========================================================================
-- 1. PROOF OF PAYMENT ON THE ORDER
--
--    The column holds a storage *path*, not a URL, and is named for it. A
--    payment proof is a screenshot of somebody's bank app — it belongs in a
--    private bucket the back office reads through short-lived signed URLs,
--    exactly as verification documents already do. A public URL sitting in a
--    database column is a receipt anybody who guesses the path can read.
-- ===========================================================================

alter table public.orders add column if not exists payment_proof_path        text;
alter table public.orders add column if not exists payment_proof_uploaded_at timestamptz;
alter table public.orders add column if not exists approved_at               timestamptz;

-- payment_method was NOT NULL for the old gateway's three values. Orders now
-- arrive without one — the proof shows what was used — so the constraint has
-- to go. Guarded, because a second run has nothing to drop.
do $do$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'orders'
       and column_name = 'payment_method' and is_nullable = 'NO'
  ) then
    alter table public.orders alter column payment_method drop not null;
  end if;
end
$do$;


-- ===========================================================================
-- 2. THE NEW STEP IN THE LIFECYCLE
--
--    Only the transition list changes. Everything else in
--    admin_set_order_status() — the admin check, the row lock, the stock
--    deduction — is left as it was, moved to fire on approved -> paid.
-- ===========================================================================

create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_current text;
  v_item    record;
  v_have    integer;
begin
  if not public.is_admin() then
    return false;
  end if;

  select status into v_current from public.orders where id = p_order_id for update;
  if v_current is null then
    return false;
  end if;

  if not (
    -- The confirmation call sits here: a pending order is approved, never
    -- paid directly. Cancelling straight from pending stays available for
    -- the call that ends with "not proceeding".
    (v_current in ('pending', 'pending_bank_transfer') and p_status in ('approved', 'cancelled'))
    or (v_current = 'approved'   and p_status in ('paid', 'cancelled'))
    or (v_current = 'paid'       and p_status in ('processing', 'shipped', 'completed', 'cancelled'))
    or (v_current = 'processing' and p_status in ('shipped', 'completed', 'cancelled'))
    or (v_current = 'shipped'    and p_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Order % cannot move from % to %.', p_order_id, v_current, p_status
      using errcode = 'check_violation';
  end if;

  -- Stock comes off when the money is confirmed, not when the call ends. An
  -- approved order has not been paid for, and holding stock against one is
  -- how a warehouse ends up with none.
  if v_current = 'approved' and p_status = 'paid' then
    for v_item in
      select oi.product_id, sum(oi.quantity) as qty
      from public.order_items oi
      where oi.order_id = p_order_id
      group by oi.product_id
    loop
      select stock_quantity into v_have from public.products where id = v_item.product_id for update;

      if v_have is null then
        raise exception 'A product on this order no longer exists in the catalogue.'
          using errcode = 'check_violation';
      end if;

      if v_have < v_item.qty then
        raise exception 'Only % left in stock for one of the items on this order, which needs %.', v_have, v_item.qty
          using errcode = 'check_violation';
      end if;

      update public.products set stock_quantity = stock_quantity - v_item.qty where id = v_item.product_id;
    end loop;
  end if;

  update public.orders
     set status = p_status,
         approved_at = case when p_status = 'approved' then now() else approved_at end
   where id = p_order_id;

  return true;
end;
$fn$;

grant execute on function public.admin_set_order_status(uuid, text) to authenticated;


-- ===========================================================================
-- 3. THE CUSTOMER ATTACHES THEIR PAYMENT
--
--    Only on their own order, and only while it is approved — before the call
--    there is nothing to pay for, and after `paid` the record should not move.
--    Application code checks the same thing first for a readable message;
--    this is what makes the rule true.
-- ===========================================================================

drop policy if exists "Customers attach payment to an approved order" on public.orders;
create policy "Customers attach payment to an approved order" on public.orders
  for update to authenticated
  using (user_id = auth.uid() and status = 'approved')
  with check (user_id = auth.uid() and status = 'approved');


-- ===========================================================================
-- 4. THE PAYMENT-PROOF BUCKET
--
--    Private. Files are filed under the customer's own uuid, and the policies
--    are what make that prefix mean something: a customer writes into their
--    own folder and reads back what they put there, and nobody else's. Admins
--    read everything, because confirming the money arrived is the whole job.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Customers upload their own payment proof" on storage.objects;
create policy "Customers upload their own payment proof" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Customers read their own payment proof" on storage.objects;
create policy "Customers read their own payment proof" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Admins read every payment proof" on storage.objects;
create policy "Admins read every payment proof" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());


-- ===========================================================================
-- 5. UNDO THE AGENT-GATE EXPERIMENT
--
--    An earlier design put the call *before* checkout, behind a consultations
--    table that also gated order_items. The call is a step inside the order
--    instead, so that comes out and the plain ownership policy goes back.
--    Guarded — if that version was never run, these are all no-ops.
-- ===========================================================================

drop policy if exists "Customers add unlocked items to their own orders" on public.order_items;
drop policy if exists "Customers add items to their own orders" on public.order_items;
create policy "Customers add items to their own orders" on public.order_items
  for insert to authenticated
  with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

drop function if exists public.consultation_unlocked(uuid);
drop table if exists public.consultations;

commit;

-- ---------------------------------------------------------------------------
-- Check. The new columns, and the orders sitting at each status.
-- ---------------------------------------------------------------------------
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'orders'
   and column_name in ('payment_proof_path', 'payment_proof_uploaded_at', 'approved_at');

select status, count(*) from public.orders group by status order by status;

select id, public from storage.buckets where id = 'payment-proofs';

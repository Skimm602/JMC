-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  `orders`, `order_items` and `products` all have RLS enabled with zero
--  policies attached, which means nobody (not even the row's own owner) can
--  read or write them yet through the anon/authenticated client — every
--  request is rejected before the checkout code below ever runs. This wires
--  the minimum access Track A's gateway checkout needs:
--
--    products     ->  readable by anyone, so checkout can price a cart
--    orders       ->  a customer can insert/read their own; admins read all
--    order_items  ->  same, gated through the parent order's ownership
--
--  One transaction: if anything fails, nothing is applied.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Catalog is public read. Nothing here is sensitive, and checkout has to
--    look up retail_price/installer_price for whoever is buying.
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products" on public.products
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. Orders: a customer only ever sees/creates their own. There is no update
--    or delete policy for the authenticated role on purpose — once an order
--    is placed, moving it to 'paid' happens through mark_order_paid() below,
--    the same "no direct writes, only a guarded function" shape as
--    admins/is_admin() in supabase-open-admin-registration.sql.
-- ---------------------------------------------------------------------------
drop policy if exists "Customers insert their own orders" on public.orders;
create policy "Customers insert their own orders" on public.orders
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Customers view their own orders" on public.orders;
create policy "Customers view their own orders" on public.orders
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins view all orders" on public.orders;
create policy "Admins view all orders" on public.orders
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Order items carry no user_id of their own, so ownership is checked
--    through the parent order.
-- ---------------------------------------------------------------------------
drop policy if exists "Customers insert items on their own orders" on public.order_items;
create policy "Customers insert items on their own orders" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
       where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Customers view items on their own orders" on public.order_items;
create policy "Customers view items on their own orders" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
       where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins view all order items" on public.order_items;
create policy "Admins view all order items" on public.order_items
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. mark_order_paid() — the only way an order's status/paid_at ever change
--    after checkout creates it. Called from the gateway webhook route
--    (src/app/api/payments/webhook/route.js), which has no user session to
--    authenticate with, so this is granted to anon as well as authenticated.
--
--    Guard for now: the caller must already know the order's own
--    payment_reference (set server-side at checkout, never handed to the
--    browser as a bare id) and the order must still be pending. That is a
--    placeholder, not real webhook security — before wiring a live PSP,
--    replace it with verification of that provider's signed callback
--    (Xendit's `x-callback-token`, Maya's checkout-webhook secret, etc.) in
--    the route handler, ahead of this call.
-- ---------------------------------------------------------------------------
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_reference text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_matched boolean := false;
begin
  update public.orders
     set status = 'paid',
         paid_at = now()
   where id = p_order_id
     and payment_reference = p_payment_reference
     and status in ('pending', 'pending_bank_transfer')
  returning true into v_matched;

  return coalesce(v_matched, false);
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public;
grant execute on function public.mark_order_paid(uuid, text) to anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the policies created above.
-- ---------------------------------------------------------------------------
select schemaname, tablename, policyname, cmd
  from pg_policies
 where tablename in ('orders', 'order_items', 'products')
 order by tablename, policyname;

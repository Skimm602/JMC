-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  Gives the admin panel's Orders and Maintenance tabs something real to
--  talk to. Builds on the gateway-checkout schema from
--  supabase-orders-checkout.sql (payment_method / status lifecycle on
--  `orders`, already applied) — NOT on supabase-admin-setup.sql's orders
--  section, which assumed orders are typed in by an admin rather than paid
--  for by a customer and doesn't match the live table.
--
--  Sections:
--    1  products   ->  is_active flag + full admin CRUD (create/edit/remove)
--    2  orders     ->  admin_set_order_status(), the only way status moves
--                       once a customer's payment has landed
--
--  One transaction: if anything fails, nothing is applied.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Products: admins get full CRUD. A "removed" product with order history
--    behind it can't be hard-deleted (order_items still points at it, and an
--    order is a record of what was agreed — it must not lose its own line
--    items), so is_active is the real "remove" for anything that has ever
--    been ordered. deleteProduct() in catalogue.js tries a hard delete first
--    and falls back to this when the database refuses.
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists is_active boolean not null default true;

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Orders: nothing about status is writable directly by anyone, admin
--    included — mark_order_paid() (gateway webhook) and this function are the
--    only two doors. That keeps "what changed this order and when" answerable
--    from one place instead of scattered across every caller that could
--    issue a bare UPDATE.
--
--    Valid moves:
--      pending / pending_bank_transfer  -> cancelled              (stale, unpaid)
--      paid                             -> processing / shipped / completed / cancelled
--      processing                       -> shipped / completed / cancelled
--      shipped                          -> completed / cancelled
--      completed / cancelled            -> nothing (terminal)
--
--    Stock leaves the shelf exactly once: the moment an order moves off
--    'paid' into anything other than 'cancelled' — whichever fulfilment
--    status the admin picks first. Short stock fails the whole call, same
--    shape as approve_order() in the superseded admin-setup.sql: an order the
--    warehouse cannot fill is worse than one left one step behind.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
    (v_current in ('pending', 'pending_bank_transfer') and p_status = 'cancelled')
    or (v_current = 'paid'       and p_status in ('processing', 'shipped', 'completed', 'cancelled'))
    or (v_current = 'processing' and p_status in ('shipped', 'completed', 'cancelled'))
    or (v_current = 'shipped'    and p_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Order % cannot move from % to %.', p_order_id, v_current, p_status
      using errcode = 'check_violation';
  end if;

  if v_current = 'paid' and p_status <> 'cancelled' then
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

  update public.orders set status = p_status where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the new policy and the function.
-- ---------------------------------------------------------------------------
select policyname, cmd from pg_policies where tablename = 'products' order by policyname;
select routine_name from information_schema.routines
 where routine_schema = 'public' and routine_name = 'admin_set_order_status';

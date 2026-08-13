-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  Runs AFTER supabase-admin-orders-products.sql (admin_set_order_status())
--  and supabase-checkout-shipping.sql (street_address/city/province/postal_code).
--
--  Gives the admin Orders tab the rest of what running an order by hand
--  needs, now that no payment gateway is actually wired in yet:
--
--    1  Confirm payment  -> admin_set_order_status() gains pending /
--                           pending_bank_transfer -> paid, alongside the
--                           gateway webhook (mark_order_paid()) it already
--                           had as a second door. Both stamp paid_at.
--    2  Edit shipping    -> admin_update_order_address(), for a typo caught
--                           after the order was placed.
--    3  Tracking         -> two columns plus admin_update_order_tracking().
--    4  Internal notes   -> one column plus admin_update_order_notes(), never
--                           selected by getMyOrders() so a customer never sees
--                           what the back office wrote about their order.
--
--  Same shape as every write on `orders` before this: no bare UPDATE, only a
--  guarded, admin-checked function — see the note at the top of
--  supabase-admin-orders-products.sql.
--
--  One transaction: if anything fails, nothing is applied.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Columns.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists courier          text;
alter table public.orders add column if not exists tracking_number  text;
alter table public.orders add column if not exists admin_notes      text;

-- ---------------------------------------------------------------------------
-- 2. admin_set_order_status(): the same function, widened by one transition.
--    pending / pending_bank_transfer -> paid is an admin confirming a payment
--    that arrived outside any webhook — a bank transfer read off a bank
--    statement, or (until a real PSP is wired in) any method at all. It
--    stamps paid_at the same way mark_order_paid() does, so a receipt cannot
--    tell which of the two doors an order came through.
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
    (v_current in ('pending', 'pending_bank_transfer') and p_status in ('paid', 'cancelled'))
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

  update public.orders
     set status = p_status,
         paid_at = case when p_status = 'paid' then now() else paid_at end
   where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. admin_update_order_address() — fixing a typo in where an order ships,
--    caught after it was placed. All four parts are required, same rule
--    checkout itself applies, so an edit can never leave the address in a
--    state the warehouse cannot act on.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_order_address(
  p_order_id      uuid,
  p_street_address text,
  p_city           text,
  p_province       text,
  p_postal_code    text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    return false;
  end if;

  if coalesce(trim(p_street_address), '') = ''
     or coalesce(trim(p_city), '') = ''
     or coalesce(trim(p_province), '') = ''
     or p_postal_code !~ '^\d{4}$' then
    raise exception 'Street address, city, province and a four-digit ZIP are all required.'
      using errcode = 'check_violation';
  end if;

  update public.orders
     set street_address = trim(p_street_address),
         city            = trim(p_city),
         province        = trim(p_province),
         postal_code     = p_postal_code
   where id = p_order_id;

  return found;
end;
$$;

revoke all on function public.admin_update_order_address(uuid, text, text, text, text) from public, anon;
grant execute on function public.admin_update_order_address(uuid, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. admin_update_order_tracking() — courier and tracking number, both
--    nullable and settable independently of order status: a courier is often
--    known before the parcel is marked shipped, not after.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_order_tracking(
  p_order_id         uuid,
  p_courier          text,
  p_tracking_number  text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    return false;
  end if;

  update public.orders
     set courier         = nullif(trim(p_courier), ''),
         tracking_number = nullif(trim(p_tracking_number), '')
   where id = p_order_id;

  return found;
end;
$$;

revoke all on function public.admin_update_order_tracking(uuid, text, text) from public, anon;
grant execute on function public.admin_update_order_tracking(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. admin_update_order_notes() — internal only. Never selected by
--    getMyOrders() (src/app/actions/account.js), so what one admin writes
--    here for another never reaches the customer it is about.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_order_notes(p_order_id uuid, p_notes text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    return false;
  end if;

  update public.orders set admin_notes = nullif(trim(p_notes), '') where id = p_order_id;

  return found;
end;
$$;

revoke all on function public.admin_update_order_notes(uuid, text) from public, anon;
grant execute on function public.admin_update_order_notes(uuid, text) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the three new columns and the four functions.
-- ---------------------------------------------------------------------------
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'orders'
   and column_name in ('courier', 'tracking_number', 'admin_notes')
 order by column_name;

select routine_name from information_schema.routines
 where routine_schema = 'public'
   and routine_name in (
     'admin_set_order_status', 'admin_update_order_address',
     'admin_update_order_tracking', 'admin_update_order_notes'
   )
 order by routine_name;

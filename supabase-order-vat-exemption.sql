-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  VAT exemption, decided on the confirmation call.
--
--  A customer who qualifies for a statutory exemption — senior citizen, PWD,
--  or another documented case — says so on the call an admin already makes
--  before every order is approved (see supabase-checkout-shipping.sql). They
--  attach a photo or scan of what it rests on from their own account, the
--  same shape as a payment or delivery proof; an admin reviews it and, if it
--  holds up, zeros the 12 % on that one order — only while the order is
--  still `pending`, because once it is `approved` the customer has been told
--  a total and it must not move under them.
--
--  Safe to run more than once.
-- ===========================================================================

begin;

-- ===========================================================================
-- 0. UNDO EARLIER DRAFTS
--
--    Two false starts before this shape: first a typed-in ID/certificate
--    number, then an admin-uploaded attachment. Both are cleared so re-running
--    this script lands on the one shape below regardless of which (if either)
--    was run before. No-op if neither ever was.
-- ===========================================================================

alter table public.orders drop constraint if exists orders_vat_exempt_reference_check;
alter table public.orders drop column if exists vat_exempt_reference;

drop function if exists public.admin_set_order_vat_exempt(uuid, boolean, text);
drop policy if exists "Admins manage VAT exemption proofs" on storage.objects;

-- ===========================================================================
-- 1. THE EXEMPTION, ON THE ORDER
--
--    Kept on the order rather than the profile: this is a fact about this
--    sale, decided on this call, not a standing status that would silently
--    zero VAT on every order the customer places afterwards.
--
--    The proof path is not cleared when vat_exempt is toggled off — an admin
--    flipping it back off does not need the customer to re-send the same
--    document if it turns out to still apply.
-- ===========================================================================

alter table public.orders add column if not exists vat_exempt            boolean not null default false;
alter table public.orders add column if not exists vat_exempt_proof_path text;

alter table public.orders drop constraint if exists orders_vat_exempt_proof_check;
alter table public.orders add constraint orders_vat_exempt_proof_check
  check (not vat_exempt or vat_exempt_proof_path is not null);

-- ===========================================================================
-- 2. THE ATTACHMENT BUCKET
--
--    Private, same shape as payment-proofs and delivery-proofs: a customer
--    writes into their own folder and reads back what they put there, an
--    admin reads everything, because deciding whether it holds up is the
--    whole job.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('vat-exemption-proofs', 'vat-exemption-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Customers upload their own VAT exemption proof" on storage.objects;
create policy "Customers upload their own VAT exemption proof" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vat-exemption-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Customers read their own VAT exemption proof" on storage.objects;
create policy "Customers read their own VAT exemption proof" on storage.objects
  for select to authenticated
  using (bucket_id = 'vat-exemption-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Admins read every VAT exemption proof" on storage.objects;
create policy "Admins read every VAT exemption proof" on storage.objects
  for select to authenticated
  using (bucket_id = 'vat-exemption-proofs' and public.is_admin());

-- ===========================================================================
-- 3. THE CUSTOMER ATTACHES IT
--
--    Only on their own order, and only while it is pending — before the call
--    there is nowhere for it to go yet, and after `pending` the price (and
--    what it is based on) is no longer admin_set_order_vat_exempt()'s to
--    move. A guarded function rather than a bare UPDATE policy, so a write
--    here can only ever touch this one column on this one order — never
--    total, subtotal, or anything else on the row.
-- ===========================================================================

create or replace function public.attach_vat_exemption_proof(p_order_id uuid, p_proof_path text)
returns boolean
language plpgsql
security definer
set search_path = public
as $attach$
declare
  v_owner  uuid;
  v_status text;
begin
  select user_id, status into v_owner, v_status from public.orders where id = p_order_id for update;

  if v_owner is null or v_owner <> auth.uid() then
    return false;
  end if;

  if v_status <> 'pending' then
    raise exception 'This order is past the point where an exemption document can be attached.'
      using errcode = 'check_violation';
  end if;

  update public.orders set vat_exempt_proof_path = p_proof_path where id = p_order_id;

  return true;
end;
$attach$;

grant execute on function public.attach_vat_exemption_proof(uuid, text) to authenticated;

-- ===========================================================================
-- 4. THE ADMIN DECIDES
--
--    Recomputes vat and total from the order's own subtotal — it does not
--    touch subtotal or discount, so an installer's trade pricing survives a
--    VAT toggle untouched. Same admin and pending checks as
--    admin_set_order_total(), and for the same reason. Refuses to turn the
--    exemption on until something is actually on file to look at.
-- ===========================================================================

create or replace function public.admin_set_order_vat_exempt(p_order_id uuid, p_exempt boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $vat$
declare
  v_current  text;
  v_subtotal numeric;
  v_proof    text;
  v_vat      numeric;
begin
  if not public.is_admin() then
    return false;
  end if;

  select status, subtotal, vat_exempt_proof_path into v_current, v_subtotal, v_proof
    from public.orders where id = p_order_id for update;

  if v_current is null then
    return false;
  end if;

  if v_current <> 'pending' then
    raise exception 'Order % is %, so its VAT can no longer be changed.', p_order_id, v_current
      using errcode = 'check_violation';
  end if;

  if v_subtotal is null or v_subtotal <= 0 then
    raise exception 'This order has no price yet — set one first.' using errcode = 'check_violation';
  end if;

  if p_exempt and v_proof is null then
    raise exception 'The customer has not attached an exemption document on this order yet.'
      using errcode = 'check_violation';
  end if;

  v_vat := case when p_exempt then 0 else round(v_subtotal * 0.12, 2) end;

  update public.orders
     set vat_exempt = p_exempt,
         vat        = v_vat,
         total      = v_subtotal + v_vat
   where id = p_order_id;

  return true;
end;
$vat$;

grant execute on function public.admin_set_order_vat_exempt(uuid, boolean) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. The two columns, the bucket, and its three policies.
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'orders'
   and column_name in ('vat_exempt', 'vat_exempt_proof_path')
 order by column_name;

select id, public from storage.buckets where id = 'vat-exemption-proofs';

select policyname, cmd from pg_policies
 where schemaname = 'storage' and tablename = 'objects' and policyname ilike '%VAT exemption%';

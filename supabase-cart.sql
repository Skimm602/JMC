-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  A persistent cart: what a signed-in customer has added, tied to their
--  account rather than the browser, so it survives a refresh, a logout, or
--  switching devices. One row per (customer, product) — the unique
--  constraint below is what lets "add to cart" always be an upsert rather
--  than ever needing to merge duplicate rows for the same product.
--
--  Read/write both go through RLS exactly like orders/order_items in
--  supabase-orders-checkout.sql: a customer only ever touches their own rows,
--  checked against auth.uid() rather than anything the client sends up.
-- ===========================================================================

begin;

create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity   integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "Customers manage their own cart" on public.cart_items;
create policy "Customers manage their own cart" on public.cart_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the policy above.
-- ---------------------------------------------------------------------------
select policyname, cmd from pg_policies where tablename = 'cart_items' order by policyname;

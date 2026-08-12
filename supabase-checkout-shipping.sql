-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  Runs AFTER supabase-orders-checkout.sql. That script gave `orders` its
--  RLS policies and its payment lifecycle; this one gives an order the two
--  things it was still missing to be a real sale:
--
--    1  where it ships to   -> street address, city, province, ZIP
--    2  what it added up to -> the VAT-exclusive subtotal, the trade
--                              discount and the 12 % VAT that together
--                              make the `total` already on the row
--    3  that the customer agreed to pay, and when
--
--  Nothing here is destructive and nothing is renamed — every statement is
--  `add column if not exists`, so re-running it is a no-op. The existing
--  "Customers insert their own orders" policy already covers the new
--  columns; a policy grants access to a row, not to a column list.
--
--  One transaction: if anything fails, nothing is applied.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Delivery address.
--
--    Kept on the order rather than on the profile: this is where this
--    consignment went, which is a fact about the order and must not change
--    when the customer later edits their account. Nullable because rows
--    placed before this script existed have no address to backfill with, and
--    inventing one would be worse than leaving it blank. The checkout action
--    requires all four on anything new.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists street_address text;
alter table public.orders add column if not exists city            text;
alter table public.orders add column if not exists province        text;
alter table public.orders add column if not exists postal_code     text;

-- ---------------------------------------------------------------------------
-- 2. How the total was reached.
--
--    `total` alone cannot be audited — it does not say whether a figure is
--    low because the buyer is an installer or because VAT was left off. All
--    three components are stored so a receipt can be reprinted years later
--    without re-deriving it from prices that have since changed:
--
--      subtotal  net of VAT, after any trade discount
--      discount  what installer pricing took off the list price (0 otherwise)
--      vat       12 % of subtotal
--      total     subtotal + vat   (already on the table)
--
--    numeric(12, 2) matches how money is counted rather than how floats
--    round: twelve digits carries a ten-million-peso commercial order.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists subtotal numeric(12, 2);
alter table public.orders add column if not exists discount numeric(12, 2);
alter table public.orders add column if not exists vat      numeric(12, 2);

-- ---------------------------------------------------------------------------
-- 3. The undertaking to pay.
--
--    A timestamp rather than a boolean: "they ticked the box" is not worth
--    much on its own, and the moment of agreement is what a dispute over a
--    refused refund actually turns on. Set server-side at checkout from the
--    database's clock, never from anything the browser sent.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists terms_accepted_at timestamptz;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the eight columns above with their types.
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'orders'
   and column_name in (
     'street_address', 'city', 'province', 'postal_code',
     'subtotal', 'discount', 'vat', 'terms_accepted_at'
   )
 order by column_name;

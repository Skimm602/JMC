-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  Adds a `specifications` column to products: a free list of spec lines
--  (e.g. "Rated output: 6.0 kW") that the admin enters when adding a product
--  in the Maintenance tab. Stored as text[] rather than a single text block
--  since the admin adds them one line at a time, not as a paragraph.
-- ===========================================================================

begin;

alter table public.products
  add column if not exists specifications text[] not null default '{}';

commit;

-- ---------------------------------------------------------------------------
-- Check.
-- ---------------------------------------------------------------------------
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'products' and column_name = 'specifications';

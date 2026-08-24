-- ---------------------------------------------------------------------------
-- Site traffic: how many people visited the public site, by the day.
--
-- One row per visitor per day, not one row per hit. That shape is what makes
-- "80 viewers on 25 August" answerable without keeping a log: the row count
-- for a day IS the visitor count, and `hits` on the same row carries how many
-- pages that visitor opened. A busy day costs one row per person, not one per
-- page view, so the table stays small enough to read for years.
--
-- Days are Manila days. now() is UTC on Supabase, so a visit at 9am in Cebu
-- would otherwise land on the previous date and the dashboard would disagree
-- with the calendar on the wall.
--
-- Nothing here identifies a person. The site sends a one-way hash of address
-- + browser + the date, so the same visitor is recognisable within a day and
-- unrecognisable across two — see /api/track. There is no cookie, and no
-- address is ever stored.
-- ---------------------------------------------------------------------------

create table if not exists public.page_views (
  id            uuid primary key default gen_random_uuid(),
  viewed_on     date        not null,
  visitor_hash  text        not null,
  hits          integer     not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),

  constraint page_views_unique_visitor_day unique (viewed_on, visitor_hash)
);

-- The dashboard always reads "the last N days, newest first", and the unique
-- constraint above already indexes (viewed_on, visitor_hash) left-to-right,
-- so date-range scans are covered. This one is for the ordering.
create index if not exists page_views_viewed_on_idx
  on public.page_views (viewed_on desc);


-- ---------------------------------------------------------------------------
-- RLS. Same shape as orders in supabase-orders-checkout.sql: no direct write
-- policy for anybody, because the only legitimate write is "record one visit"
-- and that goes through the guarded function below. Without this, anon holds
-- an open insert on a public table and the counter is worth nothing.
-- ---------------------------------------------------------------------------
alter table public.page_views enable row level security;

drop policy if exists "Admins read page views" on public.page_views;
create policy "Admins read page views" on public.page_views
  for select to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------------
-- record_page_view(visitor_hash)
--
-- The one write. security definer so it can insert past the RLS above, and
-- deliberately narrow: the caller chooses nothing except which visitor they
-- are, and even that is a hash they cannot use to read anything back. The
-- date is stamped here rather than accepted from the request, so no caller
-- can backfill a day that never happened.
--
-- Returns void — the visitor gets no signal about what the counter now says.
-- ---------------------------------------------------------------------------
create or replace function public.record_page_view(p_visitor_hash text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_day date := (now() at time zone 'Asia/Manila')::date;
begin
  -- A malformed or absent hash is dropped rather than counted. Letting it
  -- through would let anyone inflate the figure by sending empty strings,
  -- since they would all collide onto one row per day... which is to say it
  -- would quietly under-count instead. Either way it is not a visit.
  if p_visitor_hash is null or length(p_visitor_hash) <> 64 then
    return;
  end if;

  insert into public.page_views (viewed_on, visitor_hash)
  values (v_day, p_visitor_hash)
  on conflict (viewed_on, visitor_hash) do update
    set hits         = public.page_views.hits + 1,
        last_seen_at = now();
end;
$$;

revoke all on function public.record_page_view(text) from public;
grant execute on function public.record_page_view(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- admin_page_view_daily(days)
--
-- What the analytics tab reads. Aggregating here rather than shipping every
-- row keeps the page one small result set no matter how well the site does,
-- the same reason getOrders() does not hand the browser the whole table.
--
-- Days with no visitors are absent, not zero — the dashboard fills the gaps,
-- because only it knows which window it is drawing.
-- ---------------------------------------------------------------------------
create or replace function public.admin_page_view_daily(p_days integer default 365)
returns table (viewed_on date, visitors bigint, views bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select pv.viewed_on,
         count(*)::bigint            as visitors,
         coalesce(sum(pv.hits), 0)::bigint as views
    from public.page_views pv
   where public.is_admin()
     and pv.viewed_on > (now() at time zone 'Asia/Manila')::date - greatest(p_days, 1)
   group by pv.viewed_on
   order by pv.viewed_on;
$$;

revoke all on function public.admin_page_view_daily(integer) from public, anon;
grant execute on function public.admin_page_view_daily(integer) to authenticated;


-- ---------------------------------------------------------------------------
-- Check it landed.
-- ---------------------------------------------------------------------------
-- select * from public.admin_page_view_daily(30);

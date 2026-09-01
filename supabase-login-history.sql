-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  A record of when each account signed in and how long they stayed.
--
--  One row per session: opened by record_login() the moment sign-in
--  succeeds — customer or admin, there is one log-in on this site, not two,
--  and this is not the exception — kept warm by touch_login_session() on
--  ordinary page loads while it is open, and closed by
--  close_login_session() on an explicit sign-out.
--
--  A session nobody explicitly signs out of — a closed tab, an expired
--  token — is left with signed_out_at null forever; last_seen_at is the
--  best available answer for "until when", so "how long they stayed" is
--  read off whichever of the two is set.
--
--  Admin-only to read, and every write goes through a guarded function
--  rather than a bare policy — a session can only ever touch the row it
--  opened for its own account, never anyone else's and never a total or a
--  status the way a bare UPDATE policy could be reached for.
--
--  Safe to run more than once.
-- ===========================================================================

begin;

-- ===========================================================================
-- 1. THE TABLE
-- ===========================================================================

create table if not exists public.login_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  signed_in_at  timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  signed_out_at timestamptz
);

create index if not exists login_events_user_id_idx on public.login_events (user_id, signed_in_at desc);

alter table public.login_events enable row level security;

drop policy if exists "Admins view all login events" on public.login_events;
create policy "Admins view all login events" on public.login_events
  for select to authenticated
  using (public.is_admin());

-- No insert/update/delete policy for anyone, admin included — every write
-- goes through one of the three functions below, each of which only ever
-- touches auth.uid()'s own rows.

-- ===========================================================================
-- 2. OPENING A SESSION
--
--    Called right after signInWithPassword() succeeds.
-- ===========================================================================

create or replace function public.record_login()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.login_events (user_id) values (auth.uid());
end;
$$;

grant execute on function public.record_login() to authenticated;

-- ===========================================================================
-- 3. STAYING OPEN
--
--    Called from middleware on an ordinary page load. Throttled in the WHERE
--    clause rather than by the caller, so "how long did they stay" reads
--    accurate to five minutes without a write on every single request.
-- ===========================================================================

create or replace function public.touch_login_session()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.login_events
     set last_seen_at = now()
   where user_id = auth.uid()
     and signed_out_at is null
     and last_seen_at < now() - interval '5 minutes';
end;
$$;

grant execute on function public.touch_login_session() to authenticated;

-- ===========================================================================
-- 4. CLOSING A SESSION
--
--    Called on an explicit sign-out. Closes whichever of this account's open
--    sessions was opened most recently — good enough for "when did they last
--    use the site", not meant as a precise per-device log: signed in on two
--    devices at once and signing out of one closes the newer session record
--    rather than necessarily the one actually in front of them.
-- ===========================================================================

create or replace function public.close_login_session()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.login_events
     set signed_out_at = now(),
         last_seen_at  = now()
   where id = (
     select id from public.login_events
      where user_id = auth.uid() and signed_out_at is null
      order by signed_in_at desc
      limit 1
   );
end;
$$;

grant execute on function public.close_login_session() to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the table's columns.
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'login_events'
 order by ordinal_position;

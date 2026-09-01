-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  Account creation, rate limited by the connection making it.
--
--  Neither signUp() nor adminSignUp() throttled attempts before this. Unlike
--  the login throttle in supabase-login-rate-limit.sql — which is keyed on
--  the email being tried, because brute force repeats one email — mass
--  account creation spreads across many different emails, so the email is
--  not a useful key here. This is keyed on the requesting IP instead: five
--  accounts created from the same connection inside an hour and the sixth
--  is refused before it ever reaches Supabase Auth.
--
--  Recorded on every call this action reaches, not only ones that go on to
--  create an account — a script probing the form with invalid input still
--  counts as one more request from that connection.
--
--  An IP is a weaker signal than an email: shared connections (an office, a
--  campus, a carrier-grade NAT) can trip this together, and it does nothing
--  against an attacker spreading requests across many addresses. It is a
--  blunt, cheap backstop against a single script, not a complete defence.
--
--  Safe to run more than once.
-- ===========================================================================

begin;

-- ===========================================================================
-- 1. THE TABLE
--
--    Locked down tight: no policy for anon or authenticated at all, in
--    either direction. Every read and write goes through the two functions
--    below.
-- ===========================================================================

create table if not exists public.signup_attempts (
  id           uuid primary key default gen_random_uuid(),
  ip           text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists signup_attempts_ip_idx on public.signup_attempts (ip, attempted_at desc);

alter table public.signup_attempts enable row level security;

-- ===========================================================================
-- 2. THE CHECK
--
--    Called before supabase.auth.signUp() — refusing here means a blocked
--    attempt never reaches Supabase Auth at all.
-- ===========================================================================

create or replace function public.is_signup_rate_limited(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
    from public.signup_attempts
   where ip = trim(p_ip)
     and attempted_at > now() - interval '1 hour';

  return v_count >= 5;
end;
$$;

grant execute on function public.is_signup_rate_limited(text) to anon, authenticated;

-- ===========================================================================
-- 3. THE RECORD
--
--    Opportunistic cleanup on the same IP keeps the table from growing
--    unbounded without a separate cron job, the same way
--    record_login_attempt() does for login_attempts.
-- ===========================================================================

create or replace function public.record_signup_attempt(p_ip text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ip text := trim(p_ip);
begin
  delete from public.signup_attempts
   where ip = v_ip
     and attempted_at < now() - interval '1 day';

  insert into public.signup_attempts (ip) values (v_ip);
end;
$$;

grant execute on function public.record_signup_attempt(text) to anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the table's columns.
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'signup_attempts'
 order by ordinal_position;

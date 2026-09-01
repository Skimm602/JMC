-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  Login attempts, rate limited by the email being tried.
--
--  Neither signIn() nor adminSignIn() throttled attempts before this — an
--  attacker with a known email (the admin login page's own URL makes that
--  trivial to target for at least one account) could try passwords at
--  whatever rate the network allowed, and adminSignIn()'s one flat
--  rejection message — deliberately vague so a wrong email cannot be told
--  from a wrong password — only protects anything if guessing is also slow.
--  This closes that: five failed attempts against the same email inside
--  fifteen minutes and the sixth is refused before it ever reaches
--  Supabase Auth.
--
--  Keyed on the email being attempted rather than the caller's session,
--  because there is no session yet — this runs before sign-in succeeds or
--  fails, for a visitor who is anon by definition. It does not catch a
--  password-spray attack that tries one password across many different
--  emails; it catches the far more common case of many passwords against
--  one account.
--
--  Safe to run more than once.
-- ===========================================================================

begin;

-- ===========================================================================
-- 1. THE TABLE
--
--    Locked down tight: no policy for anon or authenticated at all, in
--    either direction. Every read and write goes through the two functions
--    below, which is what keeps one visitor from reading how close another
--    account is to being locked out.
-- ===========================================================================

create table if not exists public.login_attempts (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  succeeded    boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_email_idx on public.login_attempts (email, attempted_at desc);

alter table public.login_attempts enable row level security;

-- ===========================================================================
-- 2. THE CHECK
--
--    Called before signInWithPassword() — refusing here means a blocked
--    guess never reaches Supabase Auth at all, and the account under attack
--    is not the one paying for the extra load.
-- ===========================================================================

create or replace function public.is_login_rate_limited(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_failures integer;
begin
  select count(*) into v_failures
    from public.login_attempts
   where email = lower(trim(p_email))
     and succeeded = false
     and attempted_at > now() - interval '15 minutes';

  return v_failures >= 5;
end;
$$;

grant execute on function public.is_login_rate_limited(text) to anon, authenticated;

-- ===========================================================================
-- 3. THE RECORD
--
--    Called after Supabase Auth answers, success or failure — a success
--    does not clear prior failures out of the window, so an account that
--    just tripped the limit stays throttled for its own correct password
--    too, the same as any other lockout.
--
--    Opportunistic cleanup on the same email keeps the table from growing
--    unbounded without a separate cron job: a real attempt against this
--    address is already paying for one write, so paying for the delete of
--    its own day-old rows costs nothing extra.
-- ===========================================================================

create or replace function public.record_login_attempt(p_email text, p_succeeded boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(p_email));
begin
  delete from public.login_attempts
   where email = v_email
     and attempted_at < now() - interval '1 day';

  insert into public.login_attempts (email, succeeded) values (v_email, p_succeeded);
end;
$$;

grant execute on function public.record_login_attempt(text, boolean) to anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. Should list the table's columns.
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'login_attempts'
 order by ordinal_position;

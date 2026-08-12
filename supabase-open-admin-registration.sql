-- ===========================================================================
--  Run this once in the Supabase SQL editor.
--  Dashboard → SQL Editor → New query → paste → Run.
--
--  It adds the one function /admin/register needs. Until it exists, that page
--  will create the account and then fail to give it admin access.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- grant_admin_on_register()
--
-- Turns is_admin on for whoever is calling. There is no check, because there
-- is nothing left to check: the page that calls this is open on purpose, so
-- reaching it IS the authorisation. The site owner chose this over a setup
-- code and over requiring an existing admin, knowing what it means — anyone
-- who learns the /admin/register path can make themselves an admin.
--
-- It is SECURITY DEFINER because the guard trigger on profiles refuses to let
-- an ordinary session write that column. That guard stays: it is what stops a
-- customer promoting themselves through the REST API without ever visiting the
-- registration page.
-- ---------------------------------------------------------------------------
create or replace function public.grant_admin_on_register()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  update public.profiles set is_admin = true where id = v_uid;
  return found;
end;
$$;

revoke all on function public.grant_admin_on_register() from public, anon;
grant execute on function public.grant_admin_on_register() to authenticated;


-- ---------------------------------------------------------------------------
-- Housekeeping: three accounts left behind by testing. Safe to delete — none
-- of them is an admin. Skip this block if you would rather remove them from
-- Authentication → Users by hand.
-- ---------------------------------------------------------------------------
delete from public.profiles
 where id in (select id from auth.users
               where email like 'nocode-%@example.com'
                  or email like 'detached-%@example.com');

delete from auth.users
 where email like 'nocode-%@example.com'
    or email like 'detached-%@example.com';


-- ---------------------------------------------------------------------------
-- Check it worked.
-- ---------------------------------------------------------------------------
select
  (select count(*) from pg_proc
    where proname = 'grant_admin_on_register')                        as function_created,
  (select count(*) from auth.users)                                   as users_left,
  (select count(*) from public.profiles where is_admin)               as admins;

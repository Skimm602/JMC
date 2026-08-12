-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--
--  Rejecting an installer application now deletes the whole account (see the
--  updated rejectVerification() in src/app/actions/verification.js) instead
--  of leaving it able to resubmit after a cooldown. That needs
--  delete_user_account() — already called by deleteUserAccount() in
--  src/app/actions/admin.js and the Accounts tab, but the function itself
--  was never created (it lived in the superseded supabase-admin-setup.sql,
--  whose orders section conflicted with the live schema and never
--  successfully ran). This creates it on its own, since it doesn't touch
--  orders/products at all.
--
--  The verification row itself is meant to survive the account it came from
--  — it's the record that an application was made and rejected, and why —
--  so installer_verifications.profile_id is repointed to ON DELETE SET NULL
--  instead of its original CASCADE. rejectVerification() writes the
--  rejection onto that row before calling this function; deleting the
--  profile then just detaches it rather than taking it down too.
--
--  One transaction: if anything fails, nothing is applied.
-- ===========================================================================

begin;

-- Renamed while we're already dropping and recreating it: "corporate" is
-- leftover from before this table was installer_verifications.
alter table public.installer_verifications
  drop constraint if exists corporate_verifications_profile_id_fkey;
alter table public.installer_verifications
  drop constraint if exists installer_verifications_profile_id_fkey;
alter table public.installer_verifications
  add constraint installer_verifications_profile_id_fkey
  foreign key (profile_id) references public.profiles (id) on delete set null;

-- Removes the account and everything hanging off it except its verification
-- history — profile, admin access, the auth login itself. There is no undo,
-- and it refuses the one case a new sign-up could not repair: deleting
-- yourself.
--
-- Documents already uploaded stay in the storage bucket; SQL cannot reach
-- object storage. The caller (rejectVerification) removes those separately
-- before calling this.
create or replace function public.delete_user_account(p_target uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null or not public.is_admin() then
    return false;
  end if;

  if p_target = v_uid then
    raise exception 'You cannot delete your own account.' using errcode = 'check_violation';
  end if;

  select u.email into v_email from auth.users u where u.id = p_target;
  if v_email is null then
    return false;
  end if;

  delete from public.admins   where lower(email) = lower(v_email);
  delete from public.profiles where id = p_target;
  delete from auth.users      where id = p_target;

  return true;
end;
$$;

revoke all on function public.delete_user_account(uuid) from public, anon;
grant execute on function public.delete_user_account(uuid) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Check. confdeltype should read 'n' (SET NULL) rather than 'c' (CASCADE).
-- ---------------------------------------------------------------------------
select routine_name from information_schema.routines
 where routine_schema = 'public' and routine_name = 'delete_user_account';

select conname, confdeltype from pg_constraint
 where conrelid = 'public.installer_verifications'::regclass and contype = 'f';

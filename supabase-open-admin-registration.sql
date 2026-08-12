-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
--  It does two things:
--    1. Creates a real `admins` table, visible in the Table Editor, and makes
--       it the single place an admin is recorded. `profiles.is_admin` goes
--       away, so there is no second copy that can disagree with it.
--    2. Adds the function /admin/register needs to grant access on sign-up.
--
--  The whole thing is one transaction: if any statement fails, nothing is
--  applied and your database is exactly as it was.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. The table.
--
--    One row per admin. `id` is the same uuid as auth.users and profiles, so
--    the three line up. full_name and email are copied in for readability —
--    this table exists partly so a human can open it and see who has access
--    without joining anything.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  added_by   uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Nobody writes here through the API. The SECURITY DEFINER functions below are
-- the only way a row appears or disappears, which is what keeps "who is an
-- admin" from being something a browser session can decide for itself.
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Move the existing admins across before anything starts reading the new
--    table. Right now that is whoever has profiles.is_admin = true.
-- ---------------------------------------------------------------------------
insert into public.admins (id, full_name, email)
select p.id, p.full_name, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Point the two read helpers at the new table.
--
--    Every RLS policy on profiles and installer_verifications calls is_admin(),
--    so replacing the body here moves the whole system over in one step.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid())
$$;

create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins)
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.admin_exists() from public;
grant execute on function public.admin_exists() to anon, authenticated;

-- An admin can see the whole roster; the grant above already stops anyone else
-- reading it at all.
drop policy if exists "Admins read the roster" on public.admins;
create policy "Admins read the roster" on public.admins
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. The three writers.
-- ---------------------------------------------------------------------------

-- /admin/register. Open on purpose: anyone who reaches that URL becomes an
-- admin, because the site owner chose the path itself as the only secret.
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

  insert into public.admins (id, full_name, email)
  select u.id, p.full_name, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid
  on conflict (id) do nothing;

  return true;
end;
$$;

-- /admin/setup, for an account that already exists on a site with no admin.
create or replace function public.claim_first_admin()
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

  perform pg_advisory_xact_lock(hashtext('claim_first_admin'));

  if exists (select 1 from public.admins) then
    return false;
  end if;

  insert into public.admins (id, full_name, email)
  select u.id, p.full_name, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  return true;
end;
$$;

-- The Make admin / Remove admin buttons in the Accounts table.
create or replace function public.set_admin(p_target uuid, p_value boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.is_admin() then
    return false;
  end if;

  if p_target = v_uid and not p_value then
    raise exception 'You cannot remove your own admin access.' using errcode = 'check_violation';
  end if;

  if p_value then
    insert into public.admins (id, full_name, email, added_by)
    select u.id, p.full_name, u.email, v_uid
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = p_target
    on conflict (id) do nothing;
  else
    delete from public.admins where id = p_target;
  end if;

  return true;
end;
$$;

revoke all on function public.grant_admin_on_register() from public, anon;
revoke all on function public.claim_first_admin() from public, anon;
revoke all on function public.set_admin(uuid, boolean) from public, anon;
grant execute on function public.grant_admin_on_register() to authenticated;
grant execute on function public.claim_first_admin() to authenticated;
grant execute on function public.set_admin(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Cut the last two things still reading profiles.is_admin.
-- ---------------------------------------------------------------------------

-- The storage policy names the column directly; is_admin() now answers the
-- same question from the new table.
drop policy if exists "Admins can view all verification docs" on storage.objects;
create policy "Admins can view all verification docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'verification-docs' and public.is_admin());

-- The guard trigger loses its is_admin clauses, because there is no longer a
-- column on profiles to guard. What it still does — and must keep doing — is
-- stop an applicant approving their own verification.
create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verification_status :=
      case when new.customer_type = 'installer' then 'pending' else 'not_required' end;
  else
    if new.verification_status is distinct from old.verification_status
       and new.verification_status <> 'pending' then
      new.verification_status := old.verification_status;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. And drop the column. From here, public.admins is the only answer to
--    "is this person an admin".
-- ---------------------------------------------------------------------------
alter table public.profiles drop column if exists is_admin;

-- ---------------------------------------------------------------------------
-- 7. Housekeeping: accounts left behind by testing. None of them is an admin.
-- ---------------------------------------------------------------------------
delete from public.profiles
 where id in (select id from auth.users
               where email like 'nocode-%@example.com'
                  or email like 'detached-%@example.com'
                  or email like 'repro-%@example.com'
                  or email like 'routing-%@example.com');

delete from auth.users
 where email like 'nocode-%@example.com'
    or email like 'detached-%@example.com'
    or email like 'repro-%@example.com'
    or email like 'routing-%@example.com';

commit;

-- ---------------------------------------------------------------------------
-- Check it worked. `admins` should list everyone who had access before, and
-- profiles should no longer have an is_admin column.
-- ---------------------------------------------------------------------------
select a.email, a.full_name, a.created_at from public.admins a order by a.created_at;

select count(*) as is_admin_column_should_be_zero
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin';

-- ---------------------------------------------------------------------------
-- Security hardening pass, 31 August 2026.
--
-- Two things a routine advisor check turned up, verified against the actual
-- function bodies rather than taken on the linter's word:
--
--   1. mark_order_paid() had no admin check and no secret check of its own —
--      only a match on payment_reference. It was still world-executable
--      (Postgres grants EXECUTE to PUBLIC by default unless revoked, and
--      nothing here ever revoked it), meaning it was directly callable via
--      /rest/v1/rpc/mark_order_paid by anyone holding the public anon key,
--      bypassing the payments webhook route's own PAYMENTS_WEBHOOK_SECRET
--      check entirely. Currently low-impact only because the live checkout
--      flow never sets payment_reference on a real order — restricting the
--      grant is what actually closes it, rather than relying on that being
--      permanent. The webhook route now calls it with a service-role client
--      instead of the anon one (see src/utils/supabase/service.js).
--
--   2. profiles_guard_privileged_columns() and verifications_guard_review_
--      columns() had no pinned search_path. Both already schema-qualify
--      everything they call (public.is_admin()), so the practical exposure
--      was already small, but pinning it closes the gap outright rather
--      than leaving it to "probably fine".
-- ---------------------------------------------------------------------------

revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

create or replace function public.profiles_guard_privileged_columns()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
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

create or replace function public.verifications_guard_review_columns()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.locked_until := null;
    new.rejection_history := '[]'::jsonb;
    new.attempt_count := 1;
    new.last_attempt_at := now();
  else
    -- The hold after three rejections was advisory: the app checked it, so
    -- anything that was not the app ignored it. Here it actually holds.
    if old.locked_until is not null and old.locked_until > now() then
      raise exception 'This verification is under a review hold until %', old.locked_until
        using errcode = 'check_violation';
    end if;

    new.status := 'pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.locked_until := old.locked_until;
    new.rejection_history := old.rejection_history;
    new.attempt_count := coalesce(old.attempt_count, 0) + 1;
    new.last_attempt_at := now();
  end if;

  return new;
end;
$$;

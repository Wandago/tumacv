-- Migration v19: atomic credit changes.
-- Paste into Supabase → SQL Editor → Run.
--
-- Every place that granted or spent credits did it as a read-modify-write:
-- SELECT the current balance in one round trip, then UPDATE to
-- balance + delta in another. Two overlapping requests both read the same
-- starting balance and the second write silently overwrites the first, so
-- one of the two grants disappears. It bites hardest on referrals (one
-- popular link can be redeemed by several people at once) and on payment
-- webhooks, which providers retry and can therefore deliver concurrently.
--
-- Doing the arithmetic inside a single UPDATE makes it atomic: Postgres
-- takes a row lock for the duration of the statement, so concurrent callers
-- queue and each one adds to the result of the last.
--
-- `security definer` lets this run with the function owner's rights. Callers
-- reach it through the service-role key from server routes only, and the
-- grant below is restricted to service_role so it is not callable from the
-- browser with an anon key.

create or replace function public.increment_credits(p_user_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.profiles
     -- greatest(...) keeps a balance from going negative when a negative
     -- delta is larger than what's left (admin deductions do this).
     set credits = greatest(0, credits + p_delta)
   where id = p_user_id
  returning credits into new_balance;

  if not found then
    raise exception 'profile % not found', p_user_id using errcode = 'no_data_found';
  end if;

  return new_balance;
end;
$$;

revoke all on function public.increment_credits(uuid, integer) from public, anon, authenticated;
grant execute on function public.increment_credits(uuid, integer) to service_role;

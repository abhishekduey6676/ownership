-- Reviewed source for the remotely applied demo_analysis_usage_limits migration.
-- No item/source content; no changes to legacy item tables or their policies.
create schema ownership_usage;
revoke all on schema ownership_usage from public, anon, authenticated;
grant usage on schema ownership_usage to authenticated;

create table ownership_usage.demo_budget (
  singleton boolean primary key default true check (singleton),
  usage_day date not null,
  attempts integer not null default 0 check (attempts between 0 and 50)
);
create table ownership_usage.visitor_budget (
  visitor_id uuid primary key,
  usage_day date not null,
  attempts integer not null check (attempts between 1 and 5)
);
alter table ownership_usage.demo_budget enable row level security;
alter table ownership_usage.visitor_budget enable row level security;
revoke all on ownership_usage.demo_budget, ownership_usage.visitor_budget from public, anon, authenticated;

insert into ownership_usage.demo_budget (singleton, usage_day, attempts)
values (true, (clock_timestamp() at time zone 'UTC')::date, 0);

-- Definer is private and minimal: caller identity is derived, never accepted as an argument.
-- The table owner can modify counters; ordinary clients get no table privileges or policies.
create function ownership_usage.reserve_analysis()
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '3s'
as $$
declare
  visitor uuid := auth.uid();
  budget ownership_usage.demo_budget%rowtype;
  today date;
  clock_now timestamptz;
  visitor_attempts integer;
  retry_seconds integer;
begin
  if visitor is null then
    raise exception 'Analysis identity required' using errcode = '42501';
  end if;

  -- Every reservation uses this row first. Neither cap can race across server instances.
  select * into strict budget from ownership_usage.demo_budget
    where singleton = true for update;
  -- Read the clock after taking the lock, including requests waiting across midnight.
  clock_now := clock_timestamp();
  today := (clock_now at time zone 'UTC')::date;
  retry_seconds := greatest(1, ceil(extract(epoch from
    (((today + 1)::timestamp at time zone 'UTC') - clock_now)))::integer);
  if budget.usage_day <> today then
    update ownership_usage.demo_budget set usage_day = today, attempts = 0 where singleton = true;
    budget.attempts := 0;
    -- Keep current-day counters only. Cleanup runs on the first reservation after rollover,
    -- not on a timer; during inactivity the last day's metadata remains.
    delete from ownership_usage.visitor_budget where usage_day <> today;
  end if;
  if budget.attempts >= 50 then
    return jsonb_build_object('allowed', false, 'reason', 'demo_limit', 'retry_after_seconds', retry_seconds);
  end if;
  select attempts into visitor_attempts from ownership_usage.visitor_budget
    where visitor_id = visitor and usage_day = today;
  if coalesce(visitor_attempts, 0) >= 5 then
    return jsonb_build_object('allowed', false, 'reason', 'visitor_limit', 'retry_after_seconds', retry_seconds);
  end if;
  insert into ownership_usage.visitor_budget (visitor_id, usage_day, attempts)
    values (visitor, today, 1)
    on conflict (visitor_id) do update
      set usage_day = excluded.usage_day, attempts = coalesce(visitor_attempts, 0) + 1;
  update ownership_usage.demo_budget set attempts = attempts + 1 where singleton = true;
  return jsonb_build_object('allowed', true, 'reason', 'allowed', 'retry_after_seconds', 0);
end;
$$;
revoke all on function ownership_usage.reserve_analysis() from public, anon, authenticated;
grant execute on function ownership_usage.reserve_analysis() to authenticated;

-- Exposed wrapper is INVOKER; privileged implementation stays outside the public API schema.
create function public.reserve_demo_analysis()
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select ownership_usage.reserve_analysis(); $$;
revoke all on function public.reserve_demo_analysis() from public, anon, authenticated;
grant execute on function public.reserve_demo_analysis() to authenticated;

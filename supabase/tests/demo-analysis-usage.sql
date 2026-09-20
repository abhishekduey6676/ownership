-- Run as the project SQL administrator. Only quota metadata is touched; everything rolls back.
begin;
set local statement_timeout = '15s';
select singleton from ownership_usage.demo_budget where singleton = true for update;
update ownership_usage.demo_budget set usage_day = (clock_timestamp() at time zone 'UTC')::date - 1, attempts = 50 where singleton = true;
update ownership_usage.visitor_budget set usage_day = (clock_timestamp() at time zone 'UTC')::date - 1;
insert into ownership_usage.visitor_budget values (gen_random_uuid(), (clock_timestamp() at time zone 'UTC')::date - 1, 5);

set local role authenticated;
do $$
declare result jsonb; person integer; attempt integer;
begin
  -- Neither direct table access nor a missing verified identity is permitted.
  begin
    perform 1 from ownership_usage.demo_budget;
    raise exception 'Expected table access denial';
  exception when insufficient_privilege then null; end;
  begin
    update ownership_usage.visitor_budget set attempts = 1;
    raise exception 'Expected table mutation denial';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.reserve_demo_analysis();
    raise exception 'Expected missing identity denial';
  exception when insufficient_privilege then null; end;

  for person in 1..10 loop
    perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
    for attempt in 1..5 loop
      result := public.reserve_demo_analysis();
      if result <> '{"allowed":true,"reason":"allowed","retry_after_seconds":0}'::jsonb then
        raise exception 'Expected allowed reservation: %', result;
      end if;
    end loop;
    result := public.reserve_demo_analysis();
    if (result->>'allowed')::boolean or result->>'reason' <> (case when person = 10 then 'demo_limit' else 'visitor_limit' end) then
      raise exception 'Expected limit denial: %', result;
    end if;
    if (result->>'retry_after_seconds')::integer not between 1 and 86400 then
      raise exception 'Invalid UTC retry time';
    end if;
  end loop;
  -- A new identity cannot bypass the shared daily cap.
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  result := public.reserve_demo_analysis();
  if result->>'reason' <> 'demo_limit' then raise exception 'Global limit bypass'; end if;
end;
$$;

reset role;
do $$ begin
  if (select attempts from ownership_usage.demo_budget where singleton = true) <> 50 then raise exception 'Expected exactly 50 reservations'; end if;
  if (select count(*) from ownership_usage.visitor_budget) <> 10 then raise exception 'Unexpected visitor rows or stale metadata'; end if;
  if exists (select 1 from ownership_usage.visitor_budget where attempts <> 5) then raise exception 'Incorrect visitor counters'; end if;
end; $$;

set local role anon;
do $$ begin
  begin
    perform public.reserve_demo_analysis();
    raise exception 'Expected anon function denial';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;

-- Simulate a new database UTC day without accepting any date supplied by a client.
update ownership_usage.demo_budget set usage_day = (clock_timestamp() at time zone 'UTC')::date - 1 where singleton = true;
update ownership_usage.visitor_budget set usage_day = (clock_timestamp() at time zone 'UTC')::date - 1;
set local role authenticated;
do $$ declare result jsonb; begin
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  result := public.reserve_demo_analysis();
  if not (result->>'allowed')::boolean then raise exception 'UTC reset did not restore budget'; end if;
end; $$;
reset role;
do $$ begin
  if (select attempts from ownership_usage.demo_budget where singleton = true) <> 1 then raise exception 'Incorrect reset total'; end if;
  if (select count(*) from ownership_usage.visitor_budget) <> 1 then raise exception 'Old counter cleanup failed'; end if;
end; $$;
rollback;
select 'PASS: visitor 5/6, demo 50/51, fresh-identity global denial, UTC reset, metadata cleanup, missing-identity and direct-access denial. Test changes rolled back.' as result;

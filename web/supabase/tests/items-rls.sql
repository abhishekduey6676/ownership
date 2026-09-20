-- Run after migration in a DEVELOPMENT project's SQL editor. All fixtures roll back.
begin;
insert into auth.users(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.items(id,owner_id,name) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','RLS fixture');
update public.items set name='Edited fixture' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
do $$ begin
  if (select count(*) from public.item_revisions where item_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc') <> 2 then raise exception 'Revision test failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $$ declare affected integer; begin
  if exists(select 1 from public.items where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc') then raise exception 'Foreign read allowed'; end if;
  if exists(select 1 from public.item_revisions where item_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc') then raise exception 'Foreign revision read allowed'; end if;
  update public.items set name='Unauthorized' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Foreign update allowed'; end if;
  begin
    insert into public.items(owner_id,name) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Unauthorized');
    raise exception 'Foreign insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.items;
    raise exception 'Delete allowed';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
  begin
    perform * from public.items;
    raise exception 'Unauthenticated read allowed';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

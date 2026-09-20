-- Personal prototype: owner_id is the access boundary, never physical location.
-- Household membership replaces this boundary in a later, explicit migration.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) between 1 and 2000),
  category text, brand text, model text, serial_number text, retailer text,
  purchase_date date, purchase_price numeric(12,2) check (purchase_price >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  warranty_duration text, warranty_expiry date, location text,
  status text not null default 'active' check (status in ('active','replaced','sold','gifted','lost','disposed')),
  sample_key text check (sample_key in ('air-fryer','earphones')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, sample_key),
  check (warranty_expiry is null or purchase_date is null or warranty_expiry >= purchase_date)
);
create index items_owner_created on public.items(owner_id, created_at desc);
alter table public.items enable row level security;
revoke all on public.items from anon, authenticated;
grant select, insert on public.items to authenticated;
grant update (name, category, brand, model, serial_number, retailer, purchase_date,
  purchase_price, warranty_duration, warranty_expiry, location) on public.items to authenticated;
create policy items_read on public.items for select to authenticated using ((select auth.uid()) = owner_id);
create policy items_create on public.items for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy items_edit on public.items for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Append-only snapshots preserve confirmed values and edits without exposing a history UI yet.
create table public.item_revisions (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.items(id),
  owner_id uuid not null references auth.users(id),
  record jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.item_revisions enable row level security;
revoke all on public.item_revisions from anon, authenticated;
grant select on public.item_revisions to authenticated;
create policy revisions_read on public.item_revisions for select to authenticated using ((select auth.uid()) = owner_id);
create function public.record_item_revision() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.item_revisions(item_id, owner_id, record) values(new.id, new.owner_id, to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.record_item_revision() from public;
create trigger item_revision after insert or update on public.items for each row execute function public.record_item_revision();
create function public.touch_item() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_item() from public;
create trigger item_timestamp before update on public.items for each row execute function public.touch_item();

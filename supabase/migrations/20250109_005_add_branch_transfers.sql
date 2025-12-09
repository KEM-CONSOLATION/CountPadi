-- Branch transfers: move stock between branches without changing total tenant stock
-- This assumes branches and items already exist.

create table if not exists public.branch_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  from_branch_id uuid references public.branches(id) on delete set null,
  to_branch_id uuid references public.branches(id) on delete set null,
  item_id uuid references public.items(id) on delete set null,
  quantity numeric not null check (quantity > 0),
  notes text,
  performed_by uuid references public.profiles(id) on delete set null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_branch_transfers_org on public.branch_transfers(organization_id);
create index if not exists idx_branch_transfers_from_branch on public.branch_transfers(from_branch_id);
create index if not exists idx_branch_transfers_to_branch on public.branch_transfers(to_branch_id);
create index if not exists idx_branch_transfers_item on public.branch_transfers(item_id);
create index if not exists idx_branch_transfers_date on public.branch_transfers(date);

-- RLS
alter table public.branch_transfers enable row level security;

-- Helpers (reuse if already created; no-op if they exist)
create or replace function public.is_tenant_admin(user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id
      and role = 'admin'
      and branch_id is null
  );
$$;

create or replace function public.get_user_effective_branch_id(user_id uuid)
returns uuid
language sql
security definer
as $$
  select case
    when exists (
      select 1 from public.profiles
      where id = user_id
        and role = 'admin'
        and branch_id is null
    ) then null
    else (select branch_id from public.profiles where id = user_id)
  end;
$$;

-- SELECT: tenant admin sees all org transfers; branch users see transfers where their branch is source or destination
create policy "branch_transfers_select" on public.branch_transfers
for select using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
  and (
    public.get_user_effective_branch_id(auth.uid()) is null
    or from_branch_id = public.get_user_effective_branch_id(auth.uid())
    or to_branch_id = public.get_user_effective_branch_id(auth.uid())
  )
);

-- INSERT: must match org and (tenant admin) or user’s branch = from_branch_id
create policy "branch_transfers_insert" on public.branch_transfers
for insert with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
  and (
    public.get_user_effective_branch_id(auth.uid()) is null
    or from_branch_id = public.get_user_effective_branch_id(auth.uid())
  )
);

-- UPDATE/DELETE: same as insert
create policy "branch_transfers_update" on public.branch_transfers
for update using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
  and (
    public.get_user_effective_branch_id(auth.uid()) is null
    or from_branch_id = public.get_user_effective_branch_id(auth.uid())
  )
);

create policy "branch_transfers_delete" on public.branch_transfers
for delete using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
  and (
    public.get_user_effective_branch_id(auth.uid()) is null
    or from_branch_id = public.get_user_effective_branch_id(auth.uid())
  )
);


create table if not exists public.savings_pool (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade unique,
  total_amount int not null default 0,
  updated_at   timestamptz not null default now()
);

create table if not exists public.savings_pool_logs (
  id         uuid primary key default gen_random_uuid(),
  pool_id    uuid not null references public.savings_pool(id) on delete cascade,
  amount     int not null,
  reason     text not null,
  week_label text,
  created_at timestamptz not null default now()
);

alter table public.savings_pool enable row level security;
alter table public.savings_pool_logs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'savings_pool' and policyname = '그룹 멤버 접근'
  ) then
    create policy "그룹 멤버 접근" on public.savings_pool
      using (group_id in (
        select group_id from public.group_members where user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'savings_pool_logs' and policyname = '그룹 멤버 접근'
  ) then
    create policy "그룹 멤버 접근" on public.savings_pool_logs
      using (pool_id in (
        select sp.id from public.savings_pool sp
        where sp.group_id in (
          select group_id from public.group_members where user_id = auth.uid()
        )
      ));
  end if;
end $$;

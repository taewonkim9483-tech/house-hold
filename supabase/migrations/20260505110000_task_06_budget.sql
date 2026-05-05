create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade unique,
  weekly_amount int not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.budget_weeks (
  id            uuid primary key default gen_random_uuid(),
  budget_id     uuid not null references public.budgets(id) on delete cascade,
  week_start    date not null,
  week_end      date not null,
  base_amount   int not null,
  spent_amount  int not null default 0,
  status        text not null default 'open' check (status in ('open', 'pending_close', 'closed')),
  created_at    timestamptz not null default now(),
  unique (budget_id, week_start)
);

create table public.budget_closings (
  id              uuid primary key default gen_random_uuid(),
  budget_week_id  uuid not null references public.budget_weeks(id),
  remaining       int not null,
  to_carry_over   int not null default 0,
  to_savings_pool int not null default 0,
  closed_at       timestamptz not null default now(),
  closed_by       uuid not null references public.users(id)
);

-- 적금 풀 (TASK-07 UI는 별도, 여기서 테이블만 선행 생성)
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

-- RLS
alter table public.budgets enable row level security;
alter table public.budget_weeks enable row level security;
alter table public.budget_closings enable row level security;
alter table public.savings_pool enable row level security;
alter table public.savings_pool_logs enable row level security;

create policy "그룹 멤버 접근" on public.budgets
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));

create policy "그룹 멤버 접근" on public.budget_weeks
  using (budget_id in (
    select b.id from public.budgets b
    join public.group_members gm on gm.group_id = b.group_id
    where gm.user_id = auth.uid()
  ));

create policy "그룹 멤버 접근" on public.budget_closings
  using (budget_week_id in (
    select bw.id from public.budget_weeks bw
    join public.budgets b on b.id = bw.budget_id
    join public.group_members gm on gm.group_id = b.group_id
    where gm.user_id = auth.uid()
  ));

create policy "그룹 멤버 접근" on public.savings_pool
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));

create policy "그룹 멤버 접근" on public.savings_pool_logs
  using (pool_id in (
    select sp.id from public.savings_pool sp
    join public.group_members gm on gm.group_id = sp.group_id
    where gm.user_id = auth.uid()
  ));

-- pg_cron: 매주 일요일 23:30 JST → pending_close
create or replace function public.set_budget_pending_close()
returns void language plpgsql security definer as $$
begin
  update public.budget_weeks
  set status = 'pending_close'
  where status = 'open'
    and week_end < current_date;
end;
$$;

-- pg_cron: 월요일 00:05 JST → 미처리 자동 이월
create or replace function public.auto_close_pending_budgets()
returns void language plpgsql security definer as $$
declare
  week_rec      record;
  remaining_amt int;
  next_week_start date;
  next_week_end   date;
  next_base       int;
  group_user_id   uuid;
begin
  for week_rec in
    select bw.id, bw.budget_id, bw.week_end, bw.base_amount, bw.spent_amount,
           b.weekly_amount, b.group_id
    from public.budget_weeks bw
    join public.budgets b on b.id = bw.budget_id
    where bw.status = 'pending_close'
  loop
    remaining_amt := week_rec.base_amount - week_rec.spent_amount;

    select user_id into group_user_id
    from public.group_members
    where group_id = week_rec.group_id
    limit 1;

    insert into public.budget_closings (budget_week_id, remaining, to_carry_over, to_savings_pool, closed_by)
    values (
      week_rec.id,
      remaining_amt,
      greatest(remaining_amt, 0),
      0,
      group_user_id
    );

    update public.budget_weeks set status = 'closed' where id = week_rec.id;

    next_week_start := week_rec.week_end + interval '1 day';
    next_week_end   := next_week_start + interval '6 days';
    next_base       := week_rec.weekly_amount + remaining_amt;
    if next_base < 0 then next_base := 0; end if;

    insert into public.budget_weeks (budget_id, week_start, week_end, base_amount)
    values (week_rec.budget_id, next_week_start, next_week_end, next_base)
    on conflict (budget_id, week_start) do nothing;
  end loop;
end;
$$;

select cron.schedule(
  'weekly-budget-pending',
  '30 14 * * 0',
  $$ select public.set_budget_pending_close(); $$
);

select cron.schedule(
  'weekly-budget-auto-close',
  '5 15 * * 0',
  $$ select public.auto_close_pending_budgets(); $$
);

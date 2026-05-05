-- TASK-03: 그룹 생성 & 멤버 관리

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);

create table public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.group_invites (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  token      text not null unique default gen_random_uuid()::text,
  created_by uuid not null references public.users(id),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

-- 그룹: 멤버만 조회 가능
create policy "그룹 멤버 조회" on public.groups
  for select using (
    id in (select group_id from public.group_members where user_id = auth.uid())
  );

-- 그룹: 서버(API Route)가 INSERT (RLS 우회 없이 anon key로 불가 → service role 필요)
-- API Route에서 service role 클라이언트로 INSERT 처리
create policy "그룹 생성" on public.groups
  for insert with check (created_by = auth.uid());

-- 그룹 멤버: 같은 그룹 멤버만 조회 가능
create policy "멤버 조회" on public.group_members
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "멤버 삽입" on public.group_members
  for insert with check (user_id = auth.uid());

create policy "멤버 삭제 (owner)" on public.group_members
  for delete using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- 초대 링크: 같은 그룹 멤버면 조회 가능
create policy "초대 조회" on public.group_invites
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "초대 생성 (owner)" on public.group_invites
  for insert with check (
    created_by = auth.uid()
    and group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

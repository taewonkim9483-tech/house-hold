-- TASK-12: 그룹 관리 리팩터링

-- group_members 권한 변경 시각 추가
alter table public.group_members
  add column if not exists role_updated_at timestamptz;

-- 그룹 정보 수정: owner만 가능
create policy "그룹 수정 owner only" on public.groups
  for update using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- 멤버 role 변경: owner만 가능
create policy "멤버 역할 변경 owner only" on public.group_members
  for update using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

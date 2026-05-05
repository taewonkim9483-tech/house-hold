-- TASK-03 fix: group_members RLS 무한 재귀 수정
-- 원인: group_members SELECT 정책이 자기 자신을 서브쿼리로 참조
-- 해결: security definer 함수로 RLS 우회하여 내 group_id 목록 조회

-- 기존 재귀 유발 정책 제거
drop policy if exists "그룹 멤버 조회" on public.groups;
drop policy if exists "멤버 조회" on public.group_members;

-- security definer 함수: RLS 없이 현재 유저의 group_id 목록 반환
create or replace function public.my_group_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from public.group_members where user_id = auth.uid()
$$;

-- groups: 내가 속한 그룹만 조회 (함수로 재귀 방지)
create policy "그룹 멤버 조회" on public.groups
  for select using (
    id in (select public.my_group_ids())
  );

-- group_members: 같은 그룹 멤버 조회 (함수로 재귀 방지)
create policy "멤버 조회" on public.group_members
  for select using (
    group_id in (select public.my_group_ids())
  );

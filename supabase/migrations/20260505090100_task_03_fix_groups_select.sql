-- TASK-03 fix: groups INSERT 후 RETURNING 시 SELECT 정책 403 수정
-- 원인: INSERT 직후 .select('id') 실행 시 아직 group_members 레코드가 없어 SELECT 정책 실패
-- 해결: 생성자(created_by)도 조회 가능하도록 정책 확장

drop policy if exists "그룹 멤버 조회" on public.groups;

create policy "그룹 멤버 조회" on public.groups
  for select using (
    created_by = auth.uid()
    or id in (select public.my_group_ids())
  );

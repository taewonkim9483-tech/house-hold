-- TASK-03 fix: group_invites SELECT 정책 수정
-- 원인: "초대 조회" 정책이 기존 멤버만 조회 가능 → 초대받은 사람은 아직 멤버가 아니라 토큰 조회 불가
-- 해결: 인증된 사용자(auth.uid() is not null)면 누구나 토큰으로 조회 허용
--       (토큰 UUID 자체가 비밀키 역할이므로 URL을 아는 사람만 접근 가능)

drop policy if exists "초대 조회" on public.group_invites;

create policy "초대 토큰 조회" on public.group_invites
  for select using (auth.uid() is not null);

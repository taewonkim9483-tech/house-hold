-- TASK-11: 유저 프로필 설정
-- users 테이블에 display_name, avatar_url 컬럼 추가
alter table public.users
  add column if not exists display_name text,
  add column if not exists avatar_url   text;

-- avatars 버킷 생성
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

-- RLS: 본인 파일만 업로드/삭제, 전체 읽기
create policy "아바타 업로드" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "아바타 수정" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "아바타 삭제" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "아바타 공개 읽기" on storage.objects
  for select using (bucket_id = 'avatars');

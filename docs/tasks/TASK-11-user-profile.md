# TASK-11 — 유저 프로필 설정

## 목표
유저의 표시 이름과 프로필 사진을 설정·수정하는 화면 구현.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| P-1 | 프로필 설정 |

## DB 마이그레이션

`public.users` 테이블에 컬럼 추가:

```sql
alter table public.users
  add column if not exists display_name text,
  add column if not exists avatar_url   text;
```

Supabase Storage 버킷 생성:
```sql
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
```

## API Routes

### GET /api/profile
```
역할: 현재 유저 프로필 조회
응답: { id, email, display_name, avatar_url }
```

### PATCH /api/profile
```
역할: 표시 이름 수정
입력: { display_name: string }
처리: users UPDATE (display_name)
```

### POST /api/profile/avatar
```
역할: 프로필 사진 업로드
입력: multipart/form-data — file (image/*)
처리:
  1. Supabase Storage 'avatars/{user_id}/avatar.{ext}' 업로드 (upsert)
  2. users.avatar_url 업데이트
응답: { avatar_url }
제한: 5MB 이하, image/* MIME만 허용
```

### DELETE /api/profile/avatar
```
역할: 프로필 사진 삭제 (기본 아바타로 복원)
처리:
  1. Storage 파일 삭제
  2. users.avatar_url = null
```

## 구현 상세

### 프로필 설정 화면 (P-1)
```
┌──────────────────────────────────┐
│  프로필 사진                       │
│  [ 원형 아바타 ] [사진 변경] [삭제] │
│                                  │
│  표시 이름                        │
│  [ 입력 필드          ]           │
│                                  │
│  이메일 (수정 불가)                 │
│  user@example.com                │
│                                  │
│         [저장]                    │
└──────────────────────────────────┘
```

- 아바타 미설정 시 이니셜(display_name 첫 글자) 기본 표시
- 사진 변경: `<input type="file" accept="image/*">` → 미리보기 후 저장
- 표시 이름 빈 값 불가 (zod: `min(1)`)
- 저장 성공 시 토스트 알림

### 설정 홈 연동
TASK-09의 설정 홈(S-1) 메뉴에 **프로필 설정** 항목 추가:
```
설정
├── 프로필 설정          →  P-1  ← 추가
├── 언어 설정            →  S-4
├── 단위 설정            →  S-2
├── 카테고리 관리        →  S-3
└── 멤버 관리            →  S-5
```

## 완료 조건
- [ ] 표시 이름 수정 후 저장 반영 확인
- [ ] 프로필 사진 업로드 및 미리보기 동작
- [ ] 5MB 초과 파일 업로드 시 오류 메시지
- [ ] 사진 삭제 후 이니셜 기본 아바타 표시
- [ ] 이메일 필드 수정 불가 처리
- [ ] 다른 화면(헤더·그룹 멤버 목록)에서 변경된 이름/사진 반영

## 참조 파일
- `docs/tasks/TASK-09-settings.md` — 설정 홈 구조
- `docs/tasks/TASK-03-group.md` — users 테이블 구조

## 다음 태스크
→ TASK-12-group-refactor.md

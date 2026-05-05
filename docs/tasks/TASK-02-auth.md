# TASK-02 — 인증

## 목표
이메일 회원가입 / 로그인 / 그룹 초대 링크 수락 구현.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| A-1 | 로그인 |
| A-2 | 회원가입 |
| A-3 | 그룹 초대 수락 |

## DB 마이그레이션

```sql
-- Supabase Auth가 auth.users를 자동 관리
-- public.users는 프로필 확장용

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  lang        text not null default 'ko' check (lang in ('ko', 'ja')),
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;
create policy "본인만 조회/수정" on public.users
  using (auth.uid() = id);

-- 회원가입 시 자동 프로필 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## API Routes
없음 — Supabase Auth 클라이언트 직접 사용

## 구현 상세

### 회원가입 (A-2)
```
입력: 이름 / 이메일 / 비밀번호
처리: supabase.auth.signUp() + display_name 메타데이터 전달
완료: 이메일 인증 안내 화면으로 이동
```

### 로그인 (A-1)
```
입력: 이메일 / 비밀번호
처리: supabase.auth.signInWithPassword()
완료: /(locale)/dashboard 리다이렉트
```

### 그룹 초대 수락 (A-3)
```
URL 형식: /(locale)/invite?token={invite_token}
처리:
  1. 비로그인 상태 → 로그인/회원가입 후 토큰 유지하여 재처리
  2. 로그인 상태 → group_members에 추가 → 그룹 대시보드 이동
```

### 미들웨어 (인증 가드)
```
비로그인 → /(locale)/login 리다이렉트
로그인 → /(locale)/dashboard 리다이렉트 (auth 페이지 접근 시)
```

## 완료 조건
- [ ] 회원가입 → 이메일 수신 확인
- [ ] 로그인 → 대시보드 이동
- [ ] 로그아웃 동작
- [ ] 비로그인 상태에서 보호 경로 접근 시 리다이렉트
- [ ] 초대 링크 미로그인 접근 → 로그인 후 자동 수락
- [ ] 한국어/일본어 UI 전환 확인

## 참조 파일
- `docs/CLAUDE.md`
- `docs/screens/AUTH.html` — 화면 프로토타입
- PRD Section 3.1 — 인증 기능 요구사항

## 다음 태스크
→ TASK-03-group.md

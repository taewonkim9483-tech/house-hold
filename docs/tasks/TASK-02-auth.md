# TASK-02 — 인증

## 목표
Google OAuth 로그인 / 그룹 초대 링크 수락 구현.
이메일/비밀번호 방식은 사용하지 않음. Google 계정으로만 로그인.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| A-1 | 로그인 (Google 버튼) |
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

-- Google OAuth 로그인 시 자동 프로필 생성 트리거
-- display_name: Google 계정의 full_name 또는 name 사용
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## API Routes

### `/api/auth/callback` (GET)
```
역할: Google OAuth 인증 완료 후 Supabase가 리다이렉트하는 콜백 처리
처리:
  1. URL searchParams에서 code 추출
  2. supabase.auth.exchangeCodeForSession(code)
  3. next 파라미터가 있으면 해당 경로로, 없으면 /(locale)/dashboard 로 리다이렉트
```

## 구현 상세

### 로그인 (A-1)
```
UI: Google 로그인 버튼 1개
처리: supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `{origin}/api/auth/callback`,
    scopes: 'email profile'
  }
})
완료: Google 동의 화면 → 콜백 → /(locale)/dashboard 리다이렉트
```

### 그룹 초대 수락 (A-3)
```
URL 형식: /(locale)/invite?token={invite_token}
처리:
  1. 비로그인 상태 → /(locale)/login?next=/(locale)/invite?token=... 리다이렉트
  2. 로그인 상태 → group_members에 추가 → 그룹 대시보드 이동
콜백 처리: /api/auth/callback?next=/(locale)/invite?token=... 로 복귀
```

### 미들웨어 (인증 가드)
```
보호 경로: /(locale)/dashboard, /(locale)/invite 등 (auth) 외 경로
비로그인 → /(locale)/login 리다이렉트 (next 파라미터 포함)
로그인 → /(locale)/dashboard 리다이렉트 (login 페이지 접근 시)
```

## Supabase 설정 (수동)
Supabase Dashboard → Authentication → Providers → Google:
- Client ID / Client Secret 입력 (Google Cloud Console OAuth 앱)
- Redirect URI: `{SUPABASE_URL}/auth/v1/callback`

## 완료 조건
- [ ] Google 로그인 → 대시보드 이동
- [ ] 로그아웃 동작
- [ ] 비로그인 상태에서 보호 경로 접근 시 /login 리다이렉트
- [ ] 초대 링크 미로그인 접근 → 로그인 후 자동 수락
- [ ] 한국어/일본어 UI 전환 확인

## 참조 파일
- `docs/CLAUDE.md`
- `docs/screens/AUTH_LIGHT.html` — 화면 프로토타입 (Google 버튼으로 대체)
- PRD Section 3.1 — 인증 기능 요구사항

## 다음 태스크
→ TASK-03-group.md

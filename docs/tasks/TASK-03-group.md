# TASK-03 — 그룹 생성 & 멤버 관리

## 목표
그룹 생성, 초대 링크 발급, 멤버 관리 구현.
이후 모든 데이터(영수증·예산)는 group_id 기반으로 격리됨.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| G-1 | 그룹 홈 |
| G-2 | 그룹 초대 |
| G-3 | 멤버별 지출 |
| S-5 | 멤버 관리 |

## DB 마이그레이션

```sql
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

-- 그룹 멤버: 같은 그룹 멤버만 조회 가능
create policy "멤버 조회" on public.group_members
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );
```

## API Routes

### POST /api/groups
```
역할: 그룹 생성
처리: groups INSERT + group_members INSERT (role: owner)
응답: { group_id }
```

### POST /api/groups/invite
```
역할: 초대 링크 생성
처리: group_invites INSERT → token 반환
응답: { invite_url: "/(locale)/invite?token={token}" }
권한: owner만 가능
```

### POST /api/groups/join
```
역할: 초대 토큰으로 그룹 가입
처리:
  1. token 유효성 확인 (만료 여부)
  2. 이미 멤버인지 확인
  3. group_members INSERT (role: member)
응답: { group_id }
```

### DELETE /api/groups/members/[userId]
```
역할: 멤버 제거
권한: owner만 가능, 본인 제거 불가
```

## 구현 상세

### 그룹 모드 전환 흐름
```
가입 후 첫 진입
  → 그룹 없음 → "그룹 만들기" or "초대 링크로 참여" 선택 화면
  → 그룹 있음 → 대시보드 (그룹 모드)
```

### 초대 링크 스펙
```
URL: /{locale}/invite?token={uuid}
유효기간: 7일
1회성 아님 (만료 전까지 복수 인원 가입 가능)
MVP: 그룹당 멤버 최대 2인 제한
```

### 멤버별 지출 (G-3)
```
집계 쿼리: receipts.uploaded_by 기준 그룹 멤버별 주간/월간 지출 합계
표시: 멤버 이름 / 지출 금액 / 전체 대비 비율
```

## 완료 조건
- [ ] 그룹 생성 후 오너로 자동 등록
- [ ] 초대 링크 생성 및 복사
- [ ] 초대 링크로 2번째 유저 가입 확인
- [ ] 만료된 토큰 접근 시 오류 처리
- [ ] 멤버 제거 동작 확인
- [ ] G-3 멤버별 지출 집계 확인

## 참조 파일
- `docs/CLAUDE.md`
- PRD Section 3.5 — 그룹 관리
- PRD Section 5 — DB 설계

## 다음 태스크
→ TASK-04-receipt.md

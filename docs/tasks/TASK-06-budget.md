# TASK-06 — 예산 관리

## 목표
주간 예산 설정, 실시간 지출 현황, 주간 마감 처리(이월/적금 풀) 구현.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| B-1 | 예산 설정 |
| B-2 | 주간 마감 처리 |

## DB 마이그레이션

```sql
create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade unique,
  weekly_amount int not null,   -- 기준 주간 예산 (JPY)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.budget_weeks (
  id            uuid primary key default gen_random_uuid(),
  budget_id     uuid not null references public.budgets(id) on delete cascade,
  week_start    date not null,   -- 월요일
  week_end      date not null,   -- 일요일
  base_amount   int not null,    -- 이번 주 실제 예산 (이월/삭감 반영 후)
  spent_amount  int not null default 0,
  status        text not null default 'open' check (status in ('open', 'pending_close', 'closed')),
  created_at    timestamptz not null default now(),
  unique (budget_id, week_start)
);

create table public.budget_closings (
  id              uuid primary key default gen_random_uuid(),
  budget_week_id  uuid not null references public.budget_weeks(id),
  remaining       int not null,
  to_carry_over   int not null default 0,
  to_savings_pool int not null default 0,
  closed_at       timestamptz not null default now(),
  closed_by       uuid not null references public.users(id)
);

-- RLS
alter table public.budgets enable row level security;
alter table public.budget_weeks enable row level security;
alter table public.budget_closings enable row level security;

create policy "그룹 멤버 접근" on public.budgets
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));
-- budget_weeks, budget_closings도 동일 패턴 적용
```

## API Routes

### POST /api/budgets
```
역할: 주간 예산 설정 (최초 or 변경)
입력: { weekly_amount: number }
처리: budgets upsert (group_id unique)
```

### GET /api/budgets/current
```
역할: 이번 주 예산 현황
응답:
{
  "week_id": string,
  "week_start": "date",
  "week_end": "date",
  "base_amount": number,
  "spent_amount": number,
  "remaining": number,
  "is_over": boolean,
  "status": "open|pending_close|closed"
}
```

### POST /api/budgets/close
```
역할: 주간 마감 처리
입력:
{
  "week_id": string,
  "to_carry_over": number,   // 이월 금액
  "to_savings_pool": number  // 적금 풀 금액
}
처리:
  1. remaining = base_amount - spent_amount
  2. 입력값 합계 = remaining 검증
  3. budget_closings INSERT
  4. budget_weeks status → 'closed'
  5. 다음 주 budget_weeks 생성
     next_base = weekly_amount + to_carry_over - (초과분이면 초과액)
  6. savings_pool.total_amount += to_savings_pool
  7. savings_pool_logs INSERT
응답: { next_week_budget: number }
```

### POST /api/budgets/spent (내부용)
```
역할: 영수증 저장 시 spent_amount 업데이트
입력: { group_id: string, amount: number, purchased_at: string }
처리: budget_weeks.spent_amount += amount (해당 주차)
※ TASK-04 POST /api/receipts 에서 내부 호출
```

## 구현 상세

### 주간 마감 흐름 (B-2)
```
트리거:
  1. pg_cron: 매주 일요일 23:30 JST → status = 'pending_close'
  2. 앱 내 배너로 마감 처리 유도

마감 처리 UI:
  잔액: ¥5,200
  ─────────────────────────
  ● 전액 이월          → 다음 주 +¥5,200
  ● 전액 적금 풀       → 풀에 +¥5,200
  ● 직접 나누기
      이월    [  3,000 ]
      적금 풀 [  2,200 ]
  ─────────────────────────
  [확인] 버튼

  선택 미완료 기본값: 전액 이월 (월요일 00:00 JST 자동 처리)
```

### 초과 처리
```
spent_amount > base_amount 인 경우:
  - 잔액 = 음수 → 마감 화면에 "초과" 표시
  - 다음 주 예산: weekly_amount - 초과액
  - 적금 풀 적립 없음 (초과 시 이월/풀 선택 화면 미표시)
```

### pg_cron 설정
```sql
-- 매주 일요일 23:30 JST (14:30 UTC)
select cron.schedule(
  'weekly-budget-pending',
  '30 14 * * 0',
  $$ select set_budget_pending_close(); $$
);

-- 매주 월요일 00:05 JST (15:05 UTC 일요일)
-- 미처리 건 자동 이월
select cron.schedule(
  'weekly-budget-auto-close',
  '5 15 * * 0',
  $$ select auto_close_pending_budgets(); $$
);
```

## 완료 조건
- [ ] 주간 예산 설정 저장
- [ ] 영수증 저장 시 spent_amount 즉시 반영
- [ ] 잔액 / 초과 여부 실시간 표시
- [ ] 마감 처리 화면 (이월/적금 풀/분배) 동작
- [ ] 다음 주 예산 자동 생성 확인
- [ ] 초과 시 다음 주 예산 삭감 확인
- [ ] pg_cron 동작 확인 (Supabase 대시보드)

## 참조 파일
- `docs/CLAUDE.md`
- `docs/screens/BUDGET.html` — 화면 프로토타입
- `docs/tasks/TASK-07-savings.md` — 적금 풀 연동
- PRD Section 3.4 — 예산 관리

## 다음 태스크
→ TASK-07-savings.md

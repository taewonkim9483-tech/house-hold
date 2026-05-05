# TASK-07 — 적금 풀

## 목표
주간 마감 시 적립된 적금 풀 현황 표시 및 이력 관리.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| B-3 | 적금 풀 |

## DB 마이그레이션

```sql
create table public.savings_pool (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade unique,
  total_amount int not null default 0,
  updated_at   timestamptz not null default now()
);

create table public.savings_pool_logs (
  id         uuid primary key default gen_random_uuid(),
  pool_id    uuid not null references public.savings_pool(id) on delete cascade,
  amount     int not null,   -- 양수: 적립 / 음수: 사용 (v2)
  reason     text not null,  -- 'weekly_closing'
  week_label text,           -- 예: '2025-W20'
  created_at timestamptz not null default now()
);

-- RLS
alter table public.savings_pool enable row level security;
alter table public.savings_pool_logs enable row level security;

create policy "그룹 멤버 접근" on public.savings_pool
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));
```

## API Routes

### GET /api/savings
```
역할: 적금 풀 현황 + 이력
응답:
{
  "total_amount": number,
  "logs": [
    {
      "amount": number,
      "reason": string,
      "week_label": string,
      "created_at": string
    }
  ]
}
```

## 구현 상세

### 적금 풀 화면 (B-3)
```
[적금 풀]
누적 금액: ¥28,400

─── 적립 이력 ───────────────────
2025-W22   +¥3,200   주간 마감
2025-W21   +¥1,800   주간 마감
2025-W20   +¥5,400   주간 마감
...
```

### MVP 범위
- 적립(+) 만 지원
- 사용(-) 기능은 v2에서 추가
- 이력은 최신순 정렬, 전체 표시

## 완료 조건
- [ ] 적금 풀 누적 금액 표시
- [ ] 주간 마감 후 적립 이력 추가 확인
- [ ] 이력 최신순 정렬

## 참조 파일
- `docs/CLAUDE.md`
- `docs/tasks/TASK-06-budget.md` — 마감 시 savings_pool 업데이트 로직

## 다음 태스크
→ TASK-08-price-compare.md

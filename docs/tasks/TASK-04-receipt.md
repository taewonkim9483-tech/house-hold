# TASK-04 — 영수증 분석

## 목표
영수증 이미지 업로드 → Gemini API 분석 → 결과 확인/편집 → DB 저장.
카테고리 자동 분류, 태그 자동 부여, 100g 단가 계산 포함.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| R-1 | 영수증 업로드 |
| R-2 | 분석 결과 확인 & 편집 |
| R-3 | 저장 완료 |

## DB 마이그레이션

```sql
-- 카테고리 마스터
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.groups(id) on delete cascade, -- NULL = 시스템 기본
  name_ko     text not null,
  name_ja     text not null,
  icon        text not null,
  is_system   boolean not null default false,
  sort_order  int not null default 0
);

-- 시스템 기본 카테고리 INSERT
insert into public.categories (name_ko, name_ja, icon, is_system, sort_order) values
  ('신선식품', '生鮮食品', '🥬', true, 1),
  ('가공식품', '加工食品', '🥫', true, 2),
  ('음료',     '飲料',     '🥤', true, 3),
  ('주류',     'アルコール','🍺', true, 4),
  ('생활용품', '日用品',   '🧴', true, 5),
  ('청소용품', '清掃用品', '🧹', true, 6),
  ('의약품/건강','医薬品・健康','💊', true, 7),
  ('반려동물용품','ペット用品','🐾', true, 8),
  ('육아용품', '育児用品', '👶', true, 9),
  ('기타',     'その他',   '📦', true, 10);

-- 커스텀 단위 설정
create table public.custom_units (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  item_name   text,              -- 특정 상품명 (NULL이면 카테고리 전체 적용)
  category_id uuid references public.categories(id),
  unit_type   text not null check (unit_type in ('per_100g', 'per_100ml', 'per_count', 'per_g', 'per_ml')),
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);

-- 태그
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- 영수증
create table public.receipts (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  uploaded_by  uuid not null references public.users(id),
  store_name   text not null,
  purchased_at timestamptz not null,
  total_amount int not null,        -- JPY (정수)
  tax_amount   int,
  image_url    text,
  created_at   timestamptz not null default now()
);

-- 영수증 상품
create table public.receipt_items (
  id            uuid primary key default gen_random_uuid(),
  receipt_id    uuid not null references public.receipts(id) on delete cascade,
  name          text not null,          -- 일본어 원문
  category_id   uuid references public.categories(id),
  quantity      numeric not null default 1,
  unit_price    int not null,           -- JPY
  subtotal      int not null,           -- JPY
  unit_type     text not null default 'per_count'
                  check (unit_type in ('per_100g', 'per_100ml', 'per_count', 'per_g', 'per_ml')),
  weight_g      numeric,               -- 중량 g (해당 시)
  volume_ml     numeric,               -- 용량 ml (해당 시)
  price_per_100 numeric,               -- 100g 또는 100ml 당 단가 (사전 계산)
  created_at    timestamptz not null default now()
);

-- 상품-태그 매핑
create table public.item_tags (
  item_id uuid not null references public.receipt_items(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

-- RLS (group_id 기반)
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

create policy "그룹 멤버만 접근" on public.receipts
  using (group_id in (
    select group_id from public.group_members where user_id = auth.uid()
  ));

create policy "영수증 통해 접근" on public.receipt_items
  using (receipt_id in (
    select id from public.receipts where group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  ));
```

## API Routes

### POST /api/receipts/analyze
```
역할: 영수증 이미지 분석 (저장 없음, 미리보기용)
입력: multipart/form-data { image: File }
처리:
  1. 이미지 → base64 변환
  2. Gemini API 호출 (아래 프롬프트 참조)
  3. JSON 파싱 후 반환
응답: AnalyzedReceipt (JSON)
```

### POST /api/receipts
```
역할: 분석 결과 확정 저장
입력: { receipt: ReceiptData, items: ItemData[] }
처리:
  1. Supabase Storage에 이미지 업로드
  2. receipts INSERT
  3. receipt_items INSERT (price_per_100 계산 포함)
  4. tags upsert + item_tags INSERT
  5. budget_weeks.spent_amount 업데이트
응답: { receipt_id }
```

## Gemini API 프롬프트

```
system: "You are a receipt analyzer. Always respond in valid JSON only. No markdown, no explanation."

user: """
Analyze this Japanese receipt image and extract all information.
Also classify each item and assign tags for price comparison.

Respond ONLY with this JSON structure:
{
  "store_name": "string (Japanese)",
  "purchased_at": "ISO8601 datetime",
  "total_amount": number,
  "tax_amount": number | null,
  "items": [
    {
      "name": "string (Japanese original)",
      "quantity": number,
      "unit_price": number,
      "subtotal": number,
      "category": "生鮮食品|加工食品|飲料|アルコール|日用品|清掃用品|医薬品・健康|ペット用品|育児用品|その他",
      "tags": ["string"],
      "unit_type": "per_100g|per_100ml|per_count",
      "weight_g": number | null,
      "volume_ml": number | null,
      "price_per_100": number | null
    }
  ]
}

Rules:
- unit_type: use per_100g for meat/fish, per_100ml for beverages, per_count otherwise
- price_per_100: calculate if weight_g or volume_ml is available
- tags: use Japanese, 2-4 tags per item (product type, brand hint, size hint)
- All amounts in JPY integers
"""
```

## 구현 상세

### 분석 결과 편집 화면 (R-2)
```
각 상품 행에서 편집 가능한 항목:
  - 상품명 (텍스트)
  - 카테고리 (드롭다운)
  - 수량 (숫자)
  - 단가 (숫자)
  - 100g 단가 표시 (자동 계산, 읽기 전용)

상품 추가 / 삭제 가능
저장 버튼 → POST /api/receipts
```

### 100g 단가 계산 로직
```typescript
// 우선순위:
// 1. custom_units 테이블에 item_name 일치 항목
// 2. custom_units 테이블에 category_id 일치 항목
// 3. 시스템 기본: 生鮮食品 카테고리 → per_100g 자동 적용
// 4. 나머지 → per_count

function calcPricePer100(item): number | null {
  if (item.weight_g) return Math.round(item.unit_price / item.weight_g * 100);
  if (item.volume_ml) return Math.round(item.unit_price / item.volume_ml * 100);
  return null;
}
```

## 완료 조건
- [ ] 이미지 업로드 → Gemini 응답 수신 (10초 이내)
- [ ] 분석 결과 화면에 상품 리스트 표시
- [ ] 카테고리 / 수량 / 단가 편집 후 저장
- [ ] 고기/생선 품목 100g 단가 자동 표시
- [ ] DB 저장 후 예산 spent_amount 반영
- [ ] Supabase Storage 이미지 업로드 확인
- [ ] Gemini API 키 클라이언트 미노출 확인

## 참조 파일
- `docs/CLAUDE.md`
- `docs/screens/RECEIPT.html` — 화면 프로토타입
- `docs/tasks/TASK-06-budget.md` — spent_amount 연동
- PRD Section 3.2 — 영수증 분석 기능

## 다음 태스크
→ TASK-05-dashboard.md

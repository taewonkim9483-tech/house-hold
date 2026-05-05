# TASK-05 — 지출 내역 & 대시보드

## 목표
홈 대시보드 및 지출 내역 리스트 구현.
주간 예산 현황, 카테고리 파이차트, 최근 지출 표시.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| M-1 | 홈 / 대시보드 |
| M-2 | 지출 내역 |

## DB 마이그레이션
없음 (TASK-03, 04에서 생성된 테이블 사용)

## API Routes

### GET /api/dashboard
```
역할: 대시보드 집계 데이터
응답:
{
  "week": {
    "budget": number,
    "spent": number,
    "remaining": number,
    "start": "date",
    "end": "date"
  },
  "category_breakdown": [
    { "category_id": string, "name_ko": string, "name_ja": string,
      "icon": string, "amount": number, "ratio": number }
  ],
  "recent_receipts": [   // 최근 5건
    { "id": string, "store_name": string, "purchased_at": string,
      "total_amount": number, "uploaded_by_name": string }
  ]
}
```

### GET /api/receipts
```
역할: 지출 내역 리스트 (페이지네이션)
쿼리 파라미터:
  - page: number (default 1)
  - limit: number (default 20)
  - category_id: uuid (optional)
  - user_id: uuid (optional, 멤버 필터)
  - date_from: date (optional)
  - date_to: date (optional)
응답: { receipts: Receipt[], total: number }
```

### GET /api/receipts/[id]
```
역할: 영수증 상세 (상품 리스트 포함)
응답: { receipt: Receipt, items: ReceiptItem[] }
```

## 구현 상세

### 대시보드 (M-1) 컴포넌트 구성
```
<DashboardPage>
  <WeeklyBudgetCard>       // 주간 예산 현황 (프로그레스바)
  <CategoryPieChart>       // 카테고리별 지출 파이차트
  <RecentReceiptList>      // 최근 영수증 5건
  <QuickActionButtons>     // 영수증 업로드 / 가격 비교 바로가기
```

### 주간 예산 카드
```
표시 항목:
  - 이번 주 예산: ¥20,000
  - 지출: ¥12,450 (62%)
  - 잔액: ¥7,550
  - 프로그레스바 (초과 시 빨간색)
  - 주 시작~종료 날짜
```

### 지출 내역 (M-2) 필터
```
필터 옵션:
  - 기간: 이번 주 / 이번 달 / 직접 선택
  - 카테고리: 전체 / 개별 선택
  - 멤버: 전체 / 개별 (그룹 모드만)
정렬: 최신순 (고정)
```

### 지출 내역 리스트 아이템
```
[매장명]              [총액 ¥]
[날짜 · 시간]  [등록자]  [상품 수]개
[카테고리 태그들...]
```

## 완료 조건
- [ ] 대시보드 주간 예산 현황 표시
- [ ] 카테고리 파이차트 렌더링
- [ ] 최근 영수증 5건 표시
- [ ] 지출 내역 페이지네이션 동작
- [ ] 카테고리 / 멤버 / 기간 필터 동작
- [ ] 그룹 모드: 멤버 등록자 이름 표시
- [ ] 영수증 클릭 → 상세 (상품 리스트) 표시

## 참조 파일
- `docs/CLAUDE.md`
- `docs/screens/DASHBOARD.html` — 화면 프로토타입
- `docs/tasks/TASK-06-budget.md` — 예산 데이터 연동

## 다음 태스크
→ TASK-06-budget.md

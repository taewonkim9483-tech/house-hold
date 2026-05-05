# TASK-10 — 월간 리포트

## 목표
월별 지출 그래프 및 카테고리 분석 화면 구현.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| M-3 | 월간 리포트 |

## DB 마이그레이션
없음 (기존 테이블 집계 쿼리만 사용)

## API Routes

### GET /api/reports/monthly
```
역할: 월간 지출 집계
쿼리 파라미터:
  - year: number
  - month: number (1-12)
응답:
{
  "year": number,
  "month": number,
  "total_amount": number,
  "receipt_count": number,
  "daily_breakdown": [
    { "date": "YYYY-MM-DD", "amount": number }
  ],
  "category_breakdown": [
    {
      "category_id": string,
      "name_ko": string,
      "name_ja": string,
      "icon": string,
      "amount": number,
      "ratio": number,
      "item_count": number
    }
  ],
  "member_breakdown": [   // 그룹 모드만
    { "user_id": string, "display_name": string, "amount": number }
  ],
  "prev_month_total": number   // 전월 대비용
}
```

## 구현 상세

### 월간 리포트 화면 (M-3)

```
[< 2025년 4월 >]     ← 월 선택 네비게이션

총 지출: ¥68,450
전월 대비: +¥5,200 (▲8.2%)

[ 일별 지출 바 차트 ]
 1  2  3  4 ... 30

[ 카테고리별 분석 ]
🥬 신선식품    ¥28,400  41.5%  ████████░
🥫 가공식품    ¥12,300  18.0%  ████░░░░░
🥤 음료        ¥8,200   12.0%  ██░░░░░░░
🧴 생활용품    ¥11,550  16.9%  ███░░░░░░
📦 기타        ¥8,000   11.7%  ██░░░░░░░

[ 멤버별 지출 ]  (그룹 모드)
Taewon    ¥42,300  61.8%
배우자     ¥26,150  38.2%
```

### 차트 라이브러리
```
Recharts 사용 (Next.js와 호환성 좋음)
  - 일별: BarChart
  - 카테고리: 수평 바 (커스텀, 파이차트 대신)
```

### 월 네비게이션
```
현재 월 기준 최대 12개월 전까지 조회 가능
미래 월 비활성화
```

## 완료 조건
- [ ] 월 선택 네비게이션 동작
- [ ] 총 지출 / 전월 대비 표시
- [ ] 일별 바 차트 렌더링
- [ ] 카테고리별 분석 표시 (비율 포함)
- [ ] 그룹 모드: 멤버별 지출 표시
- [ ] 데이터 없는 달 빈 상태 UI

## 참조 파일
- `docs/CLAUDE.md`
- PRD Section 3 — 기능 요구사항

## 다음 태스크
없음 (MVP 완료)

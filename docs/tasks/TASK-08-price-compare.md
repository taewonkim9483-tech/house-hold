# TASK-08 — 상품 가격 비교

## 목표
상품 사진 업로드 → Gemini API로 상품 식별 → 과거 구매 이력 기반 매장별 가격 비교.
동일 상품 + 태그 기반 유사 상품(타 브랜드) 비교 제공.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| P-1 | 상품 사진 업로드 |
| P-2 | 가격 비교 결과 |

## DB 마이그레이션
없음 (TASK-04에서 생성된 테이블 사용)

## API Routes

### POST /api/price-compare
```
역할: 상품 사진 분석 + 가격 비교 결과 반환
입력: multipart/form-data { image: File }
처리:
  1. Gemini API로 상품 식별
  2. 동일 상품 검색 (name + unit_type + weight_g or volume_ml 매칭)
  3. 태그 기반 유사 상품 검색
  4. 결과 조합 후 반환
응답: PriceCompareResult (JSON)
```

## Gemini API 프롬프트 (상품 식별)

```
system: "You are a product identifier. Respond in valid JSON only."

user: """
Identify the product in this image.

Respond ONLY with:
{
  "name": "string (Japanese product name, brand included)",
  "brand": "string",
  "volume_ml": number | null,
  "weight_g": number | null,
  "unit_type": "per_100g|per_100ml|per_count",
  "tags": ["string (Japanese, 2-4 tags)"]
}
"""
```

## 가격 비교 검색 로직

```typescript
// 1단계: 동일 상품 검색
// name ILIKE '%{identified.name}%' AND weight_g = identified.weight_g (or volume_ml)
// → receipt_items + receipts JOIN → 매장명 / 날짜 / 단가 / price_per_100

// 2단계: 태그 기반 유사 상품 검색
// identified.tags 중 하나 이상 매칭되는 item_tags
// → 동일 상품 결과에서 제외
// → 상품명 / 매장명 / 최근 구매일 / 단가 / price_per_100

type PriceCompareResult = {
  identified: {
    name: string;
    brand: string;
    weight_g: number | null;
    volume_ml: number | null;
    unit_type: string;
  };
  same_product: PriceRecord[];     // 동일 상품 이력
  similar_products: SimilarItem[]; // 태그 기반 유사 상품
};

type PriceRecord = {
  store_name: string;
  purchased_at: string;
  unit_price: number;
  price_per_100: number | null;
  is_lowest: boolean;  // 최저가 플래그
};

type SimilarItem = {
  name: string;
  brand: string;
  weight_g: number | null;
  volume_ml: number | null;
  latest_price: PriceRecord;
  matched_tags: string[];
};
```

## 구현 상세

### 가격 비교 결과 화면 (P-2)

```
[상품 식별 결과]
コカ・コーラ 500ml

[ 동일 상품 구매 이력 ]
───────────────────────────────────────
04/28  イオン        ¥148   100ml당 ¥29.6
04/15  ライフ        ¥158   100ml당 ¥31.6  
03/30  業務スーパー  ¥138   100ml당 ¥27.6  ← 최저가 🏷️
───────────────────────────────────────

[ 같은 종류 · 타 브랜드 ]  ▼ (탭으로 펼치기)
───────────────────────────────────────
ペプシ 500ml          04/20  ライフ   ¥148   100ml당 ¥29.6
三ツ矢サイダー 500ml  04/10  イオン   ¥138   100ml당 ¥27.6
```

### 최저가 표시
```
동일 상품 이력 중 price_per_100 최솟값에 🏷️ 뱃지 표시
price_per_100 없으면 unit_price 기준
```

### 이력 없을 때
```
"아직 구매 이력이 없어요.
 영수증을 등록하면 다음부터 비교할 수 있어요."
```

## 완료 조건
- [ ] 상품 사진 → Gemini 식별 결과 표시
- [ ] 동일 상품 구매 이력 리스트 표시
- [ ] 최저가 항목 강조 표시
- [ ] 유사 상품 섹션 접힘/펼침 동작
- [ ] 100g / 100ml 단가 정상 표시
- [ ] 이력 없을 때 빈 상태 UI 표시

## 참조 파일
- `docs/CLAUDE.md`
- `docs/screens/PRICE_COMPARE.html` — 화면 프로토타입
- `docs/tasks/TASK-04-receipt.md` — item_tags 구조 참조
- PRD Section 3.3 — 가격 비교 기능

## 다음 태스크
→ TASK-09-settings.md

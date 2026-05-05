# TASK-09 — 설정

## 목표
언어 설정, 커스텀 단위 설정, 카테고리 관리 구현.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| S-1 | 설정 홈 |
| S-2 | 단위 설정 |
| S-3 | 카테고리 관리 |
| S-4 | 언어 설정 |

## DB 마이그레이션
없음 (categories, custom_units는 TASK-04에서 생성)

## API Routes

### GET /api/settings/units
```
역할: 그룹의 커스텀 단위 설정 목록
응답: { system_units: UnitRule[], custom_units: CustomUnit[] }
```

### POST /api/settings/units
```
역할: 커스텀 단위 추가
입력: { item_name?, category_id?, unit_type }
```

### PUT /api/settings/units/[id]
```
역할: 커스텀 단위 수정
```

### DELETE /api/settings/units/[id]
```
역할: 커스텀 단위 삭제 (시스템 기본 제외)
```

### GET /api/settings/categories
```
역할: 카테고리 목록 (시스템 + 그룹 커스텀)
```

### POST /api/settings/categories
```
역할: 커스텀 카테고리 추가
입력: { name_ko, name_ja, icon }
```

### DELETE /api/settings/categories/[id]
```
역할: 커스텀 카테고리 삭제 (시스템 카테고리 삭제 불가)
```

## 구현 상세

### 단위 설정 화면 (S-2)
```
[ 시스템 기본 ]
고기류 / 생선류    100g당   🔒

[ 커스텀 설정 ]
オリーブオイル     100ml당  [편집] [삭제]
プロテイン         100g당   [편집] [삭제]

[+ 추가]
  상품명 또는 카테고리 선택
  단위: 개당 / g당 / 100g당 / ml당 / 100ml당
  [저장]
```

### 언어 설정 (S-4)
```
처리:
  1. users.lang 업데이트 (Supabase)
  2. next-intl locale 쿠키 변경
  3. 페이지 리로드

주의:
  - UI 텍스트만 전환
  - 상품명·매장명 등 고유명사는 일본어 원문 유지
```

### 설정 홈 메뉴 구조 (S-1)
```
설정
├── 언어 설정          →  S-4
├── 단위 설정          →  S-2
├── 카테고리 관리      →  S-3
└── 멤버 관리          →  S-5 (TASK-03)
```

## 완료 조건
- [ ] 언어 전환 (한국어↔일본어) 즉시 반영
- [ ] 고유명사 언어 전환 미적용 확인
- [ ] 커스텀 단위 추가 / 편집 / 삭제
- [ ] 시스템 기본 단위 삭제 버튼 비활성화
- [ ] 커스텀 카테고리 추가 / 삭제
- [ ] 시스템 카테고리 삭제 버튼 비활성화

## 참조 파일
- `docs/CLAUDE.md`
- `docs/tasks/TASK-04-receipt.md` — custom_units 활용 로직
- PRD Section 3.6 — 설정 기능

## 다음 태스크
→ TASK-10-report.md

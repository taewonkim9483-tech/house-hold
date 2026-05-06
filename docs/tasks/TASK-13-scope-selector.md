# TASK-13 — 개인/그룹 범위 선택 컴포넌트

## 목표
대시보드·예산·영수증 등 데이터 조회 시 **개인 또는 속한 그룹** 중 범위를 선택하는
공통 컴포넌트 구현 및 각 화면에 적용.

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| SC-1 | 범위 선택 컴포넌트 (공통) |

## DB 마이그레이션
없음 (기존 receipts·budgets에 group_id / uploaded_by 컬럼 이미 존재 전제)

## 공통 컴포넌트 스펙

### `<ScopeSelector>` — `components/features/scope/ScopeSelector.tsx`

```typescript
type Scope =
  | { type: 'personal' }
  | { type: 'group'; groupId: string; groupName: string };

interface ScopeSelectorProps {
  value: Scope;
  onChange: (scope: Scope) => void;
}
```

**렌더링 구조**
```
┌─────────────────────────────────────────┐
│  [👤 개인]  [👨‍👩‍👧 우리집]  [🏢 직장 가계부]  │
└─────────────────────────────────────────┘
선택된 항목: 배경 인디고/퍼플 그라디언트, 나머지: 투명
```
- 항목: **개인** 고정 + 본인이 속한 그룹 목록 (그룹명 표시)
- 그룹이 없으면 개인만 표시
- 가로 스크롤 허용 (그룹 많을 경우)

### 상태 관리 — `hooks/useScopeStore.ts`
```typescript
// Zustand or React Context
interface ScopeStore {
  scope: Scope;
  setScope: (scope: Scope) => void;
}
// 기본값: personal
// 로컬스토리지 persist (새로고침 후 유지)
```

## API Routes

### GET /api/scope/groups
```
역할: 현재 유저가 속한 그룹 목록 조회 (범위 선택용 경량 응답)
응답: { groups: [{ id, name }] }
```

## 적용 화면
아래 화면에서 `<ScopeSelector>`를 상단에 배치하고, 선택된 scope에 따라 데이터 필터링:

| 화면 | 필터 방식 |
|------|----------|
| 대시보드 (TASK-05) | personal → uploaded_by = me / group → group_id = groupId |
| 예산 (TASK-06) | personal → user_id = me / group → group_id = groupId |
| 영수증 목록 (TASK-04) | personal → uploaded_by = me / group → group_id = groupId |
| 저축 (TASK-07) | personal → user_id = me / group → group_id = groupId |

## 구현 상세

### 범위 선택 UI 위치
각 화면 헤더 바로 아래, 날짜 필터 위에 배치:
```
┌────────────────────────────────────────┐
│  대시보드                               │
│  [👤 개인] [👨‍👩‍👧 우리집]                  │  ← ScopeSelector
│  ─────────────────────────────────── │
│  이번 주  〈 5/1 ~ 5/7 〉  〉           │  ← 날짜 필터
│  ...                                  │
└────────────────────────────────────────┘
```

### 데이터 페칭 연동
각 페이지/컴포넌트에서 `useScopeStore`의 `scope`를 구독:
```typescript
const { scope } = useScopeStore();

const params = scope.type === 'personal'
  ? { owner: 'me' }
  : { groupId: scope.groupId };

// API 호출 시 params 전달
```

### 그룹 미가입 상태
- 그룹이 없으면 `<ScopeSelector>` 미렌더링 (개인만 사용)
- 그룹 가입 유도 배너 표시 여부는 각 화면 재량

## 완료 조건
- [ ] 개인/그룹 탭 전환 시 데이터 즉시 갱신
- [ ] 선택 상태 새로고침 후 유지 (localStorage)
- [ ] 그룹 미가입 유저에게 컴포넌트 미표시
- [ ] 대시보드·예산·영수증 목록에 ScopeSelector 적용 확인
- [ ] 그룹 탭 선택 시 해당 그룹 데이터만 표시

## 참조 파일
- `docs/tasks/TASK-03-group.md` — group_id 기반 데이터 구조
- `docs/tasks/TASK-05-dashboard.md` — 대시보드 화면 구조
- `docs/tasks/TASK-06-budget.md` — 예산 화면 구조

## 다음 태스크
없음 (TASK-13이 현재 마지막 태스크)

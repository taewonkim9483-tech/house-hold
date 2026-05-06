# TASK-12 — 그룹 화면 리팩터링 & 그룹 관리

## 목표
기존 TASK-03의 그룹 기능을 개선:
- 멤버 권한(owner/member) 설정·변경 UI 추가
- 그룹 관리 전용 페이지 분리
- 그룹 정보(이름) 수정 기능 추가

## 포함 화면
| Screen ID | 화면명 |
|---|---|
| G-4 | 그룹 관리 홈 |
| G-5 | 멤버 권한 설정 |
| G-6 | 그룹 정보 수정 |

## DB 마이그레이션

`group_members` 권한 변경 이력 추적 (옵션):
```sql
-- group_members에 권한 변경 시각 추가
alter table public.group_members
  add column if not exists role_updated_at timestamptz;
```

RLS — owner 전용 쓰기 정책 추가:
```sql
-- 그룹 정보 수정: owner만 가능
create policy "그룹 수정 owner only" on public.groups
  for update using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- 멤버 role 변경: owner만 가능
create policy "멤버 역할 변경 owner only" on public.group_members
  for update using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'owner'
    )
  );
```

## API Routes

### GET /api/groups/[groupId]
```
역할: 그룹 상세 + 멤버 목록 조회
응답: {
  id, name, created_at,
  members: [{ user_id, display_name, avatar_url, role, joined_at }]
}
```

### PATCH /api/groups/[groupId]
```
역할: 그룹 이름 수정
입력: { name: string }
권한: owner만 가능
```

### PATCH /api/groups/[groupId]/members/[userId]/role
```
역할: 멤버 권한 변경 (member ↔ owner)
입력: { role: 'owner' | 'member' }
권한: owner만 가능
제약:
  - 그룹에 owner가 최소 1명 유지 (본인을 member로 강등 시 다른 owner 존재 필요)
응답: { user_id, role }
```

### DELETE /api/groups/[groupId]/members/[userId]
```
역할: 멤버 강퇴 (기존 TASK-03 엔드포인트 경로 통일)
권한: owner만 가능, 본인 강퇴 불가
```

### DELETE /api/groups/[groupId]/leave
```
역할: 본인이 그룹 탈퇴
제약: 그룹에 owner가 본인뿐이면 탈퇴 불가 (멤버에게 owner 위임 후 탈퇴)
```

## 구현 상세

### 그룹 관리 홈 (G-4)
```
┌──────────────────────────────────┐
│  그룹명 [편집 아이콘]              │
│                                  │
│  멤버 (2/2)                       │
│  ┌─────────────────────────────┐ │
│  │ [아바타] 홍길동   👑 오너    │ │
│  │ [아바타] 김영희   멤버  [⋮] │ │  ← owner만 메뉴 표시
│  └─────────────────────────────┘ │
│  [+ 멤버 초대]                    │
│                                  │
│  [그룹 탈퇴]                      │
└──────────────────────────────────┘
```

### 멤버 권한 설정 (G-5) — 바텀 시트 or 드롭다운
```
멤버: 김영희
현재 역할: 멤버

○ 오너로 변경  (그룹 관리 권한 부여)
● 멤버 유지

[강퇴하기]  [저장]
```

### 그룹 정보 수정 (G-6) — 인라인 편집
```
그룹 이름 [ 우리집 가계부     ]
[취소] [저장]
```

### 권한 체계
| 액션 | owner | member |
|------|-------|--------|
| 멤버 초대 링크 생성 | ✅ | ❌ |
| 멤버 강퇴 | ✅ | ❌ |
| 권한 변경 | ✅ | ❌ |
| 그룹 이름 수정 | ✅ | ❌ |
| 영수증 등록/조회 | ✅ | ✅ |
| 그룹 탈퇴 | ✅(위임 후) | ✅ |

## 완료 조건
- [ ] 그룹 관리 페이지 접근 (G-4)
- [ ] owner만 멤버 메뉴([⋮]) 표시
- [ ] 멤버 → 오너 권한 변경 동작
- [ ] 오너가 1명일 때 본인 강등 불가 오류 처리
- [ ] 그룹 이름 인라인 수정
- [ ] 멤버 강퇴 확인 다이얼로그 후 목록 갱신
- [ ] 그룹 탈퇴 (오너 위임 조건 검증)

## 참조 파일
- `docs/tasks/TASK-03-group.md` — 기존 그룹 DB·API 구조
- `docs/tasks/TASK-11-user-profile.md` — avatar_url, display_name 활용

## 다음 태스크
→ TASK-13-scope-selector.md

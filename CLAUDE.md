# CLAUDE.md — 우리집 가계부

## 프로젝트 개요
부부 2인용 스마트 가계부 웹앱.
영수증 AI 분석, 상품 가격 비교, 주간 예산 관리, 그룹 공유 기능 제공.

## 기술 스택
- **Frontend/API**: Next.js 14 (App Router) + TypeScript + Tailwind CSS → Vercel
- **DB/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini 1.5 Flash API (서버 사이드 전용)
- **스케줄러**: Supabase pg_cron + Edge Functions
- **i18n**: next-intl (한국어/일본어)
- **폼**: react-hook-form + zod

## 절대 규칙
- `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 는 API Routes 서버 사이드에서만 사용. 클라이언트 노출 금지.
- 모든 DB 쿼리는 RLS 정책 통과 전제. 직접 service role로 우회 금지.
- 상품명·매장명 등 고유명사는 번역하지 않고 일본어 원문 그대로 저장/표시.
- 금액은 JPY 정수(엔)로 저장. 소수점 없음.
- 컴포넌트에서 `console.log` 제거 후 커밋.

## 디렉토리 구조
```
src/
  app/[locale]/
    (auth)/         # 로그인·회원가입 레이아웃
    (main)/         # 메인 앱 레이아웃
  app/api/          # API Routes (서버 전용)
  components/
    ui/             # 공통 UI (Button, Card, Input 등)
    features/       # 기능별 컴포넌트
  lib/
    supabase/       # client.ts · server.ts · middleware.ts
    gemini/         # API 호출 유틸
    utils/          # 공통 유틸
  types/
    database.ts     # Supabase 자동 생성 타입
    domain.ts       # 도메인 모델 타입
  messages/
    ko.json         # 한국어 UI 텍스트
    ja.json         # 일본어 UI 텍스트
docs/
  tasks/            # TASK-01 ~ TASK-10 (작업 상세)
  screens/          # HTML 프로토타입 (디자인 참조)
```

## 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## UI 디자인 시스템
Light Pastel Liquid Glass 스타일. 참조: `docs/screens/*.html`
- 배경: 밝은 파스텔 그라디언트 블롭 (흰색 계열)
- 카드: `rgba(255,255,255,0.52)` + `backdrop-filter: blur(40px) saturate(180%)`
- 카드 테두리: `rgba(255,255,255,0.85)`
- 버튼: 인디고/퍼플 그라디언트 `rgba(139,92,246,0.85) → rgba(99,102,241,0.85)`
- 기본 폰트: Noto Sans KR
- 텍스트: primary `rgba(40,40,55,0.88)` · secondary `rgba(80,80,110,0.58)`

## i18n 규칙
- UI 고정 텍스트만 `ko.json` / `ja.json` 키로 관리
- 상품명·매장명·태그 등 DB에서 오는 텍스트는 번역 대상 아님
- 언어 전환: `users.lang` 업데이트 + next-intl locale 쿠키 변경

## 작업 방식
1. 작업 시작 전 해당 `docs/tasks/TASK-XX-*.md` 를 반드시 읽는다.
2. DB 마이그레이션 → API Routes → UI 순서로 구현 (수직 슬라이싱).
3. 각 태스크 완료 조건(Acceptance Criteria) 체크 후 다음 태스크 진행.
4. 컴포넌트는 `features/` 안에 기능별 폴더로 구성.

## 참조 문서 맵
| 필요 정보 | 파일 |
|---|---|
| 기능 상세·DB 스키마·API 스펙 | `docs/tasks/TASK-XX-*.md` |
| 화면 레이아웃·UI 컴포넌트 | `docs/screens/XXX_LIGHT.html` |
| 전체 기능 목록·화면 목록 | PRD (우리집가계부_PRD_v1.0.docx) |

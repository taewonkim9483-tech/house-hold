# TASK-01 — 프로젝트 초기 세팅

## 목표
Next.js 프로젝트 생성 및 공통 인프라 구성.
이후 모든 태스크의 기반이 되는 레이어.

## 작업 내용

### 1. 프로젝트 생성
```bash
npx create-next-app@latest kakeibo \
  --typescript --tailwind --eslint --app --src-dir
```

### 2. 패키지 설치
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# i18n
npm install next-intl

# UI 유틸
npm install clsx tailwind-merge lucide-react

# 폼
npm install react-hook-form zod @hookform/resolvers
```

### 3. 디렉토리 구조
```
src/
  app/
    [locale]/          # next-intl 라우팅
      (auth)/          # 로그인/회원가입 (레이아웃 분리)
      (main)/          # 메인 앱
    api/               # API Routes
  components/
    ui/                # 공통 UI 컴포넌트
    features/          # 기능별 컴포넌트
  lib/
    supabase/          # Supabase 클라이언트
    gemini/            # Gemini API 유틸
    utils/             # 공통 유틸
  types/               # TypeScript 타입 정의
  messages/            # i18n 메시지
    ko.json
    ja.json
docs/
  tasks/               # 태스크 파일
  screens/             # 화면 프로토타입 참조
```

### 4. 환경변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # API Routes 전용 (클라이언트 미노출)
GEMINI_API_KEY=                 # API Routes 전용 (클라이언트 미노출)
```

### 5. Supabase 초기 설정
- 프로젝트 생성
- Auth 설정 (이메일 인증 활성화)
- Storage 버킷 생성: `receipts`, `products`
- RLS 기본 정책 설정

### 6. next-intl 설정
- `middleware.ts` 라우팅 설정
- `ko.json` / `ja.json` 기본 키 구조 작성
- 고유명사(상품명·매장명)는 번역 대상 제외

### 7. 공통 Supabase 클라이언트
```
lib/supabase/client.ts     # 브라우저용
lib/supabase/server.ts     # Server Component용
lib/supabase/middleware.ts # 미들웨어용
```

### 8. 공통 타입 정의
```
types/database.ts   # DB 테이블 타입 (Supabase CLI generate)
types/domain.ts     # 도메인 모델 타입
```

## 완료 조건 (Acceptance Criteria)
- [ ] `npm run dev` 정상 실행
- [ ] `/ko`, `/ja` 라우팅 동작 확인
- [ ] Supabase 연결 확인 (ping)
- [ ] 환경변수 로드 확인
- [ ] Storage 버킷 2개 생성 확인
- [ ] ESLint / TypeScript 오류 없음

## 참조 파일
- `docs/CLAUDE.md` — 프로젝트 전체 개요
- PRD Section 2 — 기술 스택 & 아키텍처

## 다음 태스크
→ TASK-02-auth.md

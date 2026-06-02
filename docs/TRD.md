# TRD.md

## 1. 기술 목표

- 6월 19일 시연 가능한 MVP를 안정적으로 운영한다.
- 공공 API 5종 이상 호출이 화면에 시각화된다.
- 추천 결과는 외부 API 장애에도 fallback으로 서비스된다.
- 회복의 숲 feature 폴더 하나만으로 Evidence Base 본 프로젝트에 통합 가능하다.
- AI 출력은 항상 JSON 스키마 검증을 거친다.

## 2. 전체 아키텍처

```text
User (모바일/데스크탑)
  ↓
Vercel — React Router 7 (recovery-forest.evidence-base.ai)
  ↓
React Router server action (입력 검증 + sessionId 발급)
  ↓
n8n Webhook (자체 호스트, n8n.evidence-base.ai)
  ├─ Supabase: forest_places 후보 조회
  ├─ HTTP: 기상청 단기예보 API
  ├─ HTTP: 에어코리아 실시간 미세먼지 API
  ├─ HTTP: 산림청 치유의숲 API
  ├─ HTTP: 산림청 둘레길 API
  ├─ HTTP: 도시숲/자연휴양림 API
  ├─ Code: 5축 점수 계산 (공기/기상/숲/운동/접근성)
  ├─ OpenAI: 추천 이유 + 주의사항 (JSON 강제)
  └─ Supabase: recommendation_sessions 저장
  ↓
JSON 응답 (TOP 5)
  ↓
결과 페이지 (Vercel SSR + 카드 UI)
```

## 3. 프론트엔드

### Stack

- React Router 7 (file-based routing, loader/action)
- TypeScript
- Tailwind CSS v4
- shadcn/ui + Radix
- recharts (5축 레이더 차트)
- lucide-react (아이콘)
- sonner (toast)
- react-i18next (한국어 우선)

### 배포

- Vercel
- 도메인: `recovery-forest.evidence-base.ai`
  - Cloudflare DNS에서 CNAME → cname.vercel-dns.com
  - Vercel 프로젝트 Settings → Domains에 추가
- Preview 환경: `*.vercel.app` 자동 배포

### 페이지 구조 (4페이지 + about)

| 경로 | 컴포넌트 | 목적 |
|---|---|---|
| `/` | landing-page.tsx | 서비스 소개 + CTA |
| `/recommend` | input-page.tsx | 5개 입력 폼 |
| `/recommend/results/:sessionId` | results-page.tsx | TOP 5 카드 |
| `/forests/:forestId` | forest-detail-page.tsx | 숲 상세 + 프로그램 |
| `/about` (선택) | about-page.tsx | 출품팀/데이터 출처 |

### 디렉토리 격리 원칙

회복의 숲 모든 코드는 `app/features/recovery-forest/` 안에 가둔다. Evidence Base 통합 시 이 폴더 하나만 복사하면 동작하도록 한다. 공유 의존은 다음만 허용:

- `app/lib/` (Supabase 클라이언트, env, 공통 유틸)
- `app/core/` (layout, root)
- shadcn/ui 글로벌 컴포넌트 (`app/components/ui/`)

## 4. Backend Boundary

React Router server action / loader가 모든 외부 호출의 진입점.

원칙:
- API 키는 server-only (`app/lib/env.server.ts`)
- 클라이언트는 n8n webhook URL 직접 호출 금지
- server action에서 입력 검증 + sessionId 발급 후 n8n 호출
- n8n 응답은 Supabase에 영속 후 결과 페이지는 DB에서 읽음

## 5. Supabase

### 주요 테이블

- `forest_places` — 치유의숲·자연휴양림·도시숲·둘레길 통합 카탈로그
- `healing_programs` — 산림치유 프로그램
- `recommendation_sessions` — 익명 sessionId 기반 추천 이력
- `recommendation_feedback` — 결과 평점/코멘트 (선택)
- `external_api_logs` — 디버깅/모니터링용 API 호출 로그

### RLS

- `forest_places`, `healing_programs`: anon read
- `recommendation_sessions`: anon insert + sessionId 기반 read
- `external_api_logs`: service role only

### 마이그레이션

- 위치: `sql/recovery-forest/`
- Drizzle ORM + drizzle-kit으로 관리
- `npm run db:typegen`으로 `database.types.ts` 재생성

## 6. n8n 워크플로우

### 엔드포인트

- `POST https://n8n.evidence-base.ai/webhook/recovery-forest/recommend`

### 입력 페이로드

```json
{
  "session_id": "uuid-v4",
  "user_region": "서울 강북구",
  "user_lat": 37.62,
  "user_lng": 127.04,
  "user_priorities": ["air", "stress", "accessibility"],
  "user_fitness_level": "low",
  "user_travel_time_min": 60,
  "user_preferred_activity": "walking",
  "requested_at": "2026-05-20T10:00:00+09:00"
}
```

### 노드 흐름

1. Webhook Trigger
2. 입력 검증 (n8n Code node + Zod-like JSON validation)
3. Supabase: 후보 숲 조회 (사용자 위치 반경 + travel_time)
4. HTTP: 기상청 단기예보
5. HTTP: 에어코리아
6. HTTP: 산림청 치유의숲
7. HTTP: 산림청 둘레길
8. HTTP: 도시숲/자연휴양림
9. Code: 5축 점수 계산 + 우선순위 가중치
10. OpenAI: 추천 이유/주의사항 (JSON Mode)
11. Code: 응답 검증 (스키마 위반 시 fallback 텍스트)
12. Supabase: recommendation_sessions 업데이트
13. Respond to Webhook

### 워크플로우 코드 관리

- `infra/n8n/recovery-forest.workflow.json`로 export하여 git 추적
- 변경 시 PR로 검토

## 7. AI Provider 추상화

LLM 호출은 n8n OpenAI 노드를 1차로 사용하되, 나중에 교체 가능하도록 다음 원칙을 둔다:

- 프롬프트는 `app/features/recovery-forest/prompts/`에 markdown으로 관리
- prompt_version을 응답 메타데이터에 기록
- JSON 응답 스키마는 Zod로 정의 (`schemas/recommendation.schema.ts`)
- 응답이 스키마 위반 시 fallback 사용

## 8. 보안

- API 키와 service role key는 서버 전용
- 클라이언트 로그에 좌표 외 민감 정보 출력 금지
- session_id는 익명이지만 URL에 노출되므로 보안 토큰 아님 (재현 가능, 민감 데이터 저장 금지)
- 추천(recommendation) 흐름: 의료 정보 입력 금지 (체력 수준 외 건강 상태 직접 입력 받지 않음)
- Evidence Engine 여정(journey) 흐름: **명시적 동의(consent) 화면을 거친 후에만** 자가보고 웰니스(수면·피로·기분·스트레스 1-10, 항암 후 경과개월)를 수집한다. 이는 의료 진단이 아니라 주관적 자가보고임을 동의 화면에 고지한다. 진단·치료 효과 단정 등 **의료 표현 금지 원칙은 출력(처방·리포트)에서 계속 강제**한다.
- journey_token은 매직링크 capability로, session_id와 동일하게 보안 토큰이 아니다. 민감 식별정보(실명·연락처 등)는 저장하지 않으며 이메일은 리포트 발송 용도로만 보관한다.

## 9. AI 출력 메타데이터

`recommendation_sessions`에 다음 필드 기록:

- `llm_model` (예: gpt-4o-mini)
- `llm_prompt_version` (예: recommendation-reason-v1)
- `weather_snapshot`, `air_quality_snapshot`
- `results` (TOP 5 전체)
- `status` (pending / completed / failed)
- `last_error`

## 10. 오류 처리

- 외부 API 실패: `external_api_logs`에 기록, 해당 점수 축은 baseline 사용
- n8n 전체 실패: `recommendation_sessions.status = 'failed'`, 사용자에게 재시도 안내
- LLM 응답 파싱 실패: fallback 텍스트 ("오늘 날씨 데이터를 기반으로 추천된 장소입니다.")

## 11. 테스트 구조

- Unit: 입력 검증, 점수 정규화, 응답 파싱
- Integration: server action → n8n mock → 결과 페이지
- E2E: Playwright로 랜딩 → 입력 → 결과 카드까지

도구: Vitest + React Testing Library + Playwright

## 12. 배포 환경

| 구분 | 사용 |
|---|---|
| Web | Vercel |
| DB/Auth | Supabase |
| Automation | n8n (자체 호스트) |
| LLM | OpenAI (n8n에서 호출) |
| DNS | Cloudflare |
| 모니터링 | Sentry (옵션) |

## 13. 성능 기준

- 랜딩 페이지 첫 페인트 1.5초 이내
- 추천 결과 응답 평균 2초 (n8n 캐싱 활용)
- 동일 region+priorities+date 조합은 1시간 TTL 캐시
- 모바일 Lighthouse Performance 80점 이상 목표

## 14. 통합 전략 (Evidence Base)

대회 후 Evidence Base 본 프로젝트로 이식할 때:

1. `app/features/recovery-forest/` 폴더 그대로 복사
2. `sql/recovery-forest/` SQL 마이그레이션을 Evidence Base의 Supabase에 적용
3. `app/routes.ts`에 recovery-forest 라우트 추가
4. `app/lib/env.server.ts`에 신규 환경변수 추가
5. 네비게이션에 "회복의 숲" 메뉴 추가
6. 로그인 사용자에게 "내 추천 저장" 기능 활성화

이 절차가 가능하도록 회복의 숲 코드는 다른 feature에 의존하지 않는다.

## 15. 변경 원칙

새 기술 도입 전 질문:

1. 6월 19일 마감에 도움이 되는가?
2. 시연 시 외부 API 장애에도 살아남는가?
3. 1인 운영자가 감당 가능한가?
4. Evidence Base 통합 시 충돌하지 않는가?
5. 평가위원에게 보여줄 수 있는 변경인가?

답이 "아니오"면 보류.

# REQUIREMENTS.md

이 문서는 Claude Code와 개발자가 회복의 숲을 구현할 때 따라야 할 세부 규칙이다.

## 1. 공통 구현 규칙

- TypeScript 타입을 명확히 작성한다 (`any` 금지, `unknown` 사용 시 narrowing 필수).
- 외부 API 응답은 Zod 스키마로 검증한 후 사용한다.
- 민감 키(API key, service role)는 절대 클라이언트 번들에 포함하지 않는다.
- 함수는 한 가지 일을 하게 만든다.
- 비즈니스 로직은 UI 컴포넌트 안에 넣지 않는다.
- AI 출력은 반드시 파싱/검증 단계를 거친다.
- 의료적 단정 표현(치료, 효능, 진단)을 user-facing 텍스트에 넣지 않는다.

## 2. 기능 개발 절차

새 기능은 다음 순서로 진행한다.

1. 기능 SPEC 확인 (`docs/specs/`)
2. 수용 기준 작성
3. 테스트 케이스 작성 (Vitest)
4. 실패 테스트 확인
5. 최소 구현
6. 테스트 통과 확인
7. 리팩터링
8. 문서 업데이트
9. 변경 요약 작성

## 3. Definition of Ready

개발 시작 전 아래가 준비되어야 한다.

- 사용자 문제
- 입력 데이터
- 출력 결과
- 수용 기준
- 오류/빈 상태 처리
- 데이터 출처 (어떤 공공 API에서 오는가)
- 테스트 계획

## 4. Definition of Done

완료 조건:

- 수용 기준 충족
- 관련 테스트 통과
- `npm run typecheck` 통과
- prettier 통과
- 모바일 UI 확인 (Chrome devtools 모바일 모드)
- 빈 상태/로딩/오류 상태 처리
- 의료/법적 위험 표현 없음
- 민감 정보 로그 없음
- 관련 문서 업데이트

## 5. Frontend 규칙

### 컴포넌트

- 하나의 컴포넌트가 너무 많은 책임을 갖지 않게 한다.
- 비즈니스 로직은 hooks 또는 service로 분리한다.
- shadcn/ui를 기본 컴포넌트로 사용한다.
- Tailwind class가 지나치게 길면 하위 컴포넌트로 분리한다.

### UI 상태

추천 결과 등 외부 API 의존 화면은 다음 상태를 모두 처리한다.

- loading (스켈레톤)
- empty (해당 조건에 맞는 숲이 없을 때)
- error (외부 API 실패)
- success
- partial-success (일부 API 실패 시 baseline 점수 표시)

회원가입이 없는 MVP에서는 `unauthorized` 상태 제외.

### 사용자 친화성 (회복기 중장년 기준)

- 본문 기본 폰트 16px 이상
- 버튼 터치 영역 44x44 이상
- 핵심 CTA는 화면당 하나
- 경고 문구는 차갑지 않게 ("미세먼지가 다소 있어요" 형태)
- 전문 용어 옆에 쉬운 설명 (예: "피톤치드(나무가 내뿜는 천연 항균 물질)")

### 차트/시각화

- 5축 레이더 차트는 recharts 사용
- 색상은 색맹 친화적 (적/녹 단독 구분 금지)
- 텍스트 라벨 항상 병기

## 6. Backend/API 규칙

- API 응답 형식은 일관되게 유지한다.
- DB 에러를 사용자에게 그대로 노출하지 않는다.
- validation을 서버에서 수행한다 (Zod).
- service role key는 server-only.

권장 응답 형식:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;        // user-facing
    detail?: unknown;       // 개발자용, 프로덕션에서는 응답 제외
  };
};
```

에러 코드 규칙:

- `VALIDATION_FAILED` — 사용자 입력 오류
- `EXTERNAL_API_FAILED` — 공공 API 호출 실패
- `LLM_PARSE_FAILED` — AI 응답 파싱 실패
- `SESSION_NOT_FOUND` — 추천 세션 미존재
- `WEBHOOK_TIMEOUT` — n8n 응답 지연

## 7. Supabase 규칙

- RLS 정책을 전제로 작성한다.
- session_id는 클라이언트 입력을 그대로 신뢰하지 않는다 (서버에서 발급).
- upsert 사용 시 conflict key를 명확히 한다.
- migration은 `sql/recovery-forest/` 하위에 시간순 번호로 관리.
- 모든 테이블은 `created_at`, 변경 가능한 테이블은 `updated_at`을 둔다.
- AI 생성 결과는 `llm_model`, `llm_prompt_version`을 함께 저장.

## 8. AI 출력 규칙

추천 이유/주의사항 생성 로직은 다음 단계를 분리한다.

1. input validation (Zod)
2. context 선택 (후보 숲 + 현재 기상/대기 데이터)
3. prompt building (prompt_version 명시)
4. LLM generation (JSON Mode 강제)
5. JSON parsing
6. safety validation (금지어 필터)
7. fallback (파싱/안전 실패 시)
8. persistence (`recommendation_sessions.results`)

### 추천 카드에 반드시 포함

- 숲 이름과 종류
- 회복점수(총점) + 5축 sub-score
- 추천 이유 (왜 이 사용자에게 이 숲이 좋은가)
- 주의사항 (날씨/체력 관련)
- 추천 활동 (구체적, 시간 포함)
- 데이터 출처 표시

### 금지 표현

- 치료, 치유, 효능 단정 ("○○에 효과적", "○○이 낫는다" 등)
- 항암치료 대체 암시
- "안전합니다", "괜찮습니다" 단정
- 보조제·약품 추천
- 의학적 진단 (혈압/혈당 해석 등)
- 응급 의료 안내 (119 안내 외)

### 권장 표현

- "○○에 도움이 될 수 있는 환경입니다"
- "산림청 데이터 기준 ○○ 수치가 높은 곳입니다"
- "오늘 기상 조건에서 추천된 곳입니다"
- "전문의 상담을 함께 받으시면 좋습니다" (필요 시)

## 9. n8n 워크플로우 규칙

- 각 workflow는 입력/출력 JSON 스키마를 README에 문서화한다.
- 실패 시 `recommendation_sessions.status = 'failed'`, `last_error` 기록.
- AI node 출력은 다음 Code node에서 JSON 파싱 + 스키마 검증.
- 파싱 실패 fallback 노드를 둔다.
- 중복 실행 방지: session_id를 idempotency key로 사용.
- workflow는 `infra/n8n/recovery-forest.workflow.json`로 git 추적.

## 10. 외부 공공 API 규칙

- 모든 호출은 `external_api_logs`에 기록 (provider, endpoint, latency, status).
- rate limit 대비 추천 결과는 region+priorities+date(YYYY-MM-DD) 키로 1시간 TTL 캐시.
- 키가 누락되면 빌드 시점에 실패 (env validation).
- 응답 형식이 XML이면 즉시 JSON 변환 후 검증.

### MVP에서 호출할 API (5종 이상)

1. 기상청 단기예보 (VilageFcstInfoService_2.0)
2. 에어코리아 실시간 미세먼지 (ArpltnInforInqireSvc)
3. 산림청 치유의숲 정보
4. 산림청 둘레길 정보
5. 산림청 자연휴양림 또는 도시숲 정보
6. (선택) 공공데이터포털 추가 API

## 11. 보안/개인정보

- 사용자 직접 식별 정보를 수집하지 않는다 (이름·연락처·생년월일 입력 없음).
- 위치는 시·군 수준으로만 수집 (정확한 GPS 좌표 저장 금지, 서버에서만 사용 후 즉시 폐기).
- session_id는 익명이며 추적 목적 아님.
- 의료 데이터 입력 금지 (체력 수준만 사용).
- 모든 키는 환경변수, repo에 커밋 금지.

## 12. 금지 구현

절대 하지 않는다.

- 임시 하드코딩으로 의료 정보 처리
- 테스트 없이 추천 엔진 로직 수정
- API 키를 클라이언트 번들에 포함
- LLM 응답을 검증 없이 표시
- 사용자 좌표를 영구 저장
- 한 번에 거대한 기능 구현 (SPEC 단위로 쪼개기)
- "나중에 정리"라는 이유로 구조를 망가뜨리기

## 13. 의존성 추가 규칙

새 npm 패키지 추가 전 질문:

1. shadcn/ui 또는 표준 라이브러리로 해결 가능한가?
2. 번들 크기는 얼마인가? (bundlephobia 확인)
3. 마지막 업데이트가 1년 이내인가?
4. TypeScript 타입을 제공하는가?
5. 라이선스가 MIT/Apache 2.0인가?

답 중 2개 이상이 "아니오"면 보류.

## 14. 통합 호환성

회복의 숲 feature는 Evidence Base 본 프로젝트에 통합 가능해야 한다. 따라서:

- 회복의 숲 폴더 외부 코드를 수정하지 않는다 (`app/lib/`, `app/core/` 제외).
- Supabase 스키마는 `forest_*`, `recommendation_*` 등 명확한 prefix 사용.
- 통합 시 기존 Evidence Base 테이블과 이름 충돌 없는지 확인.
- 환경변수는 `RECOVERY_` 또는 명확한 prefix 사용 (예: `KMA_API_KEY`).

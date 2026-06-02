# TESTING.md

## 1. 테스트 철학

목적은 100% 커버리지가 아니다. 회복의 숲 시연이 안정적으로 동작하고, AI 출력과 외부 API 의존이 위험한 오류를 일으키지 않게 하는 것이다.

우선순위:

1. 입력 검증 (Zod)
2. n8n 응답 파싱과 안전성
3. 점수 정규화 / 5축 계산
4. 추천 흐름 E2E (랜딩 → 입력 → 결과)
5. UI 상태 (loading/empty/error)

## 2. TDD 기본 루프

모든 중요한 기능은 아래 순서를 따른다.

```text
Red: 실패하는 테스트 작성
Green: 테스트를 통과하는 최소 구현
Refactor: 구조 개선
```

Claude Code 지시 예시:

```text
이 기능은 TDD로 진행해.
먼저 실패 테스트를 작성하고, 왜 실패하는지 보여준 뒤,
최소 구현으로 통과시켜.
그 다음 리팩터링하고 변경 요약을 작성해.
```

## 3. 테스트 도구

- Vitest — 단위/통합 (Node + happy-dom 환경)
- React Testing Library — 컴포넌트 렌더링
- Playwright — E2E (기존 `playwright.config.ts` 재활용)
- `vi.mock` — 외부 fetch/n8n 클라이언트 mock

`vitest.config.ts`는 `vite-tsconfig-paths` plugin과 함께 사용.

## 4. 테스트 범위

### Unit Test

대상:

- `schemas/input.schema.ts` validation
- `schemas/recommendation.schema.ts` parsing
- `services/score-formatter.ts` 정규화
- `services/n8n-client.ts` (mocked fetch)
- 추천 카드 컴포넌트 렌더링
- 입력 폼 컴포넌트 동작

### Integration Test

대상:

- server action `/api/recommend` (입력 검증 + webhook 호출 mock + sessionId 반환)
- `recommendation.repository.ts` (Supabase mock)
- 결과 페이지 loader (sessionId → DB 읽기)

### E2E Test (Playwright)

대상:

- 랜딩 → "오늘의 추천 받기" 클릭 → 입력 폼 표시
- 입력 폼 채우기 → 결과 페이지 도달
- 결과 카드 1개 클릭 → 숲 상세 페이지 진입
- 외부 API 실패 시 fallback UI 표시

E2E는 많지 않아도 된다. **시연용 핵심 흐름만**.

## 5. AI 출력 테스트

LLM 응답은 mock으로 처리한다 (실제 OpenAI 호출 테스트 금지).

- valid JSON response parsing → 결과 카드 데이터 정상 생성
- invalid JSON fallback → 기본 텍스트 표시
- missing field fallback → 누락된 필드는 baseline으로 대체
- 금지 표현 감지 → safety filter가 fallback 텍스트로 대체
- empty 후보 → "조건에 맞는 숲을 찾지 못했어요" empty state

## 6. 외부 API 테스트

실제 호출은 테스트에서 금지. 다음을 mock한다.

- 기상청 API 응답 (정상 JSON / 4xx / 5xx / 타임아웃)
- 에어코리아 응답 (정상 / 측정소 없음)
- 산림청 API 응답 (XML → JSON 변환 포함)

테스트 fixture는 `app/features/recovery-forest/__tests__/fixtures/`에 둔다.

## 7. 테스트 데이터 원칙

- 실제 사용자 데이터를 테스트에 쓰지 않는다.
- 좌표/지역은 공개된 지명 사용 (예: 서울 강북구).
- 민감한 의료 정보는 테스트에도 포함하지 않는다.
- snapshot test는 과도하게 쓰지 않는다 (실제 동작 기반 테스트 선호).

## 8. 수용 기준 예시

기능: 추천 요청 생성

수용 기준:

- 익명 사용자가 필수 입력(지역·우선순위·체력·시간)을 채우면 `recommendation_sessions` row가 생성된다.
- `status`는 `pending`으로 시작한다.
- session_id는 서버에서 생성된 UUID v4이다.
- 필수 입력이 없으면 400과 `VALIDATION_FAILED` 코드가 반환된다.
- n8n webhook 호출 실패 시 `status = 'failed'`, `last_error` 기록.
- 테스트는 성공/검증실패/webhook실패 케이스를 포함한다.

## 9. 테스트 명명 규칙

```text
should_create_session_when_input_valid
should_reject_when_priorities_empty
should_fallback_when_llm_returns_invalid_json
should_show_partial_results_when_weather_api_fails
should_redirect_to_results_after_recommendation
should_render_top_5_cards_with_scores
```

## 10. Claude Code 테스트 지시문

자주 사용할 지시:

```text
이 변경은 테스트 우선으로 진행해.
먼저 관련 테스트 파일을 찾고, 없으면 가장 작은 테스트 파일을 만들어.
실패 테스트를 작성한 뒤 구현해.
구현 후 `npm run test`를 실행하고 결과를 요약해.
```

```text
이 기능의 회귀 위험이 큰 부분 3개를 테스트로 고정해.
테스트하기 어렵다면 구조부터 분리해.
```

```text
LLM 응답은 mock으로 처리하고,
파싱/검증/저장 로직만 테스트해.
실제 OpenAI API 호출 테스트는 만들지 마.
```

## 11. 시연 전 체크리스트

대회 시연(2026-06-19) 전 다음을 모두 확인.

- [ ] `npm run typecheck` 통과
- [ ] `npm run test` 통과
- [ ] `npx playwright test` 통과
- [ ] 모바일 Chrome devtools에서 랜딩→결과 흐름 검증
- [ ] 모든 외부 API 키가 production env에 설정
- [ ] n8n 워크플로우 active 상태
- [ ] Supabase `forest_places` 시드 데이터 100건 이상
- [ ] 5개 이상 우선순위 조합이 모두 다른 결과를 만드는지 검증
- [ ] 외부 API 1개를 일부러 끊었을 때 fallback이 동작하는지 검증
- [ ] 발표용 시나리오 3가지 데모 케이스 사전 캡처 (백업)

## 12. 모니터링

- Sentry로 production 에러 수집 (옵션)
- `external_api_logs` 일일 확인 → 가장 자주 실패하는 API 식별
- `recommendation_sessions.status='failed'` 비율 추적

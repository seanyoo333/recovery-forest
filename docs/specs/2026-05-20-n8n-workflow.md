# SPEC: n8n 워크플로우 (recovery-forest.workflow.json)

## 1. 기능명

회복의 숲 추천 n8n Webhook 워크플로우

## 2. 배경

추천 엔진의 실제 오케스트레이션은 n8n에서 처리한다. server action은 검증과 호출만, 외부 API 5종 + LLM + DB 저장은 n8n 노드 트리에서 처리한다.

## 3. 대상 사용자

- 직접 사용자 없음 (백엔드 시스템)
- 호출자: React Router server action

## 4. 사용자 문제

- 코드에 외부 API 호출이 많아지면 변경이 어렵다.
- API 호출 시각화 / 디버깅 화면이 필요하다.
- 한 호출에서 5개 외부 API + LLM 처리가 직렬화되면 느리다.

## 5. 목표

- n8n에서 외부 API를 병렬 호출
- 워크플로우는 git으로 관리 (`infra/n8n/recovery-forest.workflow.json`)
- 각 노드 실패 시 fallback 또는 baseline 사용

## 6. 범위

### 포함

- Webhook Trigger
- 입력 검증 Code node
- Supabase 후보 숲 조회 node
- HTTP Request 노드 5개 (KMA, AirKorea, Forest 치유의숲, 둘레길, 자연휴양림/도시숲)
- Code node: 5축 점수 계산
- OpenAI Chat node: 추천 이유/주의사항 생성 (JSON Mode)
- Code node: 응답 검증
- Supabase 업데이트 node
- Respond to Webhook
- 실패 노드: external_api_logs 기록 + fallback

### 제외

- 사용자 인증 (server action에서 처리)
- UI 렌더링
- 결제

## 7. 흐름

```text
Webhook
  ↓
Validate Input (Code)
  ├─ invalid → Respond 400
  ↓
Query Forest Candidates (Supabase, region + travel_time)
  ↓
Split into per-forest parallel branches
  ↓ (병렬)
  ├─ Fetch Weather (KMA)
  ├─ Fetch Air Quality (AirKorea)
  ├─ Fetch Forest Info (Forest Service)
  ├─ Fetch Trail Info (Forest Service)
  └─ Fetch Urban/Recreation (Forest Service)
  ↓
Merge results per forest
  ↓
Calculate 5-axis scores (Code)
  ↓
Apply user priority weights (Code)
  ↓
Sort + take top 5
  ↓
Build LLM prompt with top 5 context
  ↓
OpenAI Chat (JSON Mode, model=gpt-4o-mini)
  ↓
Parse + Validate JSON (Code)
  ├─ invalid → fallback text
  ↓
Safety Filter (Code, 금지 표현 검출)
  ↓
Update Supabase recommendation_sessions (status=completed)
  ↓
Respond to Webhook
```

## 8. 입력 데이터

```json
{
  "session_id": "uuid",
  "user_region": "서울 강북구",
  "user_lat": 37.62,
  "user_lng": 127.04,
  "user_priorities": ["air", "stress"],
  "user_fitness_level": "low",
  "user_travel_time_min": 60,
  "user_preferred_activity": "walking",
  "requested_at": "ISO8601"
}
```

## 9. 출력/화면 결과

위 응답 페이로드 (recommendation-engine SPEC 참조)

## 10. 수용 기준

- [ ] 모든 외부 API 호출이 external_api_logs에 기록
- [ ] 외부 API 1개 실패 시 해당 점수 축은 baseline 사용 + status='completed'
- [ ] 외부 API 전체 실패 시 status='failed'
- [ ] LLM 응답 JSON 스키마 위반 → fallback 텍스트
- [ ] 금지 표현 감지 → fallback 텍스트
- [ ] 평균 응답 2초 이내
- [ ] session_id 중복 호출 시 idempotent (동일 session_id는 첫 결과 재사용)

## 11. 오류/빈 상태

- 후보 0개: results=[] + status='completed' + ai_summary="조건에 맞는 숲을 찾지 못했어요"
- API 전체 실패: status='failed', last_error 기록
- LLM 타임아웃 (10초): fallback 텍스트로 진행

## 12. 보안/권한

- Webhook에 `N8N_WEBHOOK_SECRET` 헤더 검증
- Supabase service role key는 n8n credential
- OpenAI/KMA/AirKorea/Forest 키는 n8n credential
- 사용자 좌표는 로그에 저장하지 않음

## 13. 의료/법적 안전 기준

- OpenAI 프롬프트에 안전 가이드라인 포함:
  - "치료" "효능 단정" 표현 금지
  - 의료 진단 금지
  - 항암치료 대체 암시 금지
- 응답 후 안전 필터 노드로 한 번 더 검증
- 금지 표현 감지 시 fallback 텍스트

## 14. 테스트 계획

### Unit

- 점수 계산 함수 (별도 TS 모듈로 추출하여 vitest로 테스트)
- 안전 필터 함수

### Integration

- 워크플로우 수동 실행 (n8n UI)
- 각 노드 mock 데이터로 테스트
- 응답 JSON이 recommendation.schema 통과

### E2E

- server action → 실제 n8n staging webhook → 결과 검증

## 15. 완료 후 문서 업데이트

- [ ] PRD 업데이트 필요 없음
- [ ] TRD 업데이트 필요 없음
- [ ] REQUIREMENTS 업데이트 필요 없음
- [ ] TESTING 업데이트 필요 없음

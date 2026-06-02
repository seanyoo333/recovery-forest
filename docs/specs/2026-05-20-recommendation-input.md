# SPEC: 추천 입력 폼

## 1. 기능명

회복 숲 추천 입력 폼 (`/recommend`)

## 2. 배경

사용자가 자신의 상태와 선호를 입력해야 추천이 가능하다. 5가지 차원 입력을 모바일 친화적으로 받아야 한다.

## 3. 대상 사용자

- Primary: 회복기 중장년
- Secondary: 직장인, 가족 단위 방문자

## 4. 사용자 문제

- 길고 복잡한 폼은 이탈을 부른다.
- 의료 정보 입력은 부담스럽다.
- 모바일에서 선택지가 작으면 잘못 누른다.

## 5. 목표

- 30초 안에 입력 완료 가능
- 의료 정보 직접 입력 금지 (체력 수준만)
- 다음 단계 진행 조건 명확

## 6. 범위

### 포함

1. **지역 선택** — 시·도 → 시·군 드롭다운 (또는 현재 위치 사용)
2. **건강 관심 우선순위** — 다중 선택 (최소 1, 최대 3): 공기 / 스트레스 / 접근성 / 면역력 / 휴식 / 편리성 / 운동
3. **체력 수준** — 라디오 3택: 낮음 / 보통 / 높음
4. **이동 가능 시간** — 라디오 3택: 30분 / 1시간 / 2시간 이상
5. **선호 활동** — 라디오 4택: 산책 / 명상 / 체험프로그램 / 자유
6. **추천 받기** 버튼

### 제외

- 회원가입
- 의료 정보 직접 입력 (질병명, 약물 등)
- 정확한 GPS 좌표 저장
- 이메일/전화 수집

## 7. 사용자 흐름

```text
1. `/recommend` 진입
2. 지역 선택 (시·도 → 시·군)
3. 우선순위 1~3개 선택
4. 체력 수준 선택
5. 이동 시간 선택
6. 선호 활동 선택
7. "추천 받기" 버튼 클릭
8. server action 호출 → sessionId 발급 → `/recommend/results/:sessionId` 이동
```

## 8. 입력 데이터

| 필드 | 타입 | 필수 | 설명 |
|---|---|---:|---|
| user_region | string | Y | "서울 강북구" 형식 |
| user_sido | string | Y | 시·도 코드 |
| user_sigungu | string | Y | 시·군 코드 |
| user_priorities | string[] | Y | 1~3개, 7개 enum 중 |
| user_fitness_level | enum | Y | low / mid / high |
| user_travel_time_min | enum | Y | 30 / 60 / 120 |
| user_preferred_activity | enum | Y | walking / meditation / program / free |

Zod 스키마는 `app/features/recovery-forest/schemas/input.schema.ts`에 정의.

## 9. 출력/화면 결과

- 입력 폼 (모바일 우선)
- 유효성 검증 메시지 (필드별 인라인)
- "추천 받기" 버튼 (선택 미완료 시 비활성)
- 로딩 상태 (n8n 호출 중)

## 10. 수용 기준

- [ ] 모든 필수 필드 유효 시 버튼 활성화
- [ ] 우선순위 4개 이상 선택 시 4번째 비활성
- [ ] 빈 제출 시 server에서 `VALIDATION_FAILED` 반환
- [ ] 성공 시 `/recommend/results/:sessionId` 이동
- [ ] 모바일 360px 폭에서 깨지지 않음
- [ ] 버튼 터치 영역 44x44 이상
- [ ] 의료 정보 입력 필드 없음

## 11. 오류/빈 상태

- Loading: 버튼 disabled + 스피너 + "오늘의 숲을 분석하고 있어요" 텍스트
- Empty: 해당 없음
- Error: "추천 요청을 보낼 수 없어요. 잠시 후 다시 시도해주세요" + 재시도
- Unauthorized: 해당 없음 (익명)
- Timeout: 20초 후 "예상보다 오래 걸려요. 결과를 받는 즉시 표시합니다" 표시

## 12. 보안/권한

- session_id는 서버 생성 (클라이언트가 보낸 값 신뢰 금지)
- 입력 payload는 `recommendation_sessions.input_payload`에 저장
- 좌표는 저장하지 않음 (시·군까지만)

## 13. 의료/법적 안전 기준

- 체력 수준 라벨은 "낮음/보통/높음", 질환 단어 사용 금지
- 우선순위 옵션은 "면역력에 좋다" 단정 금지 → "면역 관심" 표현

## 14. 테스트 계획

### Unit

- input.schema.test.ts: 정상/누락/범위 초과 케이스
- 버튼 활성/비활성 조건 테스트

### Integration

- server action: 유효 입력 → sessionId 반환 + Supabase insert
- server action: 무효 입력 → 400 응답

### E2E

- 입력 → 결과 페이지 도달

## 15. 완료 후 문서 업데이트

- [ ] PRD 업데이트 필요 없음
- [ ] TRD 업데이트 필요 없음
- [ ] REQUIREMENTS 업데이트 필요 없음
- [ ] TESTING 업데이트 필요 없음

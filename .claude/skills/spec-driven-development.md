# Skill: Spec Driven Development

## 목적

Claude Code가 기능의 목적과 수용 기준을 먼저 이해한 뒤 구현하게 한다.

## 사용 시점

- 새 화면
- 새 API
- 새 DB 테이블
- 리포트 생성 기능
- 챗봇 기능
- n8n 자동화
- 커뮤니티/채팅 기능
- 블로그/콘텐츠 자동화 기능

## 절차

### 1. 명세 확인

먼저 아래 문서를 확인한다.

- docs/PRD.md
- docs/TRD.md
- docs/REQUIREMENTS.md
- docs/TESTING.md
- 관련 기능 SPEC

관련 SPEC이 없으면 docs/SPEC_TEMPLATE.md를 기준으로 최소 명세를 제안한다.

### 2. 구현 계획 작성

코드 수정 전에 계획을 작성한다.

계획에는 다음이 포함되어야 한다.

- 수정할 파일
- 새로 만들 파일
- 데이터 흐름
- 테스트 계획
- 위험 요소
- 완료 기준

### 3. 수용 기준 고정

명세의 수용 기준을 체크리스트로 바꾼다.

예시:

```text
- [ ] 로그인 사용자만 접근 가능
- [ ] 필수 입력 누락 시 오류 표시
- [ ] report_requests status가 requested로 생성
- [ ] 다른 사용자의 리포트 접근 차단
```

### 4. TDD 연결

명세가 확정되면 TDD skill을 사용한다.

순서:

```text
Spec → Acceptance Criteria → Failing Tests → Implementation → Refactor → Docs
```

### 5. 완료 보고

작업 후 다음을 보고한다.

```text
구현 범위:
- 

수용 기준 충족 여부:
- [x] 
- [x] 

테스트:
- 

남은 리스크:
- 
```

## 금지

- 명세 없이 큰 기능 구현
- 사용자의 대상 고객을 무시한 UI 구현
- 의료 안전 기준 없는 챗봇/리포트 구현
- 수용 기준 없이 “완료” 선언
- 불필요한 기능 추가

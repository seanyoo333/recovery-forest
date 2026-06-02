# 회복의 숲 (Recovery Forest)

> 산림 공공데이터와 AI를 활용해 오늘 내 몸 상태와 관심사에 맞는 산림치유 공간을 추천하는 서비스.

- 대회: 2026 산림청 공공데이터 AI 창업 경진대회 (마감 2026-06-19)
- 출품 주체: 에비던스 베이스 주식회사
- 서비스 도메인: `recovery-forest.evidence-base.ai`
- 현장 실증 파트너: 한국통합치유협동조합

## 문서

- [PRD.md](./docs/PRD.md) — 제품 정의
- [TRD.md](./docs/TRD.md) — 기술 아키텍처
- [REQUIREMENTS.md](./docs/REQUIREMENTS.md) — 구현 규칙
- [TESTING.md](./docs/TESTING.md) — 테스트 전략
- [COMPETITION.md](./docs/COMPETITION.md) — 대회 평가항목 매핑
- [specs/](./docs/specs) — 기능별 SPEC

## 개발 흐름

[.claude/skills/spec-driven-development.md](./.claude/skills/spec-driven-development.md)와 [test-driven-development.md](./.claude/skills/test-driven-development.md)를 따른다.

```
Spec → Acceptance Criteria → Failing Tests → Implementation → Refactor → Docs
```

## 기술 스택

- React Router 7 (Vercel 배포)
- Tailwind CSS 4 + shadcn/ui
- Supabase (Postgres + RLS, 익명 사용)
- Drizzle ORM
- n8n (외부 API 오케스트레이션)
- OpenAI (추천 이유 생성, n8n 노드에서 호출)

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 키 채우기
npm run dev
```

## 라이선스

[LICENSE.md](./LICENSE.md)

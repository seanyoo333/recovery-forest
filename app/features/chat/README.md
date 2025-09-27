# AI Chat System

이 프로젝트의 AI 챗봇 시스템은 Supabase Realtime과 AWS 챗봇 API를 연동하여 실시간 AI 대화 기능을 제공합니다.

## 🏗️ 시스템 아키텍처

### 데이터 플로우

1. **사용자 메시지 입력** → Form 제출
2. **Supabase 저장** → 사용자 메시지를 `bot_messages` 테이블에 저장
3. **AWS API 호출** → Django LLM 서버에 메시지 전송
4. **AI 응답 저장** → AI 응답을 Supabase에 저장
5. **실시간 업데이트** → Supabase Realtime으로 UI 업데이트

### 기술 스택

- **Frontend**: React Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **AI Service**: AWS EC2 Django LLM 서버
- **Real-time**: Supabase Postgres Changes

## 📁 파일 구조

```
app/features/chat/
├── api/
│   ├── langchain.tsx          # AWS 챗봇 API 호출
│   ├── create-room.tsx        # 채팅방 생성
│   └── hide-bot-message.tsx   # 메시지 숨기기
├── pages/
│   ├── bot-message-page.tsx   # 메인 챗봇 페이지
│   ├── bot-messages-page.tsx  # 채팅방 목록
│   └── chat-page.tsx          # 챗봇 대시보드
├── queries.ts                 # Supabase 쿼리 함수들
├── mutations.ts               # 데이터 변경 함수들
└── README.md                  # 이 파일
```

## 🔧 설정

### 환경 변수

```bash
# AWS 챗봇 서버 URL (프로토콜과 포트는 자동으로 추가됨)
LLM_SERVER_URL=43.202.113.129

# 또는 완전한 URL 형식으로 설정
LLM_SERVER_URL=http://43.202.113.129:8000

# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 데이터베이스 스키마

```sql
-- 챗봇 대화방
CREATE TABLE bot_message_rooms (
  bot_message_room_id SERIAL PRIMARY KEY,
  room_name TEXT,
  room_description TEXT,
  created_by UUID REFERENCES profiles(profile_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 챗봇 메시지
CREATE TABLE bot_messages (
  bot_message_id SERIAL PRIMARY KEY,
  bot_message_room_id INTEGER REFERENCES bot_message_rooms(bot_message_room_id),
  sender_id TEXT, -- 사용자 ID 또는 "ai-assistant"
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 대화방 멤버
CREATE TABLE bot_message_room_members (
  bot_message_room_id INTEGER REFERENCES bot_message_rooms(bot_message_room_id),
  profile_id UUID REFERENCES profiles(profile_id),
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (bot_message_room_id, profile_id)
);
```

## 🚀 사용법

### 1. 채팅방 생성

```typescript
// 새 채팅방 생성
const room = await createBotMessageRoom(client, {
  userId: "user-id",
  roomName: "AI Research Chat",
  roomDescription: "AI와의 연구 대화",
});
```

### 2. 메시지 전송

```typescript
// 사용자 메시지 전송
await sendBotMessageToRoom(client, {
  botMessageRoomId: "room-id",
  message: "안녕하세요!",
  userId: "user-id",
});
```

### 3. 실시간 구독

```typescript
// Supabase Realtime 구독
const channel = supabase
  .channel(`bot-messages:${roomId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "bot_messages",
      filter: `bot_message_room_id=eq.${roomId}`,
    },
    (payload) => {
      // 새 메시지 처리
      console.log("New message:", payload.new);
    },
  )
  .subscribe();
```

## 🎨 UI 특징

### 메시지 구분

- **사용자 메시지**: 파란색 배경, 오른쪽 정렬
- **AI 응답**: 그라데이션 배경, 왼쪽 정렬
- **로딩 상태**: 노란색 배경, 애니메이션 효과

### 실시간 기능

- 메시지 전송 즉시 UI 업데이트
- AI 응답 대기 중 로딩 표시
- 자동 스크롤 및 메시지 정렬

## 🔒 보안

- **인증**: Supabase Auth를 통한 사용자 인증
- **권한**: RLS(Row Level Security)로 데이터 접근 제어
- **API 보안**: 서버 사이드에서만 AWS API 호출

## 🐛 문제 해결

### AI 응답이 오지 않는 경우

1. `LLM_SERVER_URL` 환경 변수 확인
2. AWS 서버 상태 확인
3. 네트워크 연결 상태 확인

### 실시간 업데이트가 안 되는 경우

1. Supabase Realtime 설정 확인
2. 채널 구독 상태 확인
3. 데이터베이스 권한 확인

## 📈 성능 최적화

- **메시지 페이징**: 대량 메시지 로딩 시 페이지네이션
- **이미지 최적화**: 메시지 이미지 lazy loading
- **캐싱**: 자주 사용되는 데이터 캐싱

## 🔄 향후 개선 사항

- [ ] 메시지 검색 기능
- [ ] 파일 업로드 지원
- [ ] 메시지 편집/삭제
- [ ] 다중 사용자 채팅방
- [ ] 메시지 알림 시스템

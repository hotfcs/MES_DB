# 🐛 챗봇 문제 해결 가이드

## Internal Server Error 해결 방법

### 증상
브라우저에서 "Internal Server Error" 또는 500 오류 표시

---

## ✅ 체크리스트

### 1. 챗봇 기능을 사용하지 않으려면

챗봇 버튼을 임시로 숨기세요:

**src/components/LayoutClient.tsx** 수정:

```typescript
// 챗봇 부분을 주석 처리
{/* 챗봇 (로그인된 사용자에게만 표시) */}
{/* user && !isLoginPage && (
  <>
    <ChatBotButton onClick={() => setChatBotOpen(!chatBotOpen)} />
    <ChatBot
      userId={user.id}
      isOpen={chatBotOpen}
      onClose={() => setChatBotOpen(false)}
    />
  </>
) */}
```

### 2. 챗봇 기능을 사용하려면

**필수 설정:**

#### A. OpenAI API 키 설정

`.env.local` 파일 생성:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**API 키 발급:**
- https://platform.openai.com/api-keys 접속
- "Create new secret key" 클릭
- 생성된 키를 복사하여 `.env.local`에 추가
- **서버 재시작** (Ctrl+C 후 `npm run dev`)

#### B. 데이터베이스 테이블 생성

SQL Studio에서 `create-chatbot-tables.sql` 실행:
```sql
-- ChatSessions, ChatHistory, ChatFeedback 테이블 생성
```

#### C. import 경로 확인

`src/lib/chat-queries.ts` 파일 첫 부분:
```typescript
import { executeQuery } from './db-queries';  // ✅ 올바름
// import { executeQuery } from './db';       // ❌ 잘못됨
```

---

## 🔍 오류별 해결 방법

### 오류: OpenAI API key not found

**원인:** `.env.local`에 API 키가 없거나 잘못됨

**해결:**
1. 프로젝트 루트에 `.env.local` 파일 생성
2. `OPENAI_API_KEY=sk-...` 추가
3. 서버 재시작

### 오류: Invalid object name 'ChatSessions'

**원인:** 데이터베이스에 챗봇 테이블이 없음

**해결:**
1. Azure SQL Studio 접속
2. `create-chatbot-tables.sql` 파일 내용 실행
3. 테이블 생성 확인

### 오류: Export executeQuery doesn't exist

**원인:** import 경로가 잘못됨

**해결:**
```typescript
// src/lib/chat-queries.ts
import { executeQuery } from './db-queries'; // 이렇게 수정
```

### 오류: Module not found: Can't resolve 'openai'

**원인:** OpenAI SDK가 설치되지 않음

**해결:**
```bash
npm install openai
```

---

## 🚀 완전히 새로 시작하기

모든 캐시를 삭제하고 깨끗하게 시작:

```powershell
# 1. 서버 중지 (Ctrl+C)

# 2. 캐시 삭제
Remove-Item -Recurse -Force .next

# 3. 의존성 재설치
npm install

# 4. 서버 시작
npm run dev
```

---

## 📞 추가 도움이 필요한 경우

### 브라우저 콘솔 확인 (F12)

1. 브라우저에서 **F12** 키 누르기
2. **Console** 탭 열기
3. 빨간색 오류 메시지 확인
4. 오류 메시지를 개발자에게 전달

### 서버 로그 확인

터미널에 표시되는 오류 메시지 확인

---

## ✅ 정상 동작 확인

### 챗봇이 정상적으로 동작하면:

1. ✅ 우측 하단에 파란색 💬 버튼이 보임
2. ✅ 버튼 클릭 시 챗봇 창이 열림
3. ✅ 메시지 입력 시 AI가 응답
4. ✅ 브라우저 콘솔에 오류 없음

### 챗봇을 사용하지 않으면:

1. ✅ 기존 MES 기능 정상 동작
2. ✅ 로그인/로그아웃 정상
3. ✅ 모든 페이지 접근 가능
4. ✅ 챗봇 버튼 없음 (주석 처리한 경우)

---

## 💡 팁

- 챗봇은 선택적 기능입니다
- 챗봇 없이도 기존 MES 시스템은 정상 동작합니다
- 나중에 OpenAI API 키를 발급받아 활성화할 수 있습니다

---

**마지막 업데이트:** 2024-10-16


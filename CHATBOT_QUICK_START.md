# ⚡ 챗봇 빠른 시작 가이드

## 3단계로 시작하기

### 1️⃣ 환경 변수 설정 (2분)

`.env.local` 파일 생성:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**API 키 발급**: https://platform.openai.com/api-keys

### 2️⃣ 데이터베이스 설정 (5분)

SQL Studio에서 실행:

```sql
-- create-chatbot-tables.sql 파일 내용 실행
```

### 3️⃣ 서버 실행 (1분)

```bash
npm install
npm run dev
```

## ✅ 동작 확인

1. http://localhost:3000 접속
2. 로그인
3. 우측 하단 챗봇 버튼 클릭
4. "진행중인 작업지시 보여줘" 입력

---

## 💬 테스트 질문 예시

```
- "제품 목록 보여줘"
- "진행중인 작업지시 보여줘"
- "재고 부족한 자재 있어?"
- "설비 목록 알려줘"
- "이번 주 생산 계획은?"
```

---

## 🔧 주요 파일

| 파일 | 설명 |
|------|------|
| `create-chatbot-tables.sql` | DB 스키마 |
| `src/lib/openai-helper.ts` | OpenAI 설정 |
| `src/lib/chat-queries.ts` | DB 조회 |
| `src/components/ChatBot.tsx` | UI 컴포넌트 |

---

## 🐛 문제 해결

**OpenAI API 오류?**
→ `.env.local`에 API 키 확인 후 서버 재시작

**DB 연결 오류?**
→ `create-chatbot-tables.sql` 실행 확인

**챗봇이 안 보여?**
→ 로그인 상태 확인

---

자세한 내용은 `CHATBOT_SETUP_GUIDE.md` 참조


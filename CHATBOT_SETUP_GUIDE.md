# 🤖 OpenAI 챗봇 설정 가이드

MES 시스템에 OpenAI를 활용한 데이터베이스 연동 챗봇이 성공적으로 추가되었습니다!

## 📋 구현 완료 항목

✅ **1단계**: OpenAI SDK 설치  
✅ **2단계**: 데이터베이스 스키마 생성  
✅ **3단계**: OpenAI 헬퍼 함수 및 Function Calling  
✅ **4단계**: 데이터베이스 조회 함수  
✅ **5단계**: API 라우트 생성  
✅ **6단계**: 프론트엔드 컴포넌트  
✅ **7단계**: 타입 정의  
✅ **8단계**: 레이아웃 통합  

---

## 🚀 시작하기

### 1️⃣ 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 기존 데이터베이스 설정
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# OpenAI API 키 (필수!)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Azure Blob Storage (기존)
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_CONTAINER_NAME=your-container-name
```

**OpenAI API 키 발급 방법:**
1. https://platform.openai.com/ 접속
2. 계정 생성/로그인
3. API Keys 메뉴에서 새 키 생성
4. 생성된 키를 `.env.local`에 추가

### 2️⃣ 데이터베이스 테이블 생성

Azure SQL Studio 또는 SQL Server Management Studio에서 다음 스크립트를 실행하세요:

```bash
# SQL 파일 실행
sqlcmd -S your-server.database.windows.net -d your-database -U your-username -P your-password -i create-chatbot-tables.sql
```

또는 SQL Studio에서 `create-chatbot-tables.sql` 파일의 내용을 직접 실행하세요.

생성되는 테이블:
- `ChatSessions` - 챗봇 세션 관리
- `ChatHistory` - 대화 이력 저장
- `ChatFeedback` - 사용자 피드백 (선택)

### 3️⃣ 의존성 설치 확인

```bash
npm install
```

OpenAI SDK가 이미 설치되어 있습니다:
- `openai` - OpenAI 공식 SDK

### 4️⃣ 개발 서버 실행

```bash
npm run dev
```

서버가 시작되면 http://localhost:3000 에서 확인할 수 있습니다.

---

## 🎯 챗봇 기능

### 지원하는 질문 유형

챗봇은 다음과 같은 MES 데이터를 조회할 수 있습니다:

#### 1. 제품 정보 조회
```
- "제품 목록 보여줘"
- "LED 제품 찾아줘"
- "P001 제품 정보 알려줘"
```

#### 2. 작업 지시 조회
```
- "진행중인 작업지시 보여줘"
- "오늘 완료된 작업은?"
- "대기중인 작업 있어?"
```

#### 3. 설비 정보 조회
```
- "설비 목록 보여줘"
- "CNC 설비 상태 알려줘"
- "E001 설비 어디있어?"
```

#### 4. 자재 재고 조회
```
- "자재 재고 확인해줘"
- "재고 부족한 자재 있어?"
- "철판 자재 찾아줘"
```

#### 5. 생산 계획 조회
```
- "이번 주 생산 계획 보여줘"
- "진행중인 계획은?"
- "완료된 계획 목록"
```

#### 6. 사용자 정보 조회
```
- "사용자 목록 보여줘"
- "admin 계정 찾아줘"
- "김철수 님 정보 알려줘"
```

### Function Calling

챗봇은 OpenAI의 Function Calling을 활용하여:
- 사용자 질문을 이해
- 적절한 데이터베이스 함수 호출
- 실시간 데이터 조회
- 자연스러운 한국어 응답 생성

---

## 🏗️ 프로젝트 구조

```
MES_DB/
├── create-chatbot-tables.sql          # DB 스키마
├── src/
│   ├── types/
│   │   └── database.ts                # 챗봇 타입 정의
│   ├── lib/
│   │   ├── openai-helper.ts          # OpenAI API 헬퍼
│   │   ├── chat-queries.ts           # DB 조회 함수
│   │   ├── db.ts                     # 기존 DB 연결
│   │   └── db-queries.ts             # 기존 쿼리
│   ├── app/
│   │   └── api/
│   │       └── chat/
│   │           ├── send/route.ts     # 메시지 전송 API
│   │           ├── history/route.ts  # 이력 조회 API
│   │           └── sessions/route.ts # 세션 생성 API
│   └── components/
│       ├── ChatBot.tsx               # 메인 챗봇
│       ├── ChatBotButton.tsx         # 플로팅 버튼
│       ├── ChatMessage.tsx           # 메시지 컴포넌트
│       ├── ChatInput.tsx             # 입력창
│       └── LayoutClient.tsx          # 레이아웃 (업데이트)
```

---

## 🔧 커스터마이징

### 1. OpenAI 모델 변경

`src/lib/openai-helper.ts` 파일에서 모델을 변경할 수 있습니다:

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',  // 'gpt-4o', 'gpt-3.5-turbo'로 변경 가능
  // ...
});
```

**모델 선택 가이드:**
- `gpt-3.5-turbo`: 빠르고 저렴 (권장)
- `gpt-4o-mini`: 균형잡힌 성능
- `gpt-4o`: 최고 성능, 비용 높음

### 2. 시스템 프롬프트 수정

챗봇의 성격과 역할을 변경하려면 `src/lib/openai-helper.ts`의 시스템 메시지를 수정하세요:

```typescript
const systemMessage: ChatCompletionMessageParam = {
  role: 'system',
  content: `당신은 MES(제조 실행 시스템) 전문 AI 어시스턴트입니다. 
  // 여기를 수정하세요
  `,
};
```

### 3. 새로운 데이터 조회 함수 추가

**Step 1**: `src/lib/chat-queries.ts`에 새 함수 추가

```typescript
export async function searchCustomers(keyword?: string) {
  const query = `
    SELECT customer_code, name, email, phone
    FROM Customers
    WHERE name LIKE @keyword
  `;
  return await executeQuery(query, { keyword: `%${keyword}%` });
}
```

**Step 2**: `src/lib/openai-helper.ts`에 함수 등록

```typescript
export const availableFunctions = {
  // 기존 함수들...
  search_customers: async (args: unknown) => {
    const { keyword } = args as { keyword?: string };
    return await chatQueries.searchCustomers(keyword);
  },
};
```

**Step 3**: Function Calling 도구 정의 추가

```typescript
export const tools: ChatCompletionTool[] = [
  // 기존 도구들...
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description: '고객 정보를 검색합니다.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '검색할 고객명',
          },
        },
        required: [],
      },
    },
  },
];
```

### 4. UI 스타일 변경

**색상 테마 변경** (`src/components/ChatBot.tsx`):

```typescript
// 헤더 색상
className="... bg-gradient-to-r from-blue-500 to-blue-600"

// 사용자 메시지 색상
className="bg-blue-500 text-white"
```

**크기 변경**:

```typescript
// 챗봇 창 크기
className="... w-96 h-[600px]"

// 더 크게: w-[500px] h-[700px]
// 더 작게: w-80 h-[500px]
```

---

## 🎨 UI 미리보기

### 챗봇 버튼 (우측 하단)
- 🔵 파란색 플로팅 버튼
- 호버 시 "AI 어시스턴트" 툴팁
- 읽지 않은 메시지 뱃지 (선택)

### 챗봇 창
- 📱 모바일 친화적 크기 (384px × 600px)
- 💬 사용자/AI 메시지 구분 디자인
- ⏰ 타임스탬프 표시
- 🔄 로딩 애니메이션
- ✨ 부드러운 스크롤

---

## 🐛 문제 해결

### OpenAI API 키 오류

```
Error: Invalid API key
```

**해결방법:**
1. `.env.local` 파일의 `OPENAI_API_KEY` 확인
2. API 키가 `sk-`로 시작하는지 확인
3. OpenAI 계정에서 키가 활성화되어 있는지 확인
4. 서버 재시작: `npm run dev`

### 데이터베이스 연결 오류

```
Error: Failed to connect to database
```

**해결방법:**
1. `.env.local`의 데이터베이스 설정 확인
2. Azure SQL 방화벽 규칙 확인
3. `create-chatbot-tables.sql` 실행 여부 확인

### 챗봇 응답이 없음

```
응답을 생성할 수 없습니다.
```

**해결방법:**
1. 브라우저 콘솔(F12)에서 에러 확인
2. 서버 로그 확인
3. OpenAI API 사용량 및 잔액 확인
4. 네트워크 연결 확인

### TypeScript 에러

프로젝트 코딩 규칙을 준수하여 작성되었습니다:
- ❌ `any` 타입 사용 금지
- ✅ `unknown` 타입 + 타입 단언 사용
- ✅ 명시적 타입 지정

---

## 💰 비용 안내

### OpenAI API 요금 (2024년 기준)

| 모델 | 입력 (1M 토큰) | 출력 (1M 토큰) |
|------|----------------|----------------|
| gpt-3.5-turbo | $0.50 | $1.50 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4o | $5.00 | $15.00 |

**예상 비용:**
- 일반 질문 1회: 약 $0.001~0.005 (0.1~0.5원)
- 데이터 조회 1회: 약 $0.002~0.01 (0.2~1원)
- 월 1000회 사용: 약 $2~10 (2000~10,000원)

**비용 절감 팁:**
1. `gpt-3.5-turbo` 또는 `gpt-4o-mini` 사용
2. 대화 컨텍스트 제한 (현재 최근 10개 메시지)
3. 시스템 프롬프트 간결하게 유지
4. 불필요한 Function Calling 줄이기

---

## 🔐 보안 고려사항

### 1. API 키 보호
- ✅ `.env.local` 파일은 `.gitignore`에 포함
- ✅ API 키는 서버 사이드에서만 사용
- ❌ 절대 클라이언트에 노출하지 말 것

### 2. 사용자 인증
- ✅ 로그인한 사용자만 챗봇 사용 가능
- ✅ 세션 소유권 검증
- ✅ 사용자 ID 기반 권한 확인

### 3. 데이터 접근 제어
- ✅ SQL Injection 방지 (parameterized queries)
- ✅ 민감한 정보 필터링
- ⚠️ 필요시 역할 기반 데이터 접근 제어 추가

---

## 📈 향후 개선 사항

### 단기 (1-2주)
- [ ] 스트리밍 응답 구현 (실시간 타이핑 효과)
- [ ] 대화 내보내기 기능
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 음성 입력/출력

### 중기 (1개월)
- [ ] 챗봇 분석 대시보드
- [ ] 자주 묻는 질문 학습
- [ ] 사용자 만족도 평가
- [ ] 챗봇 사용 통계

### 장기 (3개월)
- [ ] RAG (Retrieval-Augmented Generation) 구현
- [ ] 벡터 데이터베이스 통합
- [ ] 문서 검색 기능
- [ ] 이미지 분석 (GPT-4 Vision)

---

## 📚 참고 자료

### OpenAI 공식 문서
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Function Calling 가이드](https://platform.openai.com/docs/guides/function-calling)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

### Next.js 문서
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Azure SQL
- [Azure SQL Database](https://learn.microsoft.com/azure/azure-sql/)
- [Connection Strings](https://learn.microsoft.com/azure/azure-sql/database/connect-query-content-reference-guide)

---

## 🆘 지원

문제가 발생하면:

1. **GitHub Issues**: 프로젝트 리포지토리에 이슈 등록
2. **문서 확인**: 이 가이드 재확인
3. **로그 확인**: 브라우저 콘솔 및 서버 로그
4. **커뮤니티**: Stack Overflow, OpenAI Community

---

## ✅ 체크리스트

챗봇 설정을 완료했는지 확인하세요:

- [ ] OpenAI API 키 발급 및 `.env.local`에 추가
- [ ] `create-chatbot-tables.sql` 실행
- [ ] 데이터베이스 연결 테스트
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 로그인 후 챗봇 버튼 확인
- [ ] 테스트 질문으로 동작 확인
- [ ] 에러 없이 응답 받기

---

## 🎉 완료!

축하합니다! OpenAI 데이터베이스 연동 챗봇이 MES 시스템에 성공적으로 통합되었습니다.

이제 사용자들이 자연어로 시스템 데이터를 조회하고 업무 효율성을 높일 수 있습니다! 🚀

---

**마지막 업데이트**: 2024-10-16  
**버전**: 1.0.0


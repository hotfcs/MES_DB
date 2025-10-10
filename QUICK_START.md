# ⚡ Azure SQL Server 빠른 시작 가이드

이 가이드는 5분 안에 Azure SQL Server를 Next.js 프로젝트에 연동하는 방법을 설명합니다.

## 📝 체크리스트

- [ ] Azure SQL Server 리소스 생성
- [ ] 환경 변수 설정
- [ ] 테이블 생성
- [ ] 연결 테스트
- [ ] 예제 페이지 확인

## 🚀 1단계: Azure 리소스 생성 (5분)

### Azure Portal에서

1. [Azure Portal](https://portal.azure.com) 접속
2. **SQL databases** → **만들기**
3. 기본 정보 입력:
   ```
   데이터베이스: test-db
   서버: 새로 만들기
     ├─ 이름: my-sql-server (고유한 이름)
     ├─ 위치: Korea Central
     ├─ 인증: SQL 인증
     ├─ 로그인: sqladmin
     └─ 암호: [강력한 암호]
   ```
4. **검토 + 만들기** → **만들기**

### 방화벽 규칙 추가

1. SQL Server 리소스 → **네트워킹**
2. **현재 클라이언트 IP 추가** 클릭
3. **저장**

## 🔧 2단계: 환경 변수 설정 (1분)

프로젝트 루트에 `.env.local` 파일 생성:

```env
AZURE_SQL_SERVER=my-sql-server.database.windows.net
AZURE_SQL_DATABASE=test-db
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=your-password
```

⚠️ **서버 이름 주의**: `.database.windows.net`까지 포함해야 합니다!

## 🗄️ 3단계: 데이터베이스 테이블 생성 (2분)

### 방법 1: Azure Portal 쿼리 편집기

1. SQL Database 리소스 → **쿼리 편집기**
2. SQL 로그인 정보 입력
3. `database-setup.sql` 파일 내용 복사 & 붙여넣기
4. **실행** 클릭

### 방법 2: SSMS (SQL Server Management Studio)

1. SSMS 실행 → 서버 연결
2. `database-setup.sql` 파일 열기
3. F5 또는 **실행**

## ✅ 4단계: 연결 테스트 (1분)

```bash
# 개발 서버 시작
npm run dev
```

브라우저에서 접속:
```
http://localhost:3000/api/test-connection
```

**성공 응답:**
```json
{
  "success": true,
  "message": "Azure SQL Server 연결 성공"
}
```

## 🎨 5단계: 예제 페이지 확인

### Server Actions 예제 (사용자 관리)
```
http://localhost:3000/examples/azure-sql-server-actions
```

**기능:**
- ✅ 사용자 목록 조회
- ✅ 새 사용자 추가
- ✅ 사용자 삭제

### API Routes 예제 (상품 관리)
```
http://localhost:3000/examples/azure-sql-api
```

**기능:**
- ✅ 상품 목록 조회
- ✅ 상품 검색 (이름, 가격 범위)
- ✅ 새 상품 추가
- ✅ 상품 삭제

## 📖 기본 사용법

### Server Actions 방식 (권장)

```tsx
// 1. Server Action 정의
'use server';
import { executeQuery } from '@/lib/db-queries';

export async function getUsers() {
  const users = await executeQuery('SELECT * FROM users');
  return { success: true, data: users };
}

// 2. Server Component에서 사용
import { getUsers } from '@/actions/user-actions';

export default async function Page() {
  const { data: users } = await getUsers();
  return <div>{users?.map(u => <div>{u.name}</div>)}</div>;
}
```

### API Routes 방식

```tsx
// 1. API Route 생성 (app/api/users/route.ts)
import { executeQuery } from '@/lib/db-queries';

export async function GET() {
  const users = await executeQuery('SELECT * FROM users');
  return Response.json({ data: users });
}

// 2. Client Component에서 사용
'use client';
const response = await fetch('/api/users');
const { data } = await response.json();
```

## 🎯 주요 쿼리 함수

```typescript
// SELECT - 데이터 조회
const users = await executeQuery(
  'SELECT * FROM users WHERE id = @id',
  { id: 1 }
);

// INSERT/UPDATE/DELETE - 데이터 수정
const rowsAffected = await executeNonQuery(
  'INSERT INTO users (name, email) VALUES (@name, @email)',
  { name: '홍길동', email: 'hong@example.com' }
);

// Stored Procedure 실행
const result = await executeStoredProcedure('sp_GetUsers', {
  status: 'active'
});

// 트랜잭션
await executeTransaction(async (transaction) => {
  // 여러 쿼리 실행
  // 모두 성공하면 커밋, 하나라도 실패하면 롤백
});
```

## 🆘 문제 해결

### 연결 실패

```
Error: Failed to connect to...
```

**확인 사항:**
1. ✅ 방화벽 규칙에 IP 추가했나요?
2. ✅ `.env.local` 파일에 올바른 정보가 있나요?
3. ✅ 서버 이름에 `.database.windows.net`이 포함되어 있나요?
4. ✅ 개발 서버를 재시작했나요?

### 인증 실패

```
Error: Login failed for user...
```

**확인 사항:**
1. ✅ 사용자 이름과 암호가 정확한가요?
2. ✅ Azure Portal에서 SQL 인증이 활성화되어 있나요?

### 테이블이 없음

```
Error: Invalid object name 'users'
```

**확인 사항:**
1. ✅ `database-setup.sql` 스크립트를 실행했나요?
2. ✅ 올바른 데이터베이스에 연결되어 있나요?

## 📚 더 알아보기

### 상세 가이드

- 📖 [AZURE_SQL_GUIDE.md](./AZURE_SQL_GUIDE.md) - 전체 가이드
- 📖 [database-setup.sql](./database-setup.sql) - SQL 스크립트

### 생성된 파일

```
src/
├── lib/
│   ├── db.ts              # 데이터베이스 연결
│   └── db-queries.ts      # 쿼리 헬퍼 함수
├── actions/
│   ├── user-actions.ts    # 사용자 Server Actions
│   └── product-actions.ts # 상품 Server Actions
└── app/
    ├── api/
    │   ├── test-connection/ # 연결 테스트
    │   ├── users/          # 사용자 API
    │   └── products/       # 상품 API
    └── examples/
        ├── azure-sql-server-actions/  # Server Actions 예제
        └── azure-sql-api/             # API Routes 예제
```

### 다음 단계

1. 🎯 기존 페이지에 데이터베이스 연동하기
2. 🔐 인증 기능 추가하기
3. 📊 대시보드 만들기
4. 🚀 프로덕션 배포하기

---

⚡ 5분 안에 Azure SQL Server 연동 완료!

문제가 있으면 [AZURE_SQL_GUIDE.md](./AZURE_SQL_GUIDE.md)의 문제 해결 섹션을 참고하세요.


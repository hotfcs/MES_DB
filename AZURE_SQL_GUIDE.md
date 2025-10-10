# 🚀 Next.js + Azure SQL Server 연동 가이드

이 가이드는 Next.js 프로젝트에 Azure SQL Server를 연동하는 전체 과정을 설명합니다.

## 📦 설치된 패키지

```bash
npm install mssql tedious
```

- **mssql**: Node.js용 Microsoft SQL Server 클라이언트
- **tedious**: SQL Server 연결을 위한 TDS(Tabular Data Stream) 프로토콜 드라이버

## 🔧 설정 단계

### 1. Azure SQL Server 리소스 생성

#### Azure Portal에서 생성

1. [Azure Portal](https://portal.azure.com) 접속
2. **SQL databases** → **만들기** 클릭
3. 다음 정보 입력:
   - **구독**: 사용할 구독 선택
   - **리소스 그룹**: 새로 만들기 또는 기존 선택
   - **데이터베이스 이름**: 예) `test-db`
   - **서버**: 새 서버 만들기
     - **서버 이름**: 예) `my-sql-server` (전역적으로 고유해야 함)
     - **위치**: Korea Central 추천
     - **인증 방법**: SQL 인증
     - **서버 관리자 로그인**: 예) `sqladmin`
     - **암호**: 강력한 암호 입력
   - **컴퓨팅 + 스토리지**: 기본 또는 필요에 맞게 선택
4. **검토 + 만들기** → **만들기** 클릭

#### 방화벽 규칙 설정

1. 생성된 SQL Server 리소스로 이동
2. **보안** → **네트워킹** 클릭
3. **방화벽 규칙**에서:
   - **현재 클라이언트 IP 주소 추가** 클릭
   - 또는 **0.0.0.0 ~ 255.255.255.255** 추가 (개발용, 보안 주의!)
4. **저장** 클릭

### 2. 연결 정보 확인

SQL Database 리소스의 **개요** 페이지에서 다음 정보 확인:

- **서버 이름**: `my-sql-server.database.windows.net`
- **데이터베이스 이름**: `test-db`

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Azure SQL Server 연결 정보
AZURE_SQL_SERVER=my-sql-server.database.windows.net
AZURE_SQL_DATABASE=test-db
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=your-strong-password
```

⚠️ **중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

### 4. 데이터베이스 테이블 생성

`database-setup.sql` 파일의 SQL 스크립트를 실행하세요.

#### Azure Portal에서 실행

1. SQL Database 리소스로 이동
2. **쿼리 편집기** 클릭
3. SQL 로그인 정보 입력
4. `database-setup.sql` 내용 복사 & 붙여넣기
5. **실행** 클릭

#### SQL Server Management Studio (SSMS)에서 실행

1. SSMS 실행
2. 서버 이름: `my-sql-server.database.windows.net`
3. 인증: SQL Server 인증
4. 로그인 & 암호 입력
5. `database-setup.sql` 파일 열기
6. F5 또는 **실행** 클릭

## 📁 프로젝트 구조

```
src/
├── lib/
│   ├── db.ts              # 데이터베이스 연결 설정
│   └── db-queries.ts      # 쿼리 헬퍼 함수들
├── actions/
│   ├── user-actions.ts    # 사용자 관련 Server Actions
│   └── product-actions.ts # 상품 관련 Server Actions
├── app/
│   ├── api/
│   │   ├── test-connection/ # 연결 테스트 API
│   │   ├── users/          # 사용자 API Routes
│   │   └── products/       # 상품 API Routes
│   └── examples/
│       ├── azure-sql-server-actions/  # Server Actions 예제
│       └── azure-sql-api/             # API Routes 예제
└── ...
```

## 🎯 사용 방법

### 1. Server Actions (추천)

Server Actions는 Next.js 15의 권장 방법입니다.

#### 예제 코드

```tsx
// actions/user-actions.ts
'use server';

import { executeQuery } from '@/lib/db-queries';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  const users = await executeQuery('SELECT * FROM users');
  return { success: true, data: users };
}

export async function addUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  await executeNonQuery(
    'INSERT INTO users (name, email) VALUES (@name, @email)',
    { name, email }
  );
  
  revalidatePath('/users');
  return { success: true };
}
```

#### Server Component에서 사용

```tsx
// app/users/page.tsx
import { getUsers, addUser } from '@/actions/user-actions';

export default async function UsersPage() {
  const { data: users } = await getUsers();

  return (
    <div>
      {/* 사용자 추가 폼 */}
      <form action={addUser}>
        <input name="name" required />
        <input name="email" type="email" required />
        <button type="submit">추가</button>
      </form>

      {/* 사용자 목록 */}
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 2. API Routes

RESTful API가 필요한 경우 사용합니다.

#### 예제 코드

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 목록 조회
export async function GET(request: NextRequest) {
  try {
    const products = await executeQuery('SELECT * FROM products');
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 데이터 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price } = body;
    
    await executeNonQuery(
      'INSERT INTO products (name, price) VALUES (@name, @price)',
      { name, price }
    );
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Client Component에서 사용

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.data));
  }, []);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        price: formData.get('price'),
      }),
    });
    
    // 목록 새로고침
  };

  return <div>{/* UI */}</div>;
}
```

### 3. 직접 쿼리 실행

```typescript
import { getDbConnection, sql } from '@/lib/db';

async function customQuery() {
  const pool = await getDbConnection();
  const result = await pool.request()
    .input('id', sql.Int, 1)
    .query('SELECT * FROM users WHERE id = @id');
  
  return result.recordset;
}
```

## 📖 주요 기능

### 1. 기본 CRUD 작업

#### SELECT (조회)

```typescript
// 전체 조회
const users = await executeQuery('SELECT * FROM users');

// 조건부 조회
const users = await executeQuery(
  'SELECT * FROM users WHERE id = @id',
  { id: 1 }
);

// TOP 사용
const users = await executeQuery(
  'SELECT TOP 10 * FROM users ORDER BY created_at DESC'
);

// JOIN
const orders = await executeQuery(`
  SELECT o.*, c.name as customer_name
  FROM orders o
  INNER JOIN customers c ON o.customer_id = c.id
`);
```

#### INSERT (추가)

```typescript
// 단일 추가
await executeNonQuery(
  'INSERT INTO users (name, email) VALUES (@name, @email)',
  { name: '홍길동', email: 'hong@example.com' }
);

// 여러 개 추가
await executeNonQuery(`
  INSERT INTO users (name, email) VALUES 
  (@name1, @email1),
  (@name2, @email2)
`, {
  name1: '홍길동', email1: 'hong@example.com',
  name2: '김철수', email2: 'kim@example.com'
});

// ID 반환
const pool = await getDbConnection();
const result = await pool.request()
  .input('name', '홍길동')
  .query(`
    INSERT INTO users (name, email) VALUES (@name, @email);
    SELECT SCOPE_IDENTITY() as id;
  `);
const newId = result.recordset[0].id;
```

#### UPDATE (수정)

```typescript
await executeNonQuery(
  'UPDATE users SET name = @name WHERE id = @id',
  { id: 1, name: '홍길동2' }
);

// 여러 필드 수정
await executeNonQuery(`
  UPDATE users 
  SET name = @name, email = @email, updated_at = GETDATE()
  WHERE id = @id
`, { id: 1, name: '홍길동', email: 'new@example.com' });
```

#### DELETE (삭제)

```typescript
await executeNonQuery(
  'DELETE FROM users WHERE id = @id',
  { id: 1 }
);

// 조건부 삭제
await executeNonQuery(
  'DELETE FROM users WHERE created_at < @date',
  { date: '2023-01-01' }
);
```

### 2. 고급 쿼리

#### 페이징

```typescript
const pageSize = 10;
const page = 1;
const offset = (page - 1) * pageSize;

const products = await executeQuery(`
  SELECT * FROM products
  ORDER BY id
  OFFSET @offset ROWS
  FETCH NEXT @pageSize ROWS ONLY
`, { offset, pageSize });
```

#### 검색

```typescript
const products = await executeQuery(`
  SELECT * FROM products
  WHERE name LIKE '%' + @search + '%'
  ORDER BY name
`, { search: '노트북' });
```

#### 집계 함수

```typescript
// COUNT
const result = await executeQuery(`
  SELECT COUNT(*) as total FROM users
`);
const total = result[0].total;

// SUM, AVG, MIN, MAX
const stats = await executeQuery(`
  SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    MIN(total_amount) as min_order,
    MAX(total_amount) as max_order
  FROM orders
`);
```

#### GROUP BY

```typescript
const stats = await executeQuery(`
  SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total
  FROM orders
  GROUP BY status
`);
```

### 3. Stored Procedure 실행

```typescript
// 파라미터 없음
const result = await executeStoredProcedure('sp_GetAllUsers');

// 파라미터 있음
const result = await executeStoredProcedure('sp_UpdateProductStock', {
  product_id: 1,
  quantity: 10
});
```

### 4. 트랜잭션

```typescript
await executeTransaction(async (transaction) => {
  // 재고 감소
  await transaction.request()
    .input('product_id', 1)
    .input('quantity', 5)
    .query('UPDATE products SET stock = stock - @quantity WHERE id = @product_id');
  
  // 주문 생성
  await transaction.request()
    .input('product_id', 1)
    .input('quantity', 5)
    .query('INSERT INTO orders (...) VALUES (...)');
  
  // 모든 쿼리가 성공하면 커밋, 하나라도 실패하면 롤백
});
```

## 🎨 TypeScript 타입 정의

```typescript
// 타입 정의
interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

// 사용
const users = await executeQuery<User>(
  'SELECT * FROM users'
);

// users는 User[] 타입
users.forEach(user => {
  console.log(user.name); // 자동 완성 지원
});
```

## 🧪 테스트

### 연결 테스트

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
# http://localhost:3000/api/test-connection
```

### 예제 페이지

1. **Server Actions 예제**
   - URL: http://localhost:3000/examples/azure-sql-server-actions
   - 사용자 CRUD 기능 데모

2. **API Routes 예제**
   - URL: http://localhost:3000/examples/azure-sql-api
   - 상품 관리 기능 데모

## ⚡ 성능 최적화

### 1. 연결 풀 사용

```typescript
// ✅ 권장: 연결 풀 재사용
const pool = await getDbConnection();
const result = await pool.request().query('...');

// ❌ 비권장: 매번 새 연결
const connection = await sql.connect(config);
```

### 2. 인덱스 생성

```sql
-- 자주 검색하는 컬럼에 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_name ON products(name);
```

### 3. 쿼리 최적화

```typescript
// ✅ 필요한 컬럼만 선택
SELECT id, name, email FROM users

// ❌ 모든 컬럼 선택
SELECT * FROM users
```

### 4. 페이징 구현

```typescript
// 전체 데이터를 한 번에 가져오지 않고 페이징 사용
const pageSize = 20;
const page = request.query.page || 1;
```

## 🔒 보안 Best Practices

### 1. SQL Injection 방지

```typescript
// ✅ 권장: 파라미터 바인딩
await executeQuery(
  'SELECT * FROM users WHERE email = @email',
  { email: userInput }
);

// ❌ 절대 금지: 문자열 연결
const query = `SELECT * FROM users WHERE email = '${userInput}'`; // 위험!
```

### 2. 환경 변수 보호

- `.env.local` 파일을 `.gitignore`에 추가
- 프로덕션에서는 Azure Key Vault 사용 권장

### 3. 최소 권한 원칙

```sql
-- 애플리케이션용 별도 사용자 생성
CREATE LOGIN app_user WITH PASSWORD = 'strong-password';
CREATE USER app_user FOR LOGIN app_user;

-- 필요한 권한만 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.products TO app_user;
```

### 4. 방화벽 규칙

- Azure Portal에서 필요한 IP만 허용
- 개발 환경과 프로덕션 환경 분리

## 🚨 문제 해결

### 연결 실패

```
Error: Failed to connect to my-server.database.windows.net:1433
```

**해결 방법:**
1. 방화벽 규칙 확인 (Azure Portal → SQL Server → 네트워킹)
2. 서버 이름 확인 (`.database.windows.net` 포함 여부)
3. 로그인 정보 확인
4. Azure Portal에서 서버가 실행 중인지 확인

### 인증 실패

```
Error: Login failed for user 'sqladmin'
```

**해결 방법:**
1. 환경 변수의 사용자 이름과 암호 확인
2. Azure Portal에서 SQL 인증이 활성화되어 있는지 확인
3. 암호 재설정 시도

### 테이블 없음

```
Error: Invalid object name 'users'
```

**해결 방법:**
1. `database-setup.sql` 스크립트 실행 확인
2. 올바른 데이터베이스에 연결되어 있는지 확인
3. Azure Portal 쿼리 편집기에서 테이블 목록 확인:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES;
   ```

### 연결 풀 고갈

```
Error: Timeout: Request failed to complete in 15000ms
```

**해결 방법:**
1. 연결 풀 설정 조정 (`src/lib/db.ts`)
2. 쿼리 성능 최적화
3. 인덱스 추가

## 📚 추가 리소스

- [Azure SQL Database 문서](https://learn.microsoft.com/ko-kr/azure/azure-sql/)
- [mssql 패키지 문서](https://www.npmjs.com/package/mssql)
- [T-SQL 참조](https://learn.microsoft.com/ko-kr/sql/t-sql/language-reference)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

## 🎓 다음 단계

1. **인증 구현**
   - Azure AD 통합
   - JWT 토큰 기반 인증

2. **캐싱 구현**
   - Redis 연동
   - Next.js 캐싱 전략

3. **모니터링**
   - Azure Application Insights
   - 쿼리 성능 모니터링

4. **CI/CD 구축**
   - GitHub Actions
   - Azure DevOps

---

✅ 이제 Azure SQL Server가 완전히 연동되었습니다!


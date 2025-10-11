# MES 시스템 코딩 표준

**버전**: 1.0.0  
**최종 수정일**: 2025-10-11  
**적용 대상**: MES 프로젝트 모든 개발자

---

## 📖 목차

1. [개요](#1-개요)
2. [TypeScript 코딩 표준](#2-typescript-코딩-표준)
3. [React 코딩 표준](#3-react-코딩-표준)
4. [Next.js 코딩 표준](#4-nextjs-코딩-표준)
5. [CSS 및 스타일링](#5-css-및-스타일링)
6. [데이터베이스 및 API](#6-데이터베이스-및-api)
7. [상태 관리](#7-상태-관리)
8. [파일 및 폴더 구조](#8-파일-및-폴더-구조)
9. [명명 규칙](#9-명명-규칙)
10. [주석 및 문서화](#10-주석-및-문서화)
11. [에러 처리](#11-에러-처리)
12. [테스트](#12-테스트)
13. [성능 최적화](#13-성능-최적화)
14. [보안](#14-보안)
15. [Git 커밋 규칙](#15-git-커밋-규칙)

---

## 1. 개요

### 1.1 목적

이 문서는 MES 시스템 개발 시 일관성 있고 유지보수 가능한 코드를 작성하기 위한 표준을 정의합니다.

### 1.2 원칙

- **가독성**: 코드는 명확하고 이해하기 쉬워야 합니다
- **일관성**: 프로젝트 전체에서 동일한 스타일을 유지합니다
- **타입 안전성**: TypeScript의 타입 시스템을 최대한 활용합니다
- **유지보수성**: 변경과 확장이 용이한 코드를 작성합니다
- **성능**: 최적화된 코드를 작성하되 가독성을 해치지 않습니다

### 1.3 적용 범위

이 표준은 다음 기술 스택에 적용됩니다:
- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5.x
- **Backend**: Next.js API Routes, Node.js 20+
- **Database**: Azure SQL Database (mssql)
- **State Management**: Zustand (커스텀 구현)
- **Styling**: Tailwind CSS 4.x

---

## 2. TypeScript 코딩 표준

### 2.1 타입 안전성

#### 2.1.1 any 타입 금지

**절대 `any` 타입을 사용하지 마세요.** `any`는 TypeScript의 타입 체크를 무력화합니다.

```typescript
// ❌ 나쁜 예
function processData(data: any) {
  return data.value;
}

// ✅ 좋은 예
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data');
}

// ✅ 더 좋은 예 - 인터페이스 정의
interface DataWithValue {
  value: string;
}

function processData(data: DataWithValue) {
  return data.value;
}
```

#### 2.1.2 unknown 타입 사용

타입을 모르는 경우 `unknown`을 사용하고 타입 가드로 안전하게 처리합니다.

```typescript
// ✅ 좋은 예
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else if (typeof error === 'string') {
    console.error(error);
  } else {
    console.error('Unknown error occurred');
  }
}
```

#### 2.1.3 타입 단언 (Type Assertion)

타입 단언은 신중하게 사용하며, 가능한 타입 가드를 선호합니다.

```typescript
// ❌ 나쁜 예 - 불필요한 이중 단언
const value = data as any as string;

// ✅ 좋은 예
const value = data as string;

// ✅ 더 좋은 예 - 타입 가드 사용
if (typeof data === 'string') {
  const value = data;
}
```

### 2.2 인터페이스 vs 타입

#### 2.2.1 인터페이스 우선 사용

확장 가능한 객체 타입은 인터페이스를 사용합니다.

```typescript
// ✅ 좋은 예
interface User {
  id: number;
  name: string;
  email: string;
}

interface AdminUser extends User {
  role: string;
  permissions: string[];
}
```

#### 2.2.2 타입 앨리어스 사용 시점

유니온, 인터섹션, 튜플 등 복잡한 타입은 타입 앨리어스를 사용합니다.

```typescript
// ✅ 좋은 예
type Status = 'active' | 'inactive' | 'pending';
type Nullable<T> = T | null;
type Point = [number, number];
```

### 2.3 함수 타입

#### 2.3.1 명시적 반환 타입

함수의 반환 타입을 명시적으로 선언합니다.

```typescript
// ❌ 나쁜 예
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ 좋은 예
function calculateTotal(items: Item[]): number {
  return items.reduce((sum: number, item: Item) => sum + item.price, 0);
}
```

#### 2.3.2 옵셔널 파라미터와 기본값

```typescript
// ✅ 좋은 예
function fetchUsers(limit: number = 10, offset?: number): Promise<User[]> {
  // ...
}
```

#### 2.3.3 화살표 함수 vs 일반 함수

- 컴포넌트 외부의 유틸리티 함수: 일반 함수
- 컴포넌트 내부의 이벤트 핸들러: 화살표 함수

```typescript
// ✅ 좋은 예 - 유틸리티 함수
export function formatDate(date: Date): string {
  return date.toISOString();
}

// ✅ 좋은 예 - 컴포넌트 내부
export default function MyComponent() {
  const handleClick = () => {
    console.log('clicked');
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

### 2.4 제네릭

#### 2.4.1 제네릭 사용

재사용 가능한 컴포넌트나 함수는 제네릭을 활용합니다.

```typescript
// ✅ 좋은 예
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // ...
}
```

### 2.5 배열 메소드 타입

#### 2.5.1 콜백 파라미터 타입 명시

배열 메소드의 콜백에서는 타입을 명시합니다.

```typescript
// ❌ 나쁜 예
const activeUsers = users.filter(u => u.status === 'active');

// ✅ 좋은 예
const activeUsers = users.filter((u: User) => u.status === 'active');

// ✅ 더 좋은 예 - 타입 추론 활용
const activeUsers: User[] = users.filter((u: User): boolean => u.status === 'active');
```

---

## 3. React 코딩 표준

### 3.1 컴포넌트 구조

#### 3.1.1 함수형 컴포넌트 사용

클래스 컴포넌트 대신 함수형 컴포넌트를 사용합니다.

```typescript
// ✅ 좋은 예
export default function ProductList({ products }: { products: Product[] }) {
  return (
    <div>
      {products.map((product: Product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

#### 3.1.2 Props 인터페이스

Props는 별도의 인터페이스로 정의합니다.

```typescript
// ✅ 좋은 예
interface ProductCardProps {
  product: Product;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div>
      <h3>{product.name}</h3>
      {onEdit && <button onClick={() => onEdit(product.id)}>Edit</button>}
      {onDelete && <button onClick={() => onDelete(product.id)}>Delete</button>}
    </div>
  );
}
```

### 3.2 Hooks 사용

#### 3.2.1 Hooks 순서

Hooks는 항상 같은 순서로 호출되어야 합니다.

```typescript
// ✅ 좋은 예
export default function UserProfile() {
  // 1. State hooks
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 2. Context hooks
  const { auth } = useAuth();
  
  // 3. Custom hooks
  const { products } = useProducts();
  
  // 4. Effect hooks
  useEffect(() => {
    fetchUser();
  }, []);
  
  // 5. Callback/Memo hooks
  const handleUpdate = useCallback(() => {
    // ...
  }, [user]);
  
  return <div>...</div>;
}
```

#### 3.2.2 의존성 배열 완전성

`useEffect`, `useCallback`, `useMemo`의 의존성 배열은 완전하게 작성합니다.

```typescript
// ❌ 나쁜 예
useEffect(() => {
  fetchData(userId);
}, []); // userId 누락

// ✅ 좋은 예
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ 좋은 예 - 함수도 포함
useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);
```

#### 3.2.3 useCallback과 useMemo

성능 최적화가 필요한 경우에만 사용합니다.

```typescript
// ❌ 나쁜 예 - 불필요한 최적화
const sum = useMemo(() => a + b, [a, b]);

// ✅ 좋은 예 - 실제 필요한 경우
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

const handleSubmit = useCallback(() => {
  // 자식 컴포넌트에 props로 전달되는 경우
  submitForm(formData);
}, [formData]);
```

### 3.3 조건부 렌더링

#### 3.3.1 명확한 조건 표현

```typescript
// ❌ 나쁜 예
{count && <div>{count}</div>} // count가 0이면 "0"이 렌더링됨

// ✅ 좋은 예
{count > 0 && <div>{count}</div>}
{count !== 0 && <div>{count}</div>}
```

#### 3.3.2 복잡한 조건은 변수로 추출

```typescript
// ✅ 좋은 예
const canEdit = user?.role === 'admin' && product.status === 'active';
const canDelete = user?.role === 'admin' || user?.id === product.ownerId;

return (
  <div>
    {canEdit && <button>Edit</button>}
    {canDelete && <button>Delete</button>}
  </div>
);
```

### 3.4 이벤트 핸들러

#### 3.4.1 명명 규칙

이벤트 핸들러는 `handle` 접두사를 사용합니다.

```typescript
// ✅ 좋은 예
const handleClick = () => { /* ... */ };
const handleSubmit = (e: React.FormEvent) => { /* ... */ };
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
```

#### 3.4.2 인라인 함수 지양

복잡한 로직은 인라인 함수를 피합니다.

```typescript
// ❌ 나쁜 예
<button onClick={() => {
  validateForm();
  submitData();
  closeModal();
}}>Submit</button>

// ✅ 좋은 예
const handleSubmit = () => {
  validateForm();
  submitData();
  closeModal();
};

<button onClick={handleSubmit}>Submit</button>
```

---

## 4. Next.js 코딩 표준

### 4.1 App Router

#### 4.1.1 파일 구조

```
app/
├── layout.tsx          # 루트 레이아웃
├── page.tsx           # 홈페이지
├── api/               # API Routes
│   └── mes/
│       ├── users/
│       │   └── route.ts
│       └── products/
│           └── route.ts
└── basic-info/        # 기본정보 페이지
    └── users/
        └── page.tsx
```

#### 4.1.2 Server vs Client Components

기본적으로 Server Component를 사용하고, 필요한 경우에만 Client Component로 변환합니다.

```typescript
// ✅ 좋은 예 - Server Component (default)
export default function ProductList() {
  // 서버에서 데이터 fetch
  return <div>...</div>;
}

// ✅ 좋은 예 - Client Component (필요시)
'use client';

import { useState } from 'react';

export default function ProductForm() {
  const [name, setName] = useState('');
  return <form>...</form>;
}
```

### 4.2 API Routes

#### 4.2.1 RESTful 설계

```typescript
// ✅ 좋은 예
// app/api/mes/users/route.ts
export async function GET() {
  // 목록 조회
}

export async function POST(request: NextRequest) {
  // 생성
}

export async function PUT(request: NextRequest) {
  // 수정
}

export async function DELETE(request: NextRequest) {
  // 삭제
}
```

#### 4.2.2 응답 형식 통일

```typescript
// ✅ 좋은 예
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// 성공 응답
return NextResponse.json({
  success: true,
  data: users,
  count: users.length
});

// 에러 응답
return NextResponse.json({
  success: false,
  error: 'User not found',
  message: '사용자를 찾을 수 없습니다.'
}, { status: 404 });
```

### 4.3 이미지 최적화

#### 4.3.1 next/image 사용

`<img>` 태그 대신 `<Image>` 컴포넌트를 사용합니다.

```typescript
// ❌ 나쁜 예
<img src={user.image} alt={user.name} />

// ✅ 좋은 예
import Image from 'next/image';

<Image 
  src={user.image} 
  alt={user.name}
  width={100}
  height={100}
/>

// ✅ 좋은 예 - fill 사용
<div className="relative w-full h-64">
  <Image 
    src={product.image} 
    alt={product.name}
    fill
    className="object-cover"
  />
</div>
```

#### 4.3.2 원격 이미지 도메인 설정

외부 이미지는 `next.config.ts`에 도메인을 추가합니다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

### 4.4 메타데이터

#### 4.4.1 정적 메타데이터

```typescript
// ✅ 좋은 예
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MES 시스템 - 제품 관리',
  description: '제조 실행 시스템의 제품 관리 페이지',
};

export default function ProductsPage() {
  return <div>...</div>;
}
```

---

## 5. CSS 및 스타일링

### 5.1 Tailwind CSS

#### 5.1.1 클래스 순서

일관된 순서로 클래스를 작성합니다.

```typescript
// ✅ 좋은 예 - 순서: 레이아웃 > 박스모델 > 타이포그래피 > 비주얼 > 기타
<div className="
  flex items-center justify-between
  p-4 m-2
  text-lg font-bold
  bg-white border rounded-lg shadow
  hover:bg-gray-50 transition-colors
">
  Content
</div>
```

#### 5.1.2 커스텀 클래스 최소화

가능한 Tailwind 유틸리티 클래스를 사용합니다.

```typescript
// ❌ 나쁜 예
<div className="custom-card">...</div>

// styles.css
.custom-card {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
}

// ✅ 좋은 예
<div className="p-4 bg-white rounded-lg">...</div>
```

#### 5.1.3 조건부 클래스

`clsx` 또는 유사한 라이브러리를 사용합니다.

```typescript
// ✅ 좋은 예
import clsx from 'clsx';

<button className={clsx(
  'px-4 py-2 rounded',
  isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Click me
</button>
```

### 5.2 반응형 디자인

#### 5.2.1 모바일 우선

모바일 먼저 스타일링하고 점진적으로 확장합니다.

```typescript
// ✅ 좋은 예
<div className="
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

---

## 6. 데이터베이스 및 API

### 6.1 SQL 쿼리

#### 6.1.1 파라미터화된 쿼리

SQL Injection을 방지하기 위해 항상 파라미터를 사용합니다.

```typescript
// ❌ 나쁜 예 - SQL Injection 위험
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 좋은 예
const query = `SELECT * FROM users WHERE id = @userId`;
const result = await executeQuery(query, { userId });
```

#### 6.1.2 쿼리 타입 정의

쿼리 결과의 타입을 명확히 정의합니다.

```typescript
// ✅ 좋은 예
interface UserRow {
  id: number;
  account: string;
  name: string;
  email: string;
  createdAt: string;
}

const query = `
  SELECT 
    id, 
    account, 
    name, 
    email,
    FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt
  FROM users
`;

const result = await executeQuery(query);
const users = result as unknown as UserRow[];
```

### 6.2 에러 핸들링

#### 6.2.1 데이터베이스 에러

데이터베이스 에러는 적절히 처리하고 사용자에게 친화적인 메시지를 제공합니다.

```typescript
// ✅ 좋은 예
try {
  await executeNonQuery(insertQuery, params);
} catch (error: unknown) {
  console.error('사용자 추가 에러:', error);
  
  // 중복 키 에러 (SQL Server: 2627)
  if ((error as { number?: number })?.number === 2627) {
    return NextResponse.json({
      success: false,
      message: '이미 존재하는 사용자 계정입니다.',
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: false,
    error: (error as Error).message || 'Unknown error'
  }, { status: 500 });
}
```

### 6.3 API 호출

#### 6.3.1 에러 처리

API 호출 시 에러를 적절히 처리합니다.

```typescript
// ✅ 좋은 예
const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/mes/users');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch users');
    }
    
    return data.data;
  } catch (error: unknown) {
    console.error('❌ Failed to fetch users:', error);
    throw error;
  }
};
```

---

## 7. 상태 관리

### 7.1 Zustand 패턴

#### 7.1.1 Store 구조

```typescript
// ✅ 좋은 예
export const useUsersStore = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mes/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const addUser = async (user: Omit<User, 'id'>): Promise<void> => {
    // ...
    await fetchUsers(); // 자동 새로고침
  };
  
  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
  };
};
```

#### 7.1.2 Store 사용

```typescript
// ✅ 좋은 예
export default function UsersList() {
  const { users, loading, fetchUsers } = useUsersStore();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {users.map((user: User) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

---

## 8. 파일 및 폴더 구조

### 8.1 폴더 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── basic-info/        # 기본정보 페이지
│   ├── production/        # 생산 페이지
│   ├── layout.tsx
│   └── page.tsx
├── components/            # 재사용 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── layouts/          # 레이아웃 컴포넌트
│   └── features/         # 기능별 컴포넌트
├── lib/                   # 유틸리티 및 헬퍼
│   ├── db.ts             # 데이터베이스 연결
│   ├── db-queries.ts     # 쿼리 함수
│   └── utils.ts          # 유틸리티 함수
├── store/                 # 상태 관리
│   ├── authStore.ts
│   └── dataStore.ts
└── types/                 # TypeScript 타입 정의
    ├── database.ts
    └── api.ts
```

### 8.2 파일 명명

- **컴포넌트**: PascalCase (e.g., `UserProfile.tsx`)
- **유틸리티**: camelCase (e.g., `formatDate.ts`)
- **타입**: camelCase (e.g., `user.types.ts`)
- **스토어**: camelCase (e.g., `authStore.ts`)

---

## 9. 명명 규칙

### 9.1 변수명

#### 9.1.1 일반 변수

```typescript
// ✅ 좋은 예
const userName = 'John';
const totalPrice = 100;
const isActive = true;
const hasPermission = false;
```

#### 9.1.2 Boolean 변수

`is`, `has`, `can`, `should` 접두사를 사용합니다.

```typescript
// ✅ 좋은 예
const isLoading = true;
const hasError = false;
const canEdit = true;
const shouldUpdate = false;
```

### 9.2 함수명

#### 9.2.1 동사로 시작

```typescript
// ✅ 좋은 예
function fetchUsers(): Promise<User[]> { }
function calculateTotal(items: Item[]): number { }
function validateEmail(email: string): boolean { }
```

#### 9.2.2 이벤트 핸들러

`handle` 접두사를 사용합니다.

```typescript
// ✅ 좋은 예
const handleClick = () => { };
const handleSubmit = () => { };
const handleChange = () => { };
```

### 9.3 상수명

#### 9.3.1 대문자와 언더스코어

```typescript
// ✅ 좋은 예
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 10;
```

#### 9.3.2 설정 객체

```typescript
// ✅ 좋은 예
const CONFIG = {
  API_TIMEOUT: 5000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['jpg', 'png', 'gif'],
} as const;
```

### 9.4 컴포넌트명

#### 9.4.1 PascalCase

```typescript
// ✅ 좋은 예
export default function ProductCard() { }
export default function UserProfile() { }
export default function DataTable() { }
```

---

## 10. 주석 및 문서화

### 10.1 주석 작성

#### 10.1.1 복잡한 로직 설명

```typescript
// ✅ 좋은 예
// BOM 생성 시 해당 시점의 라우팅 정보를 스냅샷으로 저장
// 이는 향후 라우팅이 변경되어도 기존 BOM이 영향받지 않도록 하기 위함
const routingSteps = await executeQuery(
  `SELECT * FROM routing_steps WHERE routing_id = @routingId`,
  { routingId }
);
```

#### 10.1.2 TODO 주석

```typescript
// ✅ 좋은 예
// TODO: 페이지네이션 구현 필요
// FIXME: 성능 이슈 - N+1 쿼리 문제 해결 필요
// NOTE: Azure Blob Storage로 마이그레이션 예정
```

### 10.2 JSDoc

#### 10.2.1 함수 문서화

```typescript
// ✅ 좋은 예
/**
 * 사용자 목록을 조회합니다
 * @param filters - 필터 조건 (선택사항)
 * @returns 사용자 배열을 담은 Promise
 * @throws {Error} 데이터베이스 연결 실패 시
 */
async function fetchUsers(filters?: UserFilters): Promise<User[]> {
  // ...
}
```

#### 10.2.2 복잡한 타입 문서화

```typescript
// ✅ 좋은 예
/**
 * 작업지시 데이터
 * @property orderCode - 고유한 작업지시 코드
 * @property status - 작업 상태 (대기/진행중/완료/보류)
 * @property bomSnapshot - BOM 스냅샷 (작업지시 생성 시점의 BOM 데이터)
 */
interface WorkOrder {
  orderCode: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  bomSnapshot: BOMSnapshot;
}
```

---

## 11. 에러 처리

### 11.1 try-catch

#### 11.1.1 unknown 타입 사용

```typescript
// ✅ 좋은 예
try {
  await riskyOperation();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

#### 11.1.2 에러 로깅

```typescript
// ✅ 좋은 예
try {
  await updateUser(userId, userData);
} catch (error: unknown) {
  console.error('❌ Failed to update user:', {
    userId,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw error; // 상위로 에러 전파
}
```

### 11.2 커스텀 에러

#### 11.2.1 에러 클래스 정의

```typescript
// ✅ 좋은 예
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// 사용
throw new ValidationError('Invalid email format', 'email');
```

---

## 12. 테스트

### 12.1 단위 테스트

#### 12.1.1 테스트 작성 (향후 도입 예정)

```typescript
// ✅ 좋은 예
describe('calculateTotal', () => {
  it('should calculate total price correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(250);
  });
  
  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

---

## 13. 성능 최적화

### 13.1 React 최적화

#### 13.1.1 불필요한 리렌더링 방지

```typescript
// ✅ 좋은 예
import { memo } from 'react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = memo(({ product }: ProductCardProps) => {
  return <div>{product.name}</div>;
});

ProductCard.displayName = 'ProductCard';
```

#### 13.1.2 Key prop 사용

```typescript
// ❌ 나쁜 예
{items.map((item, index) => <Item key={index} item={item} />)}

// ✅ 좋은 예
{items.map((item: Item) => <Item key={item.id} item={item} />)}
```

### 13.2 데이터베이스 최적화

#### 13.2.1 필요한 컬럼만 조회

```typescript
// ❌ 나쁜 예
SELECT * FROM products;

// ✅ 좋은 예
SELECT id, code, name, price, status FROM products WHERE status = 'active';
```

#### 13.2.2 인덱스 활용

```sql
-- ✅ 좋은 예
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_users_account ON users(account);
```

---

## 14. 보안

### 14.1 인증 및 권한

#### 14.1.1 권한 체크

```typescript
// ✅ 좋은 예
export default function ProductEditButton({ product }: { product: Product }) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('PRODUCTS_EDIT')) {
    return null;
  }
  
  return <button>Edit</button>;
}
```

### 14.2 입력 검증

#### 14.2.1 클라이언트 사이드

```typescript
// ✅ 좋은 예
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateEmail(email)) {
    setError('유효하지 않은 이메일 형식입니다.');
    return;
  }
  
  // submit...
};
```

#### 14.2.2 서버 사이드

```typescript
// ✅ 좋은 예
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // 입력 검증
  if (!body.email || !validateEmail(body.email)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid email format'
    }, { status: 400 });
  }
  
  // 처리...
}
```

### 14.3 XSS 방지

#### 14.3.1 사용자 입력 이스케이프

```typescript
// ✅ 좋은 예 - React는 기본적으로 이스케이프 처리
<div>{user.name}</div>

// ⚠️ 주의 - dangerouslySetInnerHTML 사용 시
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(htmlContent) 
}} />
```

---

## 15. Git 커밋 규칙

### 15.1 커밋 메시지 형식

```
<type>: <subject>

<body>

<footer>
```

### 15.2 Type

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 도구 변경

### 15.3 예시

```bash
# ✅ 좋은 예
feat: Add user authentication

Implement JWT-based authentication for user login
- Add login API endpoint
- Create auth middleware
- Update user store with auth state

Closes #123

# ✅ 좋은 예
fix: Resolve image upload error in products page

The image upload was failing due to incorrect content-type header.
Fixed by setting proper multipart/form-data encoding.

# ✅ 좋은 예
docs: Update API documentation for work orders

# ✅ 좋은 예
refactor: Improve database query performance in BOM page

Optimized N+1 query issue by using JOIN instead of multiple queries
```

### 15.4 브랜치 전략

```bash
main            # 프로덕션 브랜치
├── develop     # 개발 브랜치
    ├── feature/user-auth      # 기능 브랜치
    ├── feature/bom-snapshot   # 기능 브랜치
    ├── bugfix/image-upload    # 버그 수정 브랜치
    └── hotfix/security-patch  # 긴급 수정 브랜치
```

---

## 📝 체크리스트

코드 작성 전 확인 사항:

- [ ] `any` 타입 사용 금지
- [ ] 모든 함수에 반환 타입 명시
- [ ] 배열 메소드 콜백에 타입 명시
- [ ] React Hooks 의존성 배열 완전성
- [ ] `<img>` 대신 `<Image>` 사용
- [ ] SQL 쿼리 파라미터화
- [ ] 에러 핸들링 (unknown 타입)
- [ ] 사용하지 않는 변수/import 제거
- [ ] ESLint 경고 수정
- [ ] 적절한 주석 작성
- [ ] 커밋 메시지 규칙 준수

---

## 🔗 참고 자료

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [SQL Best Practices](https://learn.microsoft.com/en-us/sql/)

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2025-10-11  
**작성자**: MES Development Team

이 코딩 표준은 프로젝트의 성장과 함께 지속적으로 업데이트됩니다.


# MES 시스템 기술 아키텍처

## 📋 프로젝트 개요

제조 실행 시스템(Manufacturing Execution System)을 위한 풀스택 웹 애플리케이션입니다. 생산 계획, 작업 지시, BOM(Bill of Materials), 라우팅 관리 등 제조 현장의 핵심 업무를 지원합니다.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand (커스텀 구현)
- **Data Fetching**: TanStack React Query 5.90.2
- **Build Tool**: Turbopack (Next.js 내장)
- **Excel Export**: xlsx 0.18.5

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **Database**: Azure SQL Database
- **Database Driver**: mssql 12.0.0, tedious 19.0.0
- **File Storage**: Azure Blob Storage (@azure/storage-blob 12.28.0)

### Development Tools
- **Linter**: ESLint 9.x
- **CSS Framework**: Tailwind CSS 4.x with PostCSS
- **Type Checking**: TypeScript strict mode

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 (React 19)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Pages      │  │  Components  │  │   Stores    │ │ │
│  │  │  (App Dir)   │  │  (UI Layer)  │  │  (Zustand)  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         │                  │                 │         │ │
│  │         └──────────────────┴─────────────────┘         │ │
│  │                          │                              │ │
│  │                 ┌────────▼────────┐                    │ │
│  │                 │  React Query    │                    │ │
│  │                 │  (Data Cache)   │                    │ │
│  │                 └────────┬────────┘                    │ │
│  └──────────────────────────┼─────────────────────────────┘ │
└────────────────────────────┼───────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼───────────────────────────────┐
│                    Next.js Server                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  API Routes                           │  │
│  │  /api/mes/*  (MES 업무 로직)                          │  │
│  │  /api/upload-image  (이미지 업로드)                   │  │
│  │  /api/test-connection  (DB 연결 테스트)               │  │
│  └────────────┬─────────────────────┬────────────────────┘  │
└───────────────┼─────────────────────┼───────────────────────┘
                │                     │
        ┌───────▼────────┐    ┌──────▼────────┐
        │  Database      │    │  Blob Storage │
        │  (Azure SQL)   │    │   (Azure)     │
        │                │    │               │
        │  - Users       │    │  - Product    │
        │  - Products    │    │    Images     │
        │  - Materials   │    │  - Material   │
        │  - BOMs        │    │    Images     │
        │  - Routings    │    │  - User       │
        │  - Work Orders │    │    Avatars    │
        │  - etc...      │    │               │
        └────────────────┘    └───────────────┘
```

## 📁 프로젝트 구조

```
test-db/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (sections)/              # 동적 섹션 라우트
│   │   ├── api/                     # API Routes
│   │   │   ├── mes/                 # MES 관련 API
│   │   │   │   ├── boms/           # BOM 관리
│   │   │   │   ├── customers/      # 거래처 관리
│   │   │   │   ├── departments/    # 부서 관리
│   │   │   │   ├── equipments/     # 설비 관리
│   │   │   │   ├── lines/          # 라인 관리
│   │   │   │   ├── login/          # 로그인
│   │   │   │   ├── materials/      # 자재 관리
│   │   │   │   ├── processes/      # 공정 관리
│   │   │   │   ├── products/       # 제품 관리
│   │   │   │   ├── roles/          # 역할 관리
│   │   │   │   ├── routings/       # 라우팅 관리
│   │   │   │   ├── users/          # 사용자 관리
│   │   │   │   └── work-orders/    # 작업지시 관리
│   │   │   ├── upload-image/       # 이미지 업로드
│   │   │   └── test-connection/    # DB 연결 테스트
│   │   ├── basic-info/              # 기본정보 페이지
│   │   │   ├── bom/                # BOM 관리
│   │   │   ├── customers/          # 거래처 관리
│   │   │   ├── departments/        # 부서 관리
│   │   │   ├── equipments/         # 설비 관리
│   │   │   ├── lines/              # 라인 관리
│   │   │   ├── materials/          # 자재 관리
│   │   │   ├── processes/          # 공정 관리
│   │   │   ├── products/           # 제품 관리
│   │   │   ├── roles/              # 역할 관리
│   │   │   ├── routings/           # 라우팅 관리
│   │   │   ├── users/              # 사용자 관리
│   │   │   └── warehouses/         # 창고 관리
│   │   ├── production/              # 생산 관리 페이지
│   │   │   ├── plan/               # 생산 계획
│   │   │   └── work-order/         # 작업 지시
│   │   ├── login/                   # 로그인 페이지
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   ├── page.tsx                 # 홈페이지
│   │   └── globals.css              # 전역 스타일
│   ├── components/                   # React 컴포넌트
│   │   ├── LayoutClient.tsx         # 클라이언트 레이아웃
│   │   ├── Sidebar.tsx              # 사이드바
│   │   ├── TabBar.tsx               # 탭 바
│   │   └── Topbar.tsx               # 상단바
│   ├── lib/                          # 유틸리티 라이브러리
│   │   ├── db.ts                    # 데이터베이스 연결
│   │   ├── db-queries.ts            # 쿼리 실행 함수
│   │   ├── azure-storage.ts         # Azure Blob Storage
│   │   ├── permissions.ts           # 권한 관리
│   │   └── react-query-provider.tsx # React Query 설정
│   ├── store/                        # 상태 관리
│   │   ├── authStore.ts             # 인증 상태
│   │   ├── dataStore.ts             # 데이터 스토어 (레거시)
│   │   └── dataStore-optimized.ts   # 최적화된 데이터 스토어
│   ├── types/                        # TypeScript 타입 정의
│   │   └── database.ts              # 데이터베이스 타입
│   └── actions/                      # Server Actions
│       ├── product-actions.ts       # 제품 액션
│       └── user-actions.ts          # 사용자 액션
├── public/                           # 정적 파일
├── .cursorrules                      # 프로젝트 코딩 규칙
├── eslint.config.mjs                 # ESLint 설정
├── next.config.ts                    # Next.js 설정
├── tsconfig.json                     # TypeScript 설정
├── tailwind.config.ts                # Tailwind CSS 설정
└── package.json                      # 패키지 의존성
```

## 🔑 핵심 기능

### 1. 사용자 인증 및 권한 관리
- **세션 기반 인증**: 로그인 후 15분 타이머 (연장 가능)
- **역할 기반 접근 제어(RBAC)**: 역할별 권한 설정
- **권한**: VIEW, EDIT, DELETE 등 세분화된 권한
- **로그인 이력**: 사용자별 로그인 기록 추적

### 2. 기본 정보 관리
- **제품 관리**: 제품 코드, 이름, 카테고리, 이미지, 사양
- **자재 관리**: 자재 코드, 이름, 규격, 단가, 공급업체
- **거래처 관리**: 공급업체, 고객사, 협력업체
- **설비 관리**: 설비 정보, 상태, 관리자
- **라인 관리**: 생산 라인 정보, 용량
- **공정 관리**: 공정 정보, 표준 작업 시간
- **BOM 관리**: 제품별 자재 명세서, 리비전 관리
- **라우팅 관리**: 공정 순서, 작업 단계

### 3. 생산 관리
- **생산 계획**: 계획 수립, 진행 상태 추적
- **작업 지시**: 생산 계획 기반 작업 지시 생성
- **BOM 스냅샷**: 작업 지시 시점의 BOM 데이터 저장
- **라우팅 스냅샷**: 작업 지시 시점의 라우팅 데이터 저장

### 4. 데이터 시각화 및 Export
- **Excel 내보내기**: 모든 데이터 테이블 Excel 다운로드 지원
- **실시간 검색 및 필터링**: 클라이언트 사이드 필터링
- **상태별 필터**: 활성/비활성, 진행 상태별 조회

## 🗄 데이터베이스 구조

### 주요 테이블

#### 1. 사용자 및 권한
- `users`: 사용자 정보
- `roles`: 역할 정의
- `role_permissions`: 역할별 권한
- `departments`: 부서 정보
- `login_history`: 로그인 이력

#### 2. 제품 및 자재
- `products`: 제품 마스터
- `materials`: 자재 마스터
- `customers`: 거래처 정보

#### 3. 생산 관련
- `lines`: 생산 라인
- `equipments`: 설비 정보
- `processes`: 공정 정보
- `routings`: 라우팅 마스터
- `routing_steps`: 라우팅 상세 단계
- `boms`: BOM 마스터
- `bom_items`: BOM 자재 구성
- `bom_routing_steps`: BOM별 라우팅 스냅샷

#### 4. 작업 관리
- `production_plans`: 생산 계획
- `work_orders`: 작업 지시
- `work_order_routing_steps`: 작업지시별 라우팅 스냅샷
- `work_order_materials`: 작업지시별 자재 스냅샷
- `warehouses`: 창고 정보

## 🔄 상태 관리 아키텍처

### Zustand 기반 스토어 패턴

```typescript
// 각 도메인별 독립적인 스토어
- useUsersStore: 사용자 관리
- useProductsStore: 제품 관리
- useMaterialsStore: 자재 관리
- useBOMsStore: BOM 관리
- useRoutingsStore: 라우팅 관리
- useWorkOrdersStore: 작업지시 관리
- useProductionPlansStore: 생산계획 관리
- useAuthStore: 인증 상태 관리
```

### 특징
- **도메인 분리**: 각 비즈니스 도메인별 독립 스토어
- **CRUD 통합**: 각 스토어에 fetch, add, update, delete 메서드 포함
- **자동 새로고침**: 데이터 변경 시 자동 재조회
- **에러 핸들링**: 중앙 집중식 에러 처리
- **타입 안전성**: TypeScript 완전 지원

## 🌐 API 구조

### RESTful API Pattern

#### Endpoint Convention
```
GET    /api/mes/{resource}        # 목록 조회
POST   /api/mes/{resource}        # 생성
PUT    /api/mes/{resource}        # 수정
DELETE /api/mes/{resource}        # 삭제
```

#### Response Format
```typescript
// 성공 응답
{
  success: true,
  data: [...],
  count?: number
}

// 에러 응답
{
  success: false,
  error: string,
  message?: string
}
```

### API Routes
```
/api/mes/
├── boms/              # BOM CRUD + 아이템 저장
├── customers/         # 거래처 CRUD
├── departments/       # 부서 CRUD
├── equipments/        # 설비 CRUD
├── lines/             # 라인 CRUD
├── login/             # 로그인 인증
├── logout/            # 로그아웃
├── login-history/     # 로그인 이력 조회
├── materials/         # 자재 CRUD
├── processes/         # 공정 CRUD
├── products/          # 제품 CRUD
├── production-plans/  # 생산계획 CRUD
├── roles/             # 역할 CRUD
├── routings/          # 라우팅 CRUD + 단계 저장
├── users/             # 사용자 CRUD
├── warehouses/        # 창고 CRUD
└── work-orders/       # 작업지시 CRUD + 스냅샷 생성
```

## 🔐 보안 아키텍처

### 인증 (Authentication)
- **세션 기반**: 로그인 시 세션 정보를 클라이언트 스토어에 저장
- **타이머**: 15분 자동 로그아웃 (활동 시 연장)
- **비밀번호**: 평문 저장 (프로토타입, 운영 환경에서는 해싱 필요)

### 인가 (Authorization)
- **역할 기반**: 사용자별 역할 할당
- **권한 체크**: 각 페이지/기능별 권한 검증
- **세분화된 권한**:
  - `{RESOURCE}_VIEW`: 조회 권한
  - `{RESOURCE}_EDIT`: 수정 권한
  - `{RESOURCE}_DELETE`: 삭제 권한
  - `ALL`: 전체 권한

### 데이터 검증
- **클라이언트 사이드**: 실시간 입력 검증
- **서버 사이드**: API 레벨 데이터 검증
- **중복 체크**: 코드, 계정 등 유니크 제약 조건 검증

## 💾 데이터 흐름

### 1. 데이터 조회 (Read)
```
UI Component
    ↓ (초기 렌더링)
Store.fetch()
    ↓ (fetchAPI 호출)
API Route (/api/mes/*)
    ↓ (executeQuery)
Azure SQL Database
    ↓ (결과 반환)
Store 상태 업데이트
    ↓ (리렌더링)
UI 업데이트
```

### 2. 데이터 생성/수정 (Create/Update)
```
UI Form Submit
    ↓ (검증)
Store.add() / Store.update()
    ↓ (fetchAPI POST/PUT)
API Route
    ↓ (executeNonQuery)
Azure SQL Database
    ↓ (성공)
Store.fetch() (자동 새로고침)
    ↓
UI 업데이트 + 알림
```

### 3. 이미지 업로드
```
File Input
    ↓ (파일 선택)
FormData 생성
    ↓ (POST /api/upload-image)
API Route
    ↓ (Azure SDK)
Azure Blob Storage
    ↓ (URL 반환)
DB에 URL 저장
    ↓ (Next.js Image)
이미지 표시
```

## 🎨 UI/UX 아키텍처

### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│              Topbar                      │ 56px
│  (로고, 사용자 정보, 타이머)             │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │     Main Content             │
│          │                              │
│ (메뉴)   │  ┌────────────────────────┐  │
│          │  │  Page Content          │  │
│ 240px    │  │  (기본정보/생산관리)   │  │
│          │  └────────────────────────┘  │
│          │                              │
└──────────┴──────────────────────────────┘
│              TabBar (Mobile)             │
└─────────────────────────────────────────┘
```

### 디자인 시스템
- **컬러 팔레트**: Tailwind CSS 기본 팔레트 활용
- **타이포그래피**: 시스템 폰트 스택
- **반응형**: Desktop-first (모바일 TabBar 포함)
- **다크 모드**: 미지원 (향후 추가 가능)

## 🚀 성능 최적화

### 1. Next.js 최적화
- **Turbopack**: 빠른 빌드 및 개발 서버
- **App Router**: 서버 컴포넌트 활용 (SSR/SSG)
- **Image Optimization**: `next/image` 사용
- **Code Splitting**: 자동 페이지별 코드 분할

### 2. 데이터베이스 최적화
- **인덱스**: 주요 검색 컬럼에 인덱스 설정
- **쿼리 최적화**: 필요한 컬럼만 SELECT
- **연결 풀링**: mssql 드라이버 내장 풀링

### 3. 클라이언트 최적화
- **React Query**: 서버 상태 캐싱 및 자동 재검증
- **메모이제이션**: 불필요한 리렌더링 방지
- **Lazy Loading**: 이미지 지연 로딩

## 📦 빌드 및 배포

### 빌드 프로세스
```bash
npm run build  # 프로덕션 빌드 (Turbopack)
npm run start  # 프로덕션 서버 시작
```

### 환경 변수 (.env.local)
```bash
# Azure SQL Database
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-password

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=your-account
AZURE_STORAGE_ACCOUNT_KEY=your-key
AZURE_STORAGE_CONTAINER_NAME=mes-images
```

### 배포 플랫폼
- **권장**: Vercel (Next.js 최적 지원)
- **대안**: Azure App Service, AWS Amplify, Docker

## 🔧 개발 워크플로우

### 1. 로컬 개발
```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (Turbopack)
```

### 2. 코드 품질
- **ESLint**: 코드 스타일 및 품질 검사
- **TypeScript**: 컴파일 타임 타입 체크
- **.cursorrules**: 프로젝트 코딩 규칙 준수

### 3. Git 워크플로우
```bash
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
```

## 🧩 주요 디자인 패턴

### 1. Repository Pattern
```typescript
// lib/db-queries.ts
export async function executeQuery(query: string, params?: Record<string, unknown>) {
  // 데이터베이스 쿼리 실행
}
```

### 2. Store Pattern (Flux-like)
```typescript
// store/dataStore-optimized.ts
export const useProductsStore = () => {
  const [products, setProducts] = useState([]);
  
  const fetchProducts = async () => { /* ... */ };
  const addProduct = async (product) => { /* ... */ };
  const updateProduct = async (id, product) => { /* ... */ };
  const deleteProduct = async (id) => { /* ... */ };
  
  return { products, fetchProducts, addProduct, updateProduct, deleteProduct };
};
```

### 3. Snapshot Pattern
- **BOM 스냅샷**: BOM 생성 시 라우팅 단계를 `bom_routing_steps`에 복사
- **작업지시 스냅샷**: 작업지시 생성 시 BOM 및 라우팅을 복사

### 4. HOC Pattern (Layout)
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
```

## 🔍 타입 안전성

### TypeScript 설정
- **Strict Mode**: 모든 strict 옵션 활성화
- **any 금지**: `unknown` 타입 사용 권장
- **타입 단언**: 필요 시 안전한 타입 단언 사용

### 타입 정의 예시
```typescript
// types/database.ts
export interface Product {
  id: number;
  code: string;
  name: string;
  category: "완제품" | "반제품" | "부품" | "원재료";
  specification: string;
  unit: string;
  salePrice: number;
  image: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt: string;
}
```

## 🌟 특수 기능

### 1. BOM 리비전 관리
- 자동 리비전 번호 생성 (REV001, REV002, ...)
- 최신 리비전 자동 조회
- 리비전별 라우팅 단계 스냅샷

### 2. 작업지시 자동화
- 생산계획 기반 작업지시 생성
- 제품별 최신 BOM 자동 연결
- BOM 데이터 스냅샷 (라우팅, 자재)
- 생산계획 상태 자동 업데이트

### 3. 이미지 관리
- Azure Blob Storage 연동
- Next.js Image 컴포넌트 최적화
- 이미지 업로드 및 삭제
- 실패 시 Fallback 이미지

## 📊 성능 지표

### 목표
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Lighthouse Score**: > 90

### 최적화 전략
- 서버 컴포넌트 활용 (데이터 미리 가져오기)
- 이미지 최적화 (next/image)
- 코드 스플리팅 (페이지별 자동)
- 데이터 캐싱 (React Query)

## 🔄 업그레이드 경로

### 현재 버전
- Next.js 15.5.4
- React 19.1.0
- TypeScript 5.x

### 향후 고려사항
- **인증**: NextAuth.js 또는 Clerk 도입
- **ORM**: Prisma 또는 Drizzle 도입 고려
- **실시간**: WebSocket 또는 SignalR 추가
- **테스트**: Jest, React Testing Library 도입
- **CI/CD**: GitHub Actions 설정
- **모니터링**: Sentry, LogRocket 등

## 📝 코딩 규칙

프로젝트는 `.cursorrules` 파일에 정의된 코딩 규칙을 따릅니다:

- ✅ `any` 타입 금지, `unknown` 사용
- ✅ `next/image` 사용 (img 태그 금지)
- ✅ Array 메소드 콜백 타입 명시
- ✅ React Hooks 의존성 배열 완전성
- ✅ 사용하지 않는 변수/import 제거
- ✅ ESLint 경고 즉시 수정

자세한 내용은 `.cursorrules` 파일을 참조하세요.

## 🐛 디버깅 및 모니터링

### 개발 도구
- **React Query Devtools**: 서버 상태 모니터링
- **Console Logging**: 주요 작업 로깅 (✅, ❌ 이모지 사용)
- **Next.js Dev Overlay**: 빌드 에러 및 경고 표시

### 로깅 패턴
```typescript
console.log('✅ 성공:', data);
console.error('❌ 실패:', error);
console.log('📋 정보:', info);
console.log('⚠️ 경고:', warning);
```

## 📚 관련 문서

- `QUICK_START.md`: 빠른 시작 가이드
- `SETUP_GUIDE.md`: 초기 설정 가이드
- `AZURE_SQL_GUIDE.md`: Azure SQL 설정
- `AZURE_BLOB_STORAGE_SETUP.md`: Azure Blob 설정
- `BOM_ROUTING_SNAPSHOT_GUIDE.md`: BOM 스냅샷 가이드
- `WORK_ORDER_SNAPSHOT_GUIDE.md`: 작업지시 스냅샷 가이드
- `PERFORMANCE_OPTIMIZATION_GUIDE.md`: 성능 최적화
- `PERMISSIONS_UPDATE_GUIDE.md`: 권한 관리

## 🎯 베스트 프랙티스

### 1. 컴포넌트 작성
- 단일 책임 원칙 준수
- Props 타입 명시
- 재사용 가능한 컴포넌트 설계

### 2. API 작성
- 에러 핸들링 철저히
- 타입 안전성 보장
- 트랜잭션 처리 (필요 시)

### 3. 상태 관리
- 최소한의 상태 유지
- 파생 상태는 계산으로 처리
- 불필요한 리렌더링 방지

### 4. 데이터베이스
- 파라미터화된 쿼리 사용 (SQL Injection 방지)
- 인덱스 활용
- N+1 쿼리 문제 주의

## 🔮 향후 개선 사항

### 단기 (1-3개월)
- [ ] 비밀번호 해싱 (bcrypt)
- [ ] JWT 기반 인증
- [ ] 실시간 알림 시스템
- [ ] 대시보드 추가

### 중기 (3-6개월)
- [ ] 생산 실적 관리
- [ ] 품질 관리 모듈
- [ ] 재고 관리 통합
- [ ] 보고서 생성 기능

### 장기 (6-12개월)
- [ ] 모바일 앱 (React Native)
- [ ] AI 기반 생산 최적화
- [ ] IoT 설비 연동
- [ ] 실시간 모니터링 대시보드

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2025-10-11  
**작성자**: MES Development Team


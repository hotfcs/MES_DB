# 🏭 MES 시스템 API 가이드

## ✅ 완료된 작업

1. ✅ **환경 변수 설정** (.env.local)
2. ✅ **데이터베이스 스키마 설계** (18개 테이블)
3. ✅ **SQL 생성 스크립트** (setup-mes-database.sql)
4. ✅ **주요 API 생성** (6개 엔드포인트)

## 📋 다음 단계 (중요!)

### 1단계: Azure Portal에서 데이터베이스 생성

1. [Azure Portal](https://portal.azure.com) 접속
2. SQL Server (`hotfcs-sql-server`) 선택
3. **+ Create database** 클릭
4. 데이터베이스 이름: **mes_db** 입력
5. **Create** 클릭

### 2단계: SQL 스크립트 실행

1. Azure Portal에서 `mes_db` 데이터베이스 선택
2. **Query editor** 클릭
3. 로그인:
   - Login: `sqladmin`
   - Password: `qlalfqjsgh1234!@#$`
4. `setup-mes-database.sql` 파일 내용 복사 & 실행
5. 성공 메시지 확인

### 3단계: 환경 변수 업데이트

`.env.local` 파일 수정:
```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=mes_db
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=qlalfqjsgh1234!@#$
```

### 4단계: 개발 서버 재시작

```bash
# Ctrl+C로 중지 후
npm run dev
```

### 5단계: API 테스트

```bash
# 연결 테스트
curl http://localhost:3000/api/test-connection

# 사용자 목록 조회
curl http://localhost:3000/api/mes/users

# 로그인 테스트
curl -X POST http://localhost:3000/api/mes/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"admin123"}'
```

## 📚 생성된 API 목록

### 1. 인증 API

#### 로그인
```
POST /api/mes/login
Body: { "account": "admin", "password": "admin123" }
```

#### 로그아웃
```
POST /api/mes/logout
Body: { "userId": 1, "account": "admin", "name": "관리자" }
```

#### 로그인 이력
```
GET /api/mes/login-history
Query: ?userId=1&action=login&startDate=2024-01-01&limit=100
```

### 2. 사용자 API

#### 목록 조회
```
GET /api/mes/users
Query: ?status=active&department=IT팀&search=김철수
```

#### 추가
```
POST /api/mes/users
Body: {
  "account": "user01",
  "password": "pass123",
  "name": "홍길동",
  "role": "사용자",
  "department": "생산팀",
  "position": "대리",
  "phone": "010-1234-5678",
  "email": "hong@company.com",
  "status": "active"
}
```

#### 수정
```
PUT /api/mes/users
Body: {
  "id": 1,
  "name": "홍길동2",
  "phone": "010-9999-9999"
}
```

#### 삭제
```
DELETE /api/mes/users?id=1
```

### 3. 제품 API

#### 목록 조회
```
GET /api/mes/products
Query: ?status=active&category=제품&search=노트북
```

#### 추가
```
POST /api/mes/products
Body: {
  "code": "PRD001",
  "name": "노트북",
  "category": "제품",
  "specification": "15인치",
  "unit": "EA",
  "standardCost": 1000000,
  "sellingPrice": 1500000,
  "customer": "삼성전자",
  "description": "15인치 노트북",
  "status": "active"
}
```

#### 수정
```
PUT /api/mes/products
Body: {
  "id": 1,
  "sellingPrice": 1600000,
  "status": "active"
}
```

#### 삭제
```
DELETE /api/mes/products?id=1
```

### 4. 작업지시 API

#### 목록 조회
```
GET /api/mes/work-orders
Query: ?status=진행중&startDate=2024-01-01&search=WO-2024
```

#### 추가
```
POST /api/mes/work-orders
Body: {
  "orderCode": "WO-20240101-001",
  "orderDate": "2024-01-01",
  "planCode": "PLAN-001",
  "productCode": "PRD001",
  "productName": "노트북",
  "orderQuantity": 100,
  "unit": "EA",
  "line": "1호기",
  "startDate": "2024-01-02",
  "endDate": "2024-01-05",
  "status": "대기",
  "worker": "김철수",
  "note": "긴급 주문"
}
```

#### 수정
```
PUT /api/mes/work-orders
Body: {
  "id": 1,
  "status": "진행중",
  "worker": "이영희"
}
```

#### 삭제
```
DELETE /api/mes/work-orders?id=1
```

## 🗄️ 데이터베이스 구조

### 주요 테이블 (18개)

1. **users** - 사용자
2. **departments** - 부서
3. **roles** - 역할/권한
4. **login_history** - 로그인 이력
5. **customers** - 고객사
6. **products** - 제품
7. **materials** - 자재
8. **lines** - 생산라인
9. **equipments** - 설비
10. **processes** - 공정
11. **routings** - 라우팅
12. **routing_steps** - 라우팅 단계
13. **boms** - BOM
14. **bom_items** - BOM 아이템
15. **warehouses** - 창고
16. **production_plans** - 생산계획
17. **work_orders** - 작업지시
18. **production_results** - 생산실적

## 📁 파일 구조

```
src/
└── app/
    └── api/
        ├── test-connection/       # 연결 테스트
        └── mes/
            ├── users/             # 사용자 CRUD
            ├── login/             # 로그인
            ├── logout/            # 로그아웃
            ├── login-history/     # 로그인 이력
            ├── products/          # 제품 CRUD
            └── work-orders/       # 작업지시 CRUD
```

## 🔒 보안

- ✅ SQL Injection 방지 (파라미터 바인딩)
- ✅ 환경 변수로 민감 정보 관리
- ⚠️ 프로덕션에서는 JWT 인증 추가 권장

## 🚀 추가 API 개발

필요한 경우 다음 API들을 추가로 개발할 수 있습니다:

- `/api/mes/materials` - 자재 관리
- `/api/mes/lines` - 생산라인 관리
- `/api/mes/processes` - 공정 관리
- `/api/mes/production-plans` - 생산계획 관리
- `/api/mes/production-results` - 생산실적 관리
- `/api/mes/boms` - BOM 관리
- `/api/mes/warehouses` - 창고 관리

## 📞 문의

문제가 발생하면:
1. `SETUP_GUIDE.md` 문제 해결 섹션 확인
2. Azure Portal에서 연결 정보 재확인
3. 개발 서버 로그 확인

---

✨ Azure SQL Server + Next.js MES 시스템 준비 완료!


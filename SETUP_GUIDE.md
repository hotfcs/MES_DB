# 🚀 MES 시스템 Azure SQL Server 설정 가이드

## 📋 단계별 설정

### 1단계: Azure Portal에서 데이터베이스 확인

1. [Azure Portal](https://portal.azure.com) 접속
2. **SQL databases** 검색
3. `hotfcs-sql-server` 서버 확인

### 2단계: 데이터베이스 생성 (필요한 경우)

Azure Portal에서:

1. SQL Server 리소스 (`hotfcs-sql-server`) 선택
2. **SQL databases** → **+ Create database** 클릭
3. 데이터베이스 이름: **mes_db** 입력
4. **Review + create** → **Create** 클릭

또는 쿼리로 생성:

```sql
CREATE DATABASE mes_db;
GO
```

### 3단계: 방화벽 규칙 설정

1. SQL Server 리소스로 이동
2. **Security** → **Networking** 클릭
3. **Firewall rules** 섹션에서:
   - **Add your client IPv4 address** 클릭
   - 또는 개발용으로 `0.0.0.0` ~ `255.255.255.255` 추가 (⚠️ 프로덕션에서는 사용하지 마세요!)
4. **Save** 클릭

### 4단계: SQL 스크립트 실행

#### 방법 1: Azure Portal 쿼리 편집기

1. SQL Database (`mes_db`) 리소스로 이동
2. 왼쪽 메뉴에서 **Query editor** 클릭
3. SQL 인증으로 로그인:
   - 로그인: `sqladmin`
   - 비밀번호: `qlalfqjsgh1234!@#$`
4. `setup-mes-database.sql` 파일 내용 복사 & 붙여넣기
5. **Run** 클릭
6. 결과 확인: "✅ MES 데이터베이스 테이블 생성 완료!"

#### 방법 2: SQL Server Management Studio (SSMS)

1. SSMS 실행
2. 서버 연결:
   - 서버 이름: `hotfcs-sql-server.database.windows.net`
   - 인증: SQL Server 인증
   - 로그인: `sqladmin`
   - 비밀번호: `qlalfqjsgh1234!@#$`
3. 데이터베이스 선택: `mes_db`
4. `setup-mes-database.sql` 파일 열기
5. F5 또는 **Execute** 클릭

#### 방법 3: Azure Data Studio

1. Azure Data Studio 실행
2. 새 연결:
   - Connection type: Microsoft SQL Server
   - Server: `hotfcs-sql-server.database.windows.net`
   - Authentication type: SQL Login
   - User name: `sqladmin`
   - Password: `qlalfqjsgh1234!@#$`
   - Database: `mes_db`
3. 연결 후 새 쿼리 창 열기
4. `setup-mes-database.sql` 파일 내용 실행

### 5단계: 환경 변수 업데이트

`.env.local` 파일 수정:

```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=mes_db
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=qlalfqjsgh1234!@#$
```

**⚠️ 주의: 데이터베이스 이름을 실제 생성한 이름으로 변경하세요!**

### 6단계: 개발 서버 재시작

```bash
# 현재 서버 중지 (Ctrl+C)
# 재시작
npm run dev
```

### 7단계: 연결 테스트

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

## 🔧 문제 해결

### 연결 실패 시

#### 1. 방화벽 규칙 확인
```
Error: Failed to connect to...
```
→ Azure Portal에서 방화벽 규칙에 현재 IP 추가

#### 2. 데이터베이스 이름 확인
```
Error: Cannot open database "mes_db"
```
→ Azure Portal에서 실제 데이터베이스 이름 확인 후 `.env.local` 업데이트

#### 3. 인증 실패
```
Error: Login failed for user 'sqladmin'
```
→ Azure Portal에서 로그인 정보 확인 및 비밀번호 재설정

### 데이터베이스 목록 확인

Azure Portal 쿼리 편집기에서 실행:

```sql
-- 모든 데이터베이스 목록
SELECT name FROM sys.databases;

-- 현재 데이터베이스
SELECT DB_NAME() AS CurrentDatabase;
```

### 테이블 확인

```sql
-- 생성된 테이블 목록
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- 테이블 개수
SELECT COUNT(*) AS TableCount
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';
```

## 📊 생성된 테이블 목록 (18개)

1. users - 사용자
2. departments - 부서
3. roles - 역할/권한
4. login_history - 로그인 이력
5. customers - 고객사
6. products - 제품
7. materials - 자재
8. lines - 생산라인
9. equipments - 설비
10. processes - 공정
11. routings - 라우팅
12. routing_steps - 라우팅 단계
13. boms - BOM
14. bom_items - BOM 아이템
15. warehouses - 창고
16. production_plans - 생산계획
17. work_orders - 작업지시
18. production_results - 생산실적

## 🎯 다음 단계

1. ✅ 데이터베이스 생성
2. ✅ 테이블 생성 완료
3. ⏭️ API 생성 및 테스트
4. ⏭️ 기존 코드를 SQL Server로 마이그레이션

---

✨ 설정이 완료되면 API를 사용할 준비가 됩니다!


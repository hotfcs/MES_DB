# 🚨 Azure SQL Server 로그인 실패 해결 가이드

## 현재 에러
```
Login failed for user 'sqladmin'
Code: ELOGIN
```

## 📋 체크리스트

### 1단계: Azure Portal에서 정보 확인

#### A. SQL Server 관리자 계정 확인

1. [Azure Portal](https://portal.azure.com) 접속
2. **SQL servers** 검색
3. `hotfcs-sql-server` 선택
4. 왼쪽 메뉴 **Settings** → **SQL 관리자** 확인

**확인 사항:**
- ✅ 관리자 로그인 이름: `sqladmin`인지 확인
- ✅ SQL 인증이 활성화되어 있는지 확인

#### B. 데이터베이스 이름 확인

1. SQL Server 페이지에서 **SQL databases** 클릭
2. 생성한 데이터베이스 이름 확인 (MES 또는 다른 이름)

### 2단계: 방화벽 규칙 확인

1. SQL Server 페이지 → **Security** → **Networking**
2. **Firewall rules** 섹션 확인

**필수 설정:**
```
옵션 1 (권장): 현재 IP만 허용
- Add your client IPv4 address 클릭

옵션 2 (개발용): 모든 IP 허용 (보안 주의!)
- Rule name: AllowAll
- Start IP: 0.0.0.0
- End IP: 255.255.255.255
```

3. **Save** 클릭 (매우 중요!)

### 3단계: SQL 인증 활성화 확인

1. SQL Server 페이지 → **Settings** → **Azure Active Directory**
2. **Support only Azure Active Directory authentication** 옵션이 **체크 해제**되어 있는지 확인
3. SQL 인증도 허용해야 함

### 4단계: 비밀번호 재설정

비밀번호가 확실하지 않다면 재설정:

1. SQL Server 페이지 → **Settings** → **SQL 관리자**
2. **관리자 암호 재설정** 클릭
3. 새 비밀번호 입력 (예: `NewPassword123!@#`)
4. **저장**

### 5단계: 연결 문자열 테스트

#### 방법 1: Azure Portal Query Editor

1. SQL Database (MES) 선택
2. 왼쪽 메뉴 **Query editor** 클릭
3. 로그인:
   - Authentication type: **SQL Server authentication**
   - Login: `sqladmin`
   - Password: 실제 비밀번호 입력
4. 연결 성공 여부 확인

**연결 성공하면:** 비밀번호가 맞는 것
**연결 실패하면:** 비밀번호 재설정 필요

#### 방법 2: SSMS로 테스트

1. SQL Server Management Studio 실행
2. 연결:
   - Server name: `hotfcs-sql-server.database.windows.net`
   - Authentication: **SQL Server Authentication**
   - Login: `sqladmin`
   - Password: 비밀번호 입력
3. Connect 클릭

## 🔧 해결 방법

### 해결책 1: 환경 변수 재확인

`.env.local` 파일을 열어서 확인:

```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=MES
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=실제비밀번호
```

**주의사항:**
- 비밀번호에 특수문자가 있으면 문제가 될 수 있음
- 공백이나 줄바꿈이 없어야 함
- 따옴표 없이 그대로 입력

### 해결책 2: 비밀번호 특수문자 문제

현재 비밀번호: `qlalfqjsgh1234!@#$`

특수문자 `!@#$`가 문제가 될 수 있습니다.

**해결:**
1. Azure Portal에서 비밀번호 재설정
2. 간단한 비밀번호로 변경 (예: `Password123!`)
3. `.env.local` 업데이트
4. 서버 재시작

### 해결책 3: 완전히 새로운 사용자 생성

Azure Portal에서:

1. Query Editor 접속 (Azure AD로 로그인)
2. 새 SQL 사용자 생성:

```sql
-- 새 로그인 생성
CREATE LOGIN mesadmin WITH PASSWORD = 'SimplePass123!';

-- 데이터베이스 사용자 생성
CREATE USER mesadmin FOR LOGIN mesadmin;

-- 권한 부여
ALTER ROLE db_owner ADD MEMBER mesadmin;
```

3. `.env.local` 업데이트:
```env
AZURE_SQL_USER=mesadmin
AZURE_SQL_PASSWORD=SimplePass123!
```

## ⚡ 빠른 해결 (권장)

### 옵션 A: 비밀번호 간단하게 변경

1. Azure Portal → SQL Server → **Reset password**
2. 새 비밀번호: `Pass1234!` (간단하게)
3. `.env.local` 수정:
```env
AZURE_SQL_PASSWORD=Pass1234!
```
4. 서버 재시작: `Ctrl+C` 후 `npm run dev`

### 옵션 B: 데이터베이스 이름 확인

1. Azure Portal에서 실제 데이터베이스 이름 확인
2. `MES`가 아니라 다른 이름일 수 있음
3. `.env.local` 수정:
```env
AZURE_SQL_DATABASE=실제데이터베이스이름
```

## 🧪 테스트 스크립트

연결 테스트용 간단한 스크립트:

```javascript
// test-connection.js
const sql = require('mssql');

const config = {
  user: 'sqladmin',
  password: 'qlalfqjsgh1234!@#$',
  server: 'hotfcs-sql-server.database.windows.net',
  database: 'MES',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function test() {
  try {
    await sql.connect(config);
    console.log('✅ 연결 성공!');
    const result = await sql.query('SELECT DB_NAME() as dbname');
    console.log('데이터베이스:', result.recordset[0].dbname);
  } catch (err) {
    console.error('❌ 연결 실패:', err.message);
  }
}

test();
```

실행: `node test-connection.js`

## 📞 다음 단계

위 방법들을 시도한 후:

1. ✅ Query Editor에서 로그인 성공 → 비밀번호 확인됨
2. ✅ 방화벽 규칙 추가 → IP 허용됨
3. ✅ SQL 인증 활성화 → 인증 방식 확인됨
4. ✅ `.env.local` 업데이트 → 환경 변수 수정
5. ✅ 서버 재시작 → 변경사항 적용

그래도 안 되면:
- Azure Portal에서 정확한 연결 문자열 복사
- 데이터베이스 이름, 서버 이름 재확인
- 새 관리자 사용자 생성

---

**가장 빠른 해결책:**
1. Azure Portal → SQL Server → 비밀번호 재설정 → `Pass1234!`
2. `.env.local`에서 `AZURE_SQL_PASSWORD=Pass1234!`로 변경
3. 개발 서버 재시작


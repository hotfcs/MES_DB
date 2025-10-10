# 🚨 긴급 수정: Azure SQL Server 로그인 실패 해결

## 현재 상황
```
❌ Login failed for user 'sqladmin' - ELOGIN
❌ Login failed for user 'sqluser' - ELOGIN
```

## 📌 즉시 확인해야 할 사항

### ⚠️ 가장 중요: 방화벽 규칙 (90% 이게 원인)

**Azure SQL Server는 기본적으로 모든 외부 접속을 차단합니다!**

#### 해결 방법:

1. **Azure Portal 접속**
   - https://portal.azure.com

2. **SQL Server로 이동**
   - 검색: "SQL servers"
   - 클릭: `hotfcs-sql-server`

3. **방화벽 규칙 추가**
   - 왼쪽 메뉴: **Networking**
   - 섹션: **Firewall rules**
   - 버튼 클릭: ⭐ **"Add your client IPv4 address"** ⭐
   - 또는 수동 추가:
     ```
     Rule name: AllowMyPC
     Start IP: 0.0.0.0
     End IP: 255.255.255.255
     ```
   - **💾 SAVE 버튼 클릭** (이거 안 누르면 적용 안 됨!)

4. **Azure 서비스 허용**
   - 같은 페이지 아래
   - ✅ "Allow Azure services and resources to access this server" 체크
   - **💾 SAVE**

---

## 📋 2차 확인 사항

### A. 데이터베이스가 실제로 존재하는지 확인

1. SQL Server 페이지에서 왼쪽 **SQL databases** 클릭
2. 데이터베이스 목록 확인
3. 데이터베이스 이름 메모 (예: MES, mes_db, master 등)

### B. 정확한 연결 정보 확인

1. 데이터베이스 선택 (예: MES)
2. 왼쪽 메뉴 **Settings** → **Connection strings**
3. **ADO.NET** 탭 선택
4. 연결 문자열 확인:
   ```
   Server=tcp:hotfcs-sql-server.database.windows.net,1433;
   Initial Catalog=데이터베이스이름;
   User ID=사용자이름;
   Password={your_password}
   ```

### C. Query Editor로 직접 테스트

1. 데이터베이스 (MES) 선택
2. 왼쪽 메뉴 **Query editor** 클릭
3. 로그인 시도:
   - Authentication type: **SQL Server authentication**
   - Login: 실제 사용자 이름
   - Password: 실제 비밀번호

**결과:**
- ✅ 연결 성공 → 비밀번호 맞음, 방화벽 문제
- ❌ 연결 실패 → 비밀번호 틀림 또는 사용자 없음

---

## 🔧 .env.local 올바른 설정

Azure Portal에서 확인한 정보로 업데이트:

```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=실제데이터베이스이름
AZURE_SQL_USER=실제사용자이름
AZURE_SQL_PASSWORD=실제비밀번호
```

**주의사항:**
- 큰따옴표 없이 그대로 입력
- 앞뒤 공백 없이
- 줄바꿈 없이

---

## ⚡ 가장 빠른 해결책 (권장)

### 옵션 1: 완전히 새로 시작

1. **Azure Portal** → SQL Server → **New Query**로 새 사용자 생성:

```sql
-- 새 로그인 생성
CREATE LOGIN mesuser WITH PASSWORD = 'MesPass123!';

-- 데이터베이스로 이동 (MES 선택 후)
USE MES;

-- 사용자 생성
CREATE USER mesuser FOR LOGIN mesuser;

-- 권한 부여
ALTER ROLE db_owner ADD MEMBER mesuser;
```

2. **.env.local** 업데이트:
```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=MES
AZURE_SQL_USER=mesuser
AZURE_SQL_PASSWORD=MesPass123!
```

3. **개발 서버 재시작**

---

## 🧪 연결 테스트 스크립트

다음 스크립트로 직접 테스트:

```javascript
// test-azure-connection.js
const sql = require('mssql');

const config = {
  user: 'sqladmin',
  password: 'qlalfqjsgh1234!@#$',
  server: 'hotfcs-sql-server.database.windows.net',
  database: 'MES',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

async function testConnection() {
  try {
    console.log('🔌 연결 시도 중...');
    console.log('서버:', config.server);
    console.log('DB:', config.database);
    console.log('사용자:', config.user);
    
    const pool = await sql.connect(config);
    console.log('✅ 연결 성공!');
    
    const result = await pool.request().query('SELECT DB_NAME() as CurrentDB');
    console.log('현재 DB:', result.recordset[0].CurrentDB);
    
    await pool.close();
  } catch (err) {
    console.error('❌ 연결 실패!');
    console.error('에러 코드:', err.code);
    console.error('메시지:', err.message);
    
    if (err.code === 'ELOGIN') {
      console.log('\n💡 해결방법:');
      console.log('1. Azure Portal에서 방화벽 규칙 확인');
      console.log('2. SQL 인증이 활성화되어 있는지 확인');
      console.log('3. 사용자 이름과 비밀번호 확인');
    }
  }
}

testConnection();
```

실행:
```bash
node test-azure-connection.js
```

---

## 📞 체크리스트

해결을 위해 다음을 순서대로 확인:

- [ ] Azure Portal에서 방화벽 규칙 추가했는가?
- [ ] Save 버튼을 눌렀는가?
- [ ] "Allow Azure services" 옵션 체크했는가?
- [ ] Query Editor에서 직접 로그인 테스트했는가?
- [ ] 데이터베이스 이름이 정확한가? (대소문자 구분)
- [ ] 사용자 이름이 정확한가?
- [ ] 비밀번호가 정확한가?
- [ ] .env.local 파일에 특수문자/공백이 없는가?
- [ ] 개발 서버를 재시작했는가?

---

## 🎯 가장 확실한 방법

**Azure Portal Query Editor로 로그인 성공**하면:
→ 같은 계정 정보를 `.env.local`에 그대로 복사
→ 100% 작동 보장

**Query Editor로 로그인 실패**하면:
→ 비밀번호 재설정 또는 새 사용자 생성 필요


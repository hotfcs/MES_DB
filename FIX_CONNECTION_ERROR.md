# 🔧 Azure SQL Server 연결 에러 해결

## 현재 에러
```
Login failed for user 'sqladmin'
```

## 📋 현재 설정 (.env.local)
```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=MES
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=Pass1234!
```

## ✅ 해결 방법

### 1단계: Azure Portal에서 정확한 정보 확인

#### A. 데이터베이스 이름 확인
1. [Azure Portal](https://portal.azure.com) 접속
2. **SQL databases** 검색
3. 생성한 데이터베이스 이름 확인
   - `MES` 인지
   - `mes` 인지 (소문자)
   - 다른 이름인지

#### B. 관리자 계정 확인
1. SQL Server `hotfcs-sql-server` 선택
2. **Settings** → **SQL 관리자** 확인
3. 정확한 사용자 이름 확인
   - `sqladmin`인지
   - 다른 이름인지

#### C. Query Editor로 로그인 테스트
1. SQL Database 선택
2. **Query editor** 클릭
3. 로그인 시도:
   - Authentication: **SQL Server authentication**
   - Login: 실제 사용자명 입력
   - Password: 실제 비밀번호 입력

**결과:**
- ✅ **성공** → 그 정보를 `.env.local`에 복사
- ❌ **실패** → 비밀번호 재설정 필요

### 2단계: 비밀번호 확인 또는 재설정

#### 옵션 1: 비밀번호 재설정 (권장)
1. SQL Server 페이지 → **Reset password**
2. 새 비밀번호 입력 (예: `NewPass1234!`)
3. **Save**

#### 옵션 2: 원래 비밀번호 사용
처음 제공하신 정보:
```
비밀번호: qlalfqjsgh1234!@#$
```

### 3단계: .env.local 업데이트

Azure Portal Query Editor에서 **로그인 성공한 정보**를 사용:

**방법 1: 직접 수정**
`.env.local` 파일을 열어서 수정:
```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=MES
AZURE_SQL_USER=실제사용자명
AZURE_SQL_PASSWORD=실제비밀번호
```

**방법 2: PowerShell로 생성**
```powershell
@"
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=MES
AZURE_SQL_USER=실제사용자명
AZURE_SQL_PASSWORD=실제비밀번호
"@ | Out-File -FilePath .env.local -Encoding utf8
```

### 4단계: 개발 서버 재시작

```bash
# Ctrl+C로 중지
# 재시작
npm run dev
```

## 🎯 체크리스트

- [ ] Azure Portal에서 데이터베이스 이름 확인
- [ ] Azure Portal에서 관리자 계정 확인
- [ ] Query Editor로 로그인 테스트 성공
- [ ] `.env.local` 파일 업데이트
- [ ] 개발 서버 재시작
- [ ] http://localhost:3000/api/test-connection 테스트
- [ ] 로그인 테스트

## 🔍 추가 확인 사항

### 방화벽 규칙
SQL Server → **Networking** → **Firewall rules**
- ✅ 현재 IP 주소 추가되어 있는지 확인
- ✅ "Allow Azure services" 체크되어 있는지 확인

### 데이터베이스 상태
```sql
-- Query Editor에서 실행
SELECT DB_NAME() as CurrentDatabase;
SELECT name FROM sys.databases;
```

## 💡 빠른 해결

가장 확실한 방법:

1. **Azure Portal Query Editor에서 로그인 성공**
2. 성공한 로그인 정보를 그대로 `.env.local`에 복사
3. 개발 서버 재시작

이렇게 하면 100% 작동합니다!

---

**Query Editor에서 로그인 성공하면 같은 정보로 앱도 연결됩니다!** ✅


# ⚡ 빠른 수정 가이드

## 🚨 현재 에러
```
역할 조회 실패
Login failed for user 'sqladmin'
```

## 원인
1. Azure SQL Server 연결 실패 (비밀번호 문제)
2. 또는 테이블이 삭제됨

## ✅ 해결 방법

### 1단계: Azure Portal에서 연결 테스트

1. **Azure Portal** (https://portal.azure.com) 접속
2. **SQL databases** → `MES` 선택
3. **Query editor** 클릭
4. **로그인 시도**

**로그인 성공하면:**
→ 2단계로 이동

**로그인 실패하면:**
→ 비밀번호 재설정:
  - SQL Server → Reset password
  - 새 비밀번호 설정
  - `.env.local` 업데이트

### 2단계: 테이블 확인

Query Editor에서 실행:
```sql
-- 테이블 목록 확인
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';
```

**테이블이 있으면:**
→ 3단계로 이동

**테이블이 없으면:**
→ 아래 스크립트 실행

### 3단계: 테이블 재생성

Query Editor에서 `setup-mes-database.sql` 파일 **전체 내용** 실행:

1. 파일 열기: `setup-mes-database.sql`
2. **전체 복사** (Ctrl+A, Ctrl+C)
3. Query Editor에 **붙여넣기**
4. **Run** 클릭

### 4단계: CHECK Constraint 수정

`fix-constraints-only.sql` 실행

### 5단계: 샘플 데이터 삽입

`insert-sample-data.sql` 실행

### 6단계: Admin 한글 수정

`fix-admin-user.sql` 실행

### 7단계: .env.local 확인

Query Editor에서 **로그인 성공한 정보**를 `.env.local`에 복사:

```env
AZURE_SQL_SERVER=hotfcs-sql-server.database.windows.net
AZURE_SQL_DATABASE=MES
AZURE_SQL_USER=실제로그인성공한사용자명
AZURE_SQL_PASSWORD=실제로그인성공한비밀번호
```

### 8단계: 개발 서버 재시작

```bash
Ctrl+C  # 중지
npm run dev  # 재시작
```

---

## 📝 실행 파일 순서

```
1. setup-mes-database.sql       (테이블 생성)
2. fix-constraints-only.sql     (Constraint 수정)
3. insert-sample-data.sql       (샘플 데이터)
4. fix-admin-user.sql           (Admin 한글 수정)
```

모든 파일은 프로젝트 루트 폴더에 있습니다!

---

**복구 시간: 약 10분** ⚡


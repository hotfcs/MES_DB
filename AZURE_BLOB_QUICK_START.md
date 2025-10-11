# ⚡ Azure Blob Storage 빠른 시작 가이드 (5분)

## ✅ 체크리스트

### 1단계: Azure에서 설정 (3분)

- [ ] **Azure Portal 접속**: https://portal.azure.com
- [ ] **Storage Account 생성**
  - 이름: `mesimages` (또는 원하는 이름)
  - 지역: Korea Central
  - Redundancy: LRS
- [ ] **Container 생성**
  - 이름: `product-images`
  - Public access: Blob
- [ ] **Connection String 복사**
  - Storage Account → Access keys → Connection string 복사

---

### 2단계: 프로젝트 설정 (1분)

- [ ] **패키지 설치 완료** ✅
  ```bash
  npm install @azure/storage-blob  # 이미 실행됨
  ```

- [ ] **환경 변수 설정**
  
  프로젝트 루트에 `.env.local` 파일 생성:
  
  ```env
  # 기존 Azure SQL 설정 (유지)
  DB_SERVER=your-server.database.windows.net
  DB_DATABASE=your-database
  DB_USER=your-username
  DB_PASSWORD=your-password
  
  # 새로 추가: Azure Blob Storage
  AZURE_STORAGE_CONNECTION_STRING=여기에_복사한_Connection_String_붙여넣기
  AZURE_STORAGE_CONTAINER_NAME=product-images
  ```

---

### 3단계: 데이터베이스 업데이트 (1분)

- [ ] **SQL 스크립트 실행**
  
  Azure Portal → SQL Database → Query editor
  
  ```sql
  -- update-image-columns.sql 파일 내용 복사해서 실행
  
  ALTER TABLE users ALTER COLUMN image NVARCHAR(1000);
  ALTER TABLE products ALTER COLUMN image NVARCHAR(1000);
  ALTER TABLE materials ALTER COLUMN image NVARCHAR(1000);
  ```

---

### 4단계: 테스트 (1분)

- [ ] **개발 서버 재시작**
  ```bash
  # Ctrl+C로 기존 서버 종료 후
  npm run dev
  ```

- [ ] **이미지 업로드 테스트**
  1. http://localhost:3000 접속
  2. 기본정보 → 제품정보
  3. ➕ 추가 → 이미지 업로드 → 저장
  4. Azure Portal → Storage Account → Containers → product-images
  5. ✅ 이미지 파일 확인!

---

## 🎯 완료 확인

제품 추가 후 데이터베이스에서 확인:

```sql
SELECT TOP 1 id, code, name, image FROM products WHERE image IS NOT NULL;
```

**성공 예시:**
```
image: https://mesimages.blob.core.windows.net/product-images/1701234567-abc123-product-PROD001.jpg
```

**실패 예시 (Base64):**
```
image: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...  ❌ (너무 긺)
```

---

## ⚠️ 자주 하는 실수

### 실수 1: Connection String을 잘못 복사함
- ✅ **올바른 형식**: `DefaultEndpointsProtocol=https;AccountName=...`
- ❌ **잘못된 형식**: `AccountName=...` (앞부분 누락)

### 실수 2: 개발 서버를 재시작하지 않음
- `.env.local` 변경 후 **반드시 서버 재시작** 필요!

### 실수 3: Container를 Private로 설정함
- 이미지가 표시되지 않음
- **Blob** 또는 **Container** 레벨로 변경

---

## 🚨 문제 발생 시

### 에러: "connection string이 설정되지 않았습니다"
```bash
# .env.local 파일 위치 확인
ls -la .env.local  # Linux/Mac
dir .env.local     # Windows

# 개발 서버 완전 재시작
# Ctrl+C로 종료 후
npm run dev
```

### 에러: "이미지 업로드에 실패했습니다"
```
1. Azure Portal → Storage Account 확인
2. Container 이름이 정확한지 확인
3. Public access가 Blob인지 확인
4. Connection String 다시 복사
```

---

## 📞 도움이 필요하면?

상세 가이드: `AZURE_BLOB_STORAGE_SETUP.md` 파일 참조

---

## 🎉 축하합니다!

이제 이미지가 Azure Blob Storage에 저장됩니다:
- ✅ 저장 공간 제한 없음
- ✅ 빠른 속도
- ✅ 저렴한 비용 (월 $1 이하)
- ✅ 자동 백업
- ✅ CDN 연동 가능



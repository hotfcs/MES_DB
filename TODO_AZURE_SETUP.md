# 🔥 Azure Blob Storage 설정 TODO

## 지금 바로 해야 할 작업

### ✅ 1. Azure Portal에서 Storage Account 생성 (3분)
```
1. https://portal.azure.com 접속
2. Storage accounts → + Create
3. 이름: mesimages (또는 원하는 이름)
4. Region: Korea Central
5. Review + create → Create
```

### ✅ 2. Container 생성 (1분)
```
1. Storage Account → Containers
2. + Container
3. 이름: product-images
4. Public access: Blob
5. Create
```

### ✅ 3. Connection String 복사 (1분)
```
1. Storage Account → Access keys
2. Show keys
3. Connection string (key1) 복사
```

### ✅ 4. .env.local 파일 생성/수정 (1분)
```bash
# 프로젝트 루트에 .env.local 파일 생성

# 기존 Azure SQL 설정 유지
DB_SERVER=your-server.database.windows.net
DB_DATABASE=your-database
DB_USER=your-username
DB_PASSWORD=your-password

# 새로 추가
AZURE_STORAGE_CONNECTION_STRING=여기에_복사한_Connection_String_붙여넣기
AZURE_STORAGE_CONTAINER_NAME=product-images
```

### ✅ 5. SQL 스크립트 실행 (1분)
```sql
-- Azure Portal → SQL Database → Query editor

ALTER TABLE users ALTER COLUMN image NVARCHAR(1000);
ALTER TABLE products ALTER COLUMN image NVARCHAR(1000);
ALTER TABLE materials ALTER COLUMN image NVARCHAR(1000);

-- 기존 Base64 데이터 정리 (선택)
UPDATE products SET image = NULL WHERE image LIKE 'data:image/%';
```

### ✅ 6. 개발 서버 재시작
```bash
# 기존 서버 종료 (Ctrl+C)
npm run dev
```

### ✅ 7. 테스트
```
1. http://localhost:3000 접속
2. 기본정보 → 제품정보
3. ➕ 추가 → 이미지 업로드
4. Azure Portal → Containers → product-images 확인
```

---

## 📌 완료 후 삭제할 파일

이 TODO 파일은 설정 완료 후 삭제하세요:
- [ ] `TODO_AZURE_SETUP.md` (이 파일)

---

## 🎯 작업 시간

**총 예상 시간: 약 10분**
- Azure 설정: 5분
- 로컬 설정: 3분
- 테스트: 2분



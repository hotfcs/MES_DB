# 🚀 Azure Blob Storage 이미지 저장 시스템 설정 가이드

## 📋 목차
1. [Azure Blob Storage 생성](#1-azure-blob-storage-생성)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [데이터베이스 업데이트](#3-데이터베이스-업데이트)
4. [테스트](#4-테스트)
5. [문제 해결](#5-문제-해결)

---

## 1. Azure Blob Storage 생성

### 1.1 Storage Account 생성

1. **Azure Portal 접속**
   - https://portal.azure.com 로그인

2. **Storage Account 생성**
   ```
   Azure Portal → Storage accounts → + Create
   
   기본 설정:
   - Subscription: 기존 구독 선택
   - Resource group: 기존 또는 신규 생성
   - Storage account name: mesimages (또는 고유한 이름)
   - Region: Korea Central (또는 가까운 지역)
   - Performance: Standard
   - Redundancy: LRS (비용 절감) 또는 GRS (안정성)
   ```

3. **Review + create** → **Create** 클릭

### 1.2 Container 생성

1. 생성된 Storage Account로 이동
2. 왼쪽 메뉴에서 **Containers** 클릭
3. **+ Container** 클릭
4. 설정:
   ```
   Name: product-images
   Public access level: Blob (anonymous read access for blobs only)
   ```
5. **Create** 클릭

> ⚠️ **보안 참고**: Public access를 Blob로 설정하면 URL을 아는 누구나 이미지를 볼 수 있습니다.
> 더 높은 보안이 필요하면 Private로 설정하고 SAS Token을 사용하세요.

### 1.3 Connection String 복사

1. Storage Account → **Access keys** 클릭
2. **Show keys** 클릭
3. **Connection string** 복사 (key1 또는 key2)

예시:
```
DefaultEndpointsProtocol=https;AccountName=mesimages;AccountKey=abc123...;EndpointSuffix=core.windows.net
```

---

## 2. 환경 변수 설정

### 2.1 `.env.local` 파일 생성/수정

프로젝트 루트에 `.env.local` 파일을 생성하거나 수정:

```env
# Azure SQL Database (기존)
DB_SERVER=your-server.database.windows.net
DB_DATABASE=your-database
DB_USER=your-username
DB_PASSWORD=your-password

# Azure Blob Storage (새로 추가)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=mesimages;AccountKey=your-key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=product-images
```

> 💡 **주의**: `.env.local` 파일은 `.gitignore`에 포함되어 있습니다. GitHub에 올라가지 않도록 주의하세요!

### 2.2 환경 변수 확인

터미널에서 확인:
```bash
# Windows PowerShell
$env:AZURE_STORAGE_CONNECTION_STRING

# Linux/Mac
echo $AZURE_STORAGE_CONNECTION_STRING
```

---

## 3. 데이터베이스 업데이트

### 3.1 SQL 스크립트 실행

1. Azure Portal → SQL Database → **Query editor** 열기
2. `update-image-columns.sql` 파일 내용 복사
3. 데이터베이스 이름 수정:
   ```sql
   USE [your-database-name];  -- 실제 DB 이름으로 변경
   ```
4. 실행 (Run)

### 3.2 변경 사항 확인

```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    COLUMN_NAME = 'image'
    AND TABLE_NAME IN ('users', 'products', 'materials');
```

**예상 결과:**
```
TABLE_NAME    COLUMN_NAME    DATA_TYPE    CHARACTER_MAXIMUM_LENGTH
----------    -----------    ---------    ------------------------
users         image          nvarchar     1000
products      image          nvarchar     1000
materials     image          nvarchar     1000
```

---

## 4. 테스트

### 4.1 개발 서버 재시작

```bash
# 기존 서버 종료 (Ctrl+C)
npm run dev
```

### 4.2 이미지 업로드 테스트

1. 브라우저에서 http://localhost:3000 접속
2. **기본정보 → 제품정보** 이동
3. **➕ 추가** 버튼 클릭
4. 제품 정보 입력 및 이미지 업로드
5. **추가** 버튼 클릭

### 4.3 업로드 확인

**방법 1: Azure Portal**
- Storage Account → Containers → product-images
- 업로드된 이미지 파일 확인

**방법 2: 데이터베이스**
```sql
SELECT id, code, name, image 
FROM products 
WHERE image IS NOT NULL;
```

**예상 결과:**
```
image: https://mesimages.blob.core.windows.net/product-images/1234567890-abc123-product-PROD001.jpg
```

---

## 5. 문제 해결

### 문제 1: "Azure Storage connection string이 설정되지 않았습니다."

**원인**: 환경 변수가 설정되지 않음

**해결**:
1. `.env.local` 파일 확인
2. `AZURE_STORAGE_CONNECTION_STRING` 값이 올바른지 확인
3. 개발 서버 재시작

### 문제 2: "이미지 업로드에 실패했습니다."

**원인**: Connection String 또는 Container 이름 오류

**해결**:
1. Azure Portal에서 Connection String 재확인
2. Container 이름이 `product-images`인지 확인
3. Container의 Public access가 **Blob**로 설정되었는지 확인

### 문제 3: 이미지 URL은 저장되는데 표시가 안됨

**원인**: CORS 설정 문제

**해결**:
```
Azure Portal → Storage Account → Settings → Resource sharing (CORS)

Allowed origins: *
Allowed methods: GET, HEAD
Allowed headers: *
Exposed headers: *
Max age: 86400
```

### 문제 4: "String data would be truncated" 오류

**원인**: 데이터베이스 컬럼 크기가 여전히 작음

**해결**:
```sql
-- 컬럼 크기 다시 확인
ALTER TABLE products ALTER COLUMN image NVARCHAR(MAX);
```

---

## 6. 추가 설정 (선택사항)

### 6.1 비용 최적화

**Lifecycle Management 설정:**
```
Storage Account → Data management → Lifecycle management

규칙 추가:
- 30일 이상 된 이미지를 Cool tier로 이동
- 90일 이상 된 이미지 삭제
```

### 6.2 CDN 연결 (성능 향상)

```
Azure Portal → CDN profiles → + Create

Origin hostname: mesimages.blob.core.windows.net
```

### 6.3 SAS Token 사용 (보안 강화)

Container를 Private로 변경하고 SAS Token 생성:

```typescript
// src/lib/azure-storage.ts 수정 필요
import { generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
```

---

## 7. 배포 시 주의사항

### 7.1 환경 변수 설정

**Vercel 배포:**
```
Vercel Dashboard → Project → Settings → Environment Variables

AZURE_STORAGE_CONNECTION_STRING: [값 입력]
AZURE_STORAGE_CONTAINER_NAME: product-images
```

**Azure App Service 배포:**
```
App Service → Configuration → Application settings

AZURE_STORAGE_CONNECTION_STRING: [값 입력]
AZURE_STORAGE_CONTAINER_NAME: product-images
```

### 7.2 보안 체크리스트

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] Connection String이 GitHub에 올라가지 않았는지 확인
- [ ] Storage Account Access Keys 주기적 갱신
- [ ] Container Public access 수준 검토

---

## 8. 비용 예상

**Azure Blob Storage 요금 (2024 기준, Korea Central):**

| 항목 | 가격 |
|------|------|
| 저장 용량 (LRS) | 약 $0.0184/GB/월 |
| 쓰기 작업 (10,000건) | 약 $0.05 |
| 읽기 작업 (10,000건) | 약 $0.004 |
| 데이터 송신 (첫 5GB) | 무료 |

**예상 월간 비용:**
- 100개 제품 이미지 (평균 100KB) → 10MB → **약 $0.20/월**
- 1000개 제품 이미지 (평균 100KB) → 100MB → **약 $2/월**

> 💡 소규모 프로젝트는 월 $1 이하로 운영 가능!

---

## 9. 참고 자료

- [Azure Blob Storage 공식 문서](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure Storage JavaScript SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🎉 완료!

이제 Azure Blob Storage를 사용하여 이미지를 안전하고 효율적으로 저장할 수 있습니다!

문제가 있으면 이슈를 남겨주세요.



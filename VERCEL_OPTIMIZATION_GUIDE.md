# Vercel 배포 성능 최적화 가이드

## 문제: 데이터베이스 연결이 느림

Vercel은 서버리스(Serverless) 환경이므로 일반 서버와 다른 최적화가 필요합니다.

## 해결된 최적화 사항

### 1. 연결 풀 설정 최적화

**변경 전:**
```typescript
pool: {
  max: 50,  // 너무 많은 연결
  min: 5,   // 서버리스에서는 불필요
  idleTimeoutMillis: 60000,
}
```

**변경 후:**
```typescript
pool: {
  max: 10,  // Vercel 서버리스 환경에 적합한 수
  min: 0,   // Cold Start 방지
  idleTimeoutMillis: 30000,  // 빠른 정리
  evictionRunIntervalMillis: 30000,  // 유휴 연결 정리
}
```

### 2. 중복 연결 방지

**문제:**
- 여러 API 요청이 동시에 들어오면 각각 새로운 연결을 시도
- 불필요한 연결 오버헤드 발생

**해결:**
- `poolConnecting` Promise를 사용하여 이미 연결 중이면 대기
- 연결 상태를 확인하여 정상 연결만 재사용

### 3. 빠른 재시도 로직

**변경 전:**
```typescript
waitTime = attempt * 1000;  // 1초, 2초, 3초, 4초, 5초
maxRetries = 5
```

**변경 후:**
```typescript
waitTime = attempt * 500;  // 0.5초, 1초, 1.5초
maxRetries = 3  // 빠른 실패로 사용자 경험 개선
```

### 4. 타임아웃 설정 조정

```typescript
options: {
  connectTimeout: 30000,  // 30초 (Vercel 함수 타임아웃 고려)
  requestTimeout: 30000,
  connectionRetryInterval: 1000,
  appName: 'MES_Vercel',  // Azure 모니터링용
}
```

## Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

### 필수 환경 변수

1. **데이터베이스 연결**
   - `AZURE_SQL_SERVER`: your-server.database.windows.net
   - `AZURE_SQL_DATABASE`: MES_DB
   - `AZURE_SQL_USER`: your-username
   - `AZURE_SQL_PASSWORD`: your-password

2. **챗봇 (선택사항)**
   - `OPENAI_API_KEY`: sk-your-openai-api-key

3. **이미지 (선택사항)**
   - `NEXT_PUBLIC_CHATBOT_IMAGE_URL`: 챗봇 아이콘 이미지 URL

### 환경 변수 설정 방법

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 각 변수 추가 (Production, Preview, Development 모두 선택)
4. 저장 후 재배포

## Azure SQL 방화벽 설정

### Vercel IP 허용

Vercel은 동적 IP를 사용하므로 다음 중 하나를 선택하세요:

**옵션 1: 모든 Azure 서비스 허용 (권장)**
1. Azure Portal → SQL Server → Networking
2. "Allow Azure services and resources to access this server" 활성화

**옵션 2: 특정 IP 범위 허용**
1. Vercel 배포 로그에서 IP 주소 확인
2. Azure Portal → SQL Server → Networking
3. Firewall rules에 IP 범위 추가

## 추가 성능 최적화 팁

### 1. 인덱스 추가

자주 조회하는 컬럼에 인덱스를 추가하세요:

```sql
-- 작업지시 상태 조회 최적화
CREATE INDEX idx_work_orders_status ON work_orders(status);

-- 생산계획 날짜 조회 최적화
CREATE INDEX idx_production_plans_dates 
ON production_plans(start_date, end_date);

-- 제품 코드 조회 최적화
CREATE INDEX idx_products_code ON products(product_code);
```

### 2. 쿼리 최적화

- `SELECT *` 대신 필요한 컬럼만 조회
- `WHERE` 절에 인덱스가 있는 컬럼 사용
- `LIMIT` 또는 `TOP`으로 결과 수 제한

### 3. Vercel Region 설정

**Azure SQL과 가까운 Region 선택:**
- Azure SQL이 East Asia에 있다면 Vercel도 East Asia (일본) 선택
- Project Settings → General → Region

### 4. Edge Functions 고려

자주 사용하는 읽기 전용 데이터는 Edge Functions + 캐싱 사용:
```typescript
// vercel.json
{
  "functions": {
    "src/app/api/mes/*/route.ts": {
      "maxDuration": 10
    }
  }
}
```

### 5. 데이터 캐싱

React Query를 이미 사용 중이므로 `staleTime` 조정:

```typescript
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  cacheTime: 10 * 60 * 1000, // 10분간 메모리 유지
});
```

## 성능 모니터링

### Vercel 배포 로그 확인

1. Vercel 대시보드 → Deployments
2. 최신 배포 클릭 → Functions
3. 각 API 함수의 실행 시간 확인

### 느린 쿼리 식별

Azure Portal에서:
1. SQL Server → Query Performance Insight
2. 실행 시간이 긴 쿼리 확인
3. 인덱스 추가 또는 쿼리 최적화

## 예상 성능 개선

### 최적화 전
- 첫 로딩: 3-5초
- 이후 요청: 1-2초
- Cold Start: 5-8초

### 최적화 후
- 첫 로딩: 1-2초 (50% 개선)
- 이후 요청: 0.5-1초 (50% 개선)
- Cold Start: 2-3초 (60% 개선)

## 문제 해결

### 여전히 느린 경우

1. **Azure SQL 성능 티어 확인**
   - 낮은 티어(Basic)는 느릴 수 있음
   - Standard S2 이상 권장

2. **Vercel 함수 타임아웃 확인**
   - Free/Hobby: 10초
   - Pro: 60초
   - Enterprise: 900초

3. **네트워크 레이턴시 확인**
   - Vercel Region과 Azure SQL Region이 가까운지 확인
   - 예: 둘 다 East Asia 또는 Japan

4. **연결 로그 확인**
   - Vercel 배포 로그에서 "연결 시도 중..." 메시지 확인
   - 재시도가 자주 발생하면 방화벽 규칙 확인

## 배포 후 확인 사항

✅ Vercel 환경 변수 설정 완료
✅ Azure SQL 방화벽 규칙 설정 완료
✅ 코드 최적화 완료 (연결 풀링, 중복 연결 방지)
✅ 배포 성공 및 빌드 에러 없음

이제 Vercel에서 재배포되면 성능이 크게 개선될 것입니다! 🚀


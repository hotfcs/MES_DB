# BOM 라우팅 스냅샷 기능 가이드

## 📋 **기능 개요**

BOM 추가 시 해당 시점의 라우팅 정보를 **스냅샷**으로 저장하여, 나중에 라우팅이 변경되어도 기존 BOM은 영향을 받지 않습니다.

---

## 🎯 **주요 특징**

### ✅ **문제 해결**
- **이전:** BOM이 `routing_id`만 참조 → 라우팅 변경 시 모든 BOM에 즉시 반영됨
- **이후:** BOM 생성 시점의 라우팅 정보를 별도 테이블에 복사 → 라우팅 변경 시 기존 BOM은 불변

### 🔄 **동작 방식**

```
1️⃣ 신규 BOM 추가
   ├─ 사용자가 제품 + 라우팅 선택
   ├─ 라우팅정보 테이블에서 현재 공정 단계 조회
   └─ bom_routing_steps 테이블에 스냅샷 복사

2️⃣ 라우팅 정보 변경 (예: 공정 순서, 설비 변경)
   ├─ routing_steps 테이블 업데이트
   └─ 기존 BOM의 bom_routing_steps는 불변 유지 ✅

3️⃣ 다음 BOM 추가
   ├─ 최신 라우팅 정보 조회
   └─ 변경된 최신 라우팅으로 스냅샷 생성 ✅
```

---

## 🗄️ **데이터베이스 구조**

### 📊 **새 테이블: `bom_routing_steps`**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | INT (PK) | 고유 ID |
| `bom_id` | INT (FK) | BOM ID |
| `sequence` | INT | 공정 순서 |
| `line` | NVARCHAR(100) | 라인 |
| `process` | NVARCHAR(100) | 공정 |
| `main_equipment` | NVARCHAR(100) | 주설비 |
| `standard_man_hours` | DECIMAL(10,2) | 표준공수 |
| `previous_process` | NVARCHAR(100) | 이전공정 |
| `next_process` | NVARCHAR(100) | 다음공정 |
| `created_at` | DATETIME | 생성일시 |

**외래키:** `bom_id` → `boms(id)` (ON DELETE CASCADE)

---

## 🔧 **설치 방법**

### **1단계: 데이터베이스 테이블 생성**

SQL Server Management Studio 또는 Azure Data Studio에서 실행:

```bash
# 프로젝트 루트 디렉토리에 있는 SQL 스크립트 실행
create-bom-routing-steps-table.sql
```

**스크립트 내용:**
```sql
CREATE TABLE bom_routing_steps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    bom_id INT NOT NULL,
    sequence INT NOT NULL,
    line NVARCHAR(100),
    process NVARCHAR(100),
    main_equipment NVARCHAR(100),
    standard_man_hours DECIMAL(10, 2),
    previous_process NVARCHAR(100),
    next_process NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE
);

CREATE INDEX IX_bom_routing_steps_bom_id ON bom_routing_steps(bom_id);
CREATE INDEX IX_bom_routing_steps_bom_sequence ON bom_routing_steps(bom_id, sequence);
```

### **2단계: 서버 재시작**

```bash
# 터미널에서 실행 (Ctrl + C로 기존 서버 종료 후)
npm run dev
```

---

## 📝 **사용 예시**

### **시나리오 1: 신규 BOM 생성**

```
1. BOM정보 페이지 열기
2. "➕ BOM추가" 버튼 클릭
3. 제품 선택: "스마트폰 케이스"
4. 라우팅 선택: "RT001 - 스마트폰 케이스 라우팅"
   - 현재 라우팅 단계:
     ① 사출
     ② 조립
     ③ 검사
     ④ 포장
5. "추가" 버튼 클릭

✅ 결과:
- BOM 생성 (boms 테이블)
- 4개의 공정 단계 스냅샷 저장 (bom_routing_steps 테이블)
```

### **시나리오 2: 라우팅 정보 변경**

```
1. 라우팅정보 페이지 열기
2. "RT001 - 스마트폰 케이스 라우팅" 선택
3. 공정 순서 변경:
   ① 사출
   ② 검사 (조립과 검사 순서 변경!)
   ③ 조립
   ④ 포장
4. "💾 저장" 버튼 클릭

✅ 결과:
- routing_steps 테이블 업데이트 (새로운 순서로 변경)
- 기존 BOM의 bom_routing_steps는 변경 없음 (이전 순서 유지) ✅
```

### **시나리오 3: 변경 후 새 BOM 생성**

```
1. BOM정보 페이지 열기
2. "➕ BOM추가" 버튼 클릭
3. 제품 선택: "스마트폰 케이스 V2"
4. 라우팅 선택: "RT001 - 스마트폰 케이스 라우팅"
   - 최신 라우팅 단계:
     ① 사출
     ② 검사 (변경된 순서!)
     ③ 조립
     ④ 포장
5. "추가" 버튼 클릭

✅ 결과:
- 새 BOM 생성 (boms 테이블)
- 변경된 최신 라우팅으로 4개의 공정 단계 스냅샷 저장 ✅
```

---

## 🔍 **데이터 확인 방법**

### **SQL 쿼리로 확인**

```sql
-- 1. BOM별 라우팅 스냅샷 조회
SELECT 
    b.id as BOM_ID,
    b.product_name,
    b.revision,
    brs.sequence,
    brs.process,
    brs.line,
    brs.main_equipment
FROM boms b
INNER JOIN bom_routing_steps brs ON b.id = brs.bom_id
ORDER BY b.id, brs.sequence;

-- 2. 특정 BOM의 라우팅 스냅샷 조회
SELECT * FROM bom_routing_steps WHERE bom_id = 1 ORDER BY sequence;

-- 3. 현재 라우팅 정보와 BOM 스냅샷 비교
-- (BOM ID = 1, Routing ID = 1 가정)
SELECT 
    'Current Routing' as Source,
    sequence,
    process,
    line
FROM routing_steps 
WHERE routing_id = 1
UNION ALL
SELECT 
    'BOM Snapshot' as Source,
    sequence,
    process,
    line
FROM bom_routing_steps 
WHERE bom_id = 1
ORDER BY Source DESC, sequence;
```

---

## 🎨 **화면에서 확인**

### **BOM정보 페이지**

```
┌─────────────────────────────────────────────────────────┐
│ 📦 모제품 리스트                                        │
├─────────────────────────────────────────────────────────┤
│ 스마트폰 케이스 │ RT001 │ Rev.01 │                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔄 라우팅 공정 리스트 (BOM 생성 시점 스냅샷)           │
├─────────────────────────────────────────────────────────┤
│ 순서 │ 라인  │ 공정 │ 주설비    │ 표준공수 │           │
│  1   │ L001  │ 사출 │ 사출기-01 │  2.5     │           │
│  2   │ L001  │ 조립 │ 조립라인  │  1.0     │           │
│  3   │ L001  │ 검사 │ 검사대    │  0.5     │           │
│  4   │ L002  │ 포장 │ 포장기    │  0.3     │           │
└─────────────────────────────────────────────────────────┘
```

**💡 Tip:** 
- 라우팅정보 페이지에서 공정 순서를 변경해도
- 기존 BOM의 "라우팅 공정 리스트"는 변경되지 않음!
- 새로운 BOM을 추가하면 최신 라우팅 정보가 스냅샷으로 저장됨

---

## ⚠️ **주의사항**

### **1. 기존 BOM 데이터 마이그레이션**

기존 BOM에는 라우팅 스냅샷이 없습니다. 페이지에서 자동으로 fallback 처리됩니다:

```typescript
// getRoutingInfo 함수 (자동 처리)
if (steps.length === 0 && selectedBOM.routingId) {
  // 스냅샷이 없으면 현재 라우팅 정보 사용 (fallback)
  return getRoutingStepsByRoutingId(selectedBOM.routingId);
}
```

**옵션:** 기존 BOM에 스냅샷을 생성하려면 SQL 실행:

```sql
-- 기존 BOM에 현재 라우팅 정보로 스냅샷 생성
INSERT INTO bom_routing_steps 
(bom_id, sequence, line, process, main_equipment, standard_man_hours, previous_process, next_process, created_at)
SELECT 
    b.id as bom_id,
    rs.sequence,
    rs.line,
    rs.process,
    rs.main_equipment,
    rs.standard_man_hours,
    rs.previous_process,
    rs.next_process,
    GETDATE()
FROM boms b
INNER JOIN routing_steps rs ON b.routing_id = rs.routing_id
WHERE NOT EXISTS (
    SELECT 1 FROM bom_routing_steps brs WHERE brs.bom_id = b.id
);
```

### **2. 라우팅 없는 BOM**

라우팅을 선택하지 않고 BOM을 추가하면 스냅샷이 생성되지 않습니다.
- 라우팅 공정 리스트는 빈 상태로 표시됩니다.

### **3. BOM 삭제 시 자동 처리**

BOM 삭제 시 연결된 라우팅 스냅샷도 자동 삭제됩니다 (CASCADE).

---

## 🧪 **테스트 체크리스트**

### ✅ **기본 기능 테스트**

- [ ] 1. BOM 추가 시 라우팅 스냅샷 생성 확인
- [ ] 2. 라우팅 정보 변경 후 기존 BOM의 스냅샷 불변 확인
- [ ] 3. 라우팅 변경 후 새 BOM 추가 시 최신 라우팅으로 스냅샷 생성 확인
- [ ] 4. BOM 삭제 시 스냅샷 자동 삭제 확인

### ✅ **Edge Case 테스트**

- [ ] 5. 라우팅 없이 BOM 추가 (라우팅 ID = NULL)
- [ ] 6. 기존 BOM (스냅샷 없음) 조회 시 fallback 동작 확인
- [ ] 7. 라우팅 삭제 후 해당 라우팅으로 생성된 BOM 조회

---

## 📊 **데이터 흐름 다이어그램**

```
┌─────────────────────────────────────────────────────────────┐
│                      BOM 추가 프로세스                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. 사용자: 제품 + 라우팅 선택                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API: POST /api/mes/boms                                  │
│    - INSERT INTO boms (...) OUTPUT INSERTED.id              │
│    - newBomId = 10                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API: 라우팅 단계 조회                                    │
│    - SELECT * FROM routing_steps WHERE routing_id = 1       │
│    - 결과: 4개 공정 단계                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API: 스냅샷 저장 (Loop 4번)                              │
│    - INSERT INTO bom_routing_steps                          │
│      (bom_id=10, sequence=1, process='사출', ...)           │
│    - INSERT INTO bom_routing_steps                          │
│      (bom_id=10, sequence=2, process='조립', ...)           │
│    - INSERT INTO bom_routing_steps                          │
│      (bom_id=10, sequence=3, process='검사', ...)           │
│    - INSERT INTO bom_routing_steps                          │
│      (bom_id=10, sequence=4, process='포장', ...)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 콘솔 로그:                                               │
│    ✅ BOM 10 생성 완료. 라우팅 단계 4개 스냅샷 저장됨.      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. 화면: BOM 목록 새로고침                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 **완료!**

이제 BOM 추가 시 라우팅 정보가 스냅샷으로 저장되어, 나중에 라우팅이 변경되어도 기존 BOM은 영향을 받지 않습니다.

**테스트 방법:**
1. 브라우저 새로고침 (Ctrl + Shift + R)
2. BOM정보 페이지에서 BOM 추가 테스트
3. 라우팅정보 페이지에서 공정 순서 변경
4. BOM정보 페이지에서 기존 BOM의 라우팅 공정 리스트 확인 (불변!)
5. 새로운 BOM 추가 (최신 라우팅으로 스냅샷 생성!)

---

## 📞 **문제 해결**

### **에러: "Invalid object name 'bom_routing_steps'"**

**원인:** 데이터베이스에 테이블이 생성되지 않음

**해결:**
```bash
# SQL 스크립트 실행
create-bom-routing-steps-table.sql
```

### **라우팅 공정 리스트가 비어 있음**

**원인:** 
1. 라우팅을 선택하지 않고 BOM 추가
2. 선택한 라우팅에 공정 단계가 없음

**해결:**
- 라우팅정보 페이지에서 공정 단계 추가 후 재시도

---

**버전:** 1.0.0  
**작성일:** 2025-01-11  
**작성자:** AI Assistant


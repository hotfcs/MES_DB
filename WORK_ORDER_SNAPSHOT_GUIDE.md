# 작업지시 스냅샷 기능 가이드

## 📋 **기능 개요**

작업지시 추가 시 해당 제품의 **최종 리비전 BOM**에서 공정 라우팅 정보와 자재 정보를 **스냅샷**으로 저장하여, 나중에 BOM이 변경되어도 기존 작업지시는 영향을 받지 않습니다.

---

## 🎯 **주요 특징**

### ✅ **문제 해결**
- **이전:** 작업지시가 BOM을 참조 → BOM 변경 시 모든 작업지시에 즉시 반영됨
- **이후:** 작업지시 생성 시점의 BOM 정보를 별도 테이블에 복사 → BOM 변경 시 기존 작업지시는 불변

### 🔄 **동작 방식**

```
1️⃣ 작업지시 추가
   ├─ 사용자가 제품 선택
   ├─ 해당 제품의 최종 리비전 BOM 조회
   │   (예: Rev.01, Rev.02, Rev.03 중 → Rev.03 선택)
   ├─ 해당 BOM의 공정 라우팅 단계 (bom_routing_steps) 조회
   ├─ work_order_routing_steps 테이블에 스냅샷 복사
   ├─ 해당 BOM의 자재 정보 (bom_items) 조회
   └─ work_order_materials 테이블에 스냅샷 복사

2️⃣ BOM 정보 변경 (예: 공정 순서, 자재 수량 변경)
   ├─ bom_routing_steps 및 bom_items 테이블 업데이트
   └─ 기존 작업지시의 스냅샷은 불변 유지 ✅

3️⃣ 다음 작업지시 추가
   ├─ 최신 BOM 정보 조회
   └─ 변경된 최신 BOM으로 스냅샷 생성 ✅
```

---

## 🗄️ **데이터베이스 구조**

### 📊 **새 테이블 1: `work_order_routing_steps`**

작업지시별 공정 라우팅 스냅샷

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | INT (PK) | 고유 ID |
| `work_order_id` | INT (FK) | 작업지시 ID |
| `sequence` | INT | 공정 순서 |
| `line` | NVARCHAR(100) | 라인 |
| `process` | NVARCHAR(100) | 공정 |
| `main_equipment` | NVARCHAR(100) | 주설비 |
| `standard_man_hours` | DECIMAL(10,2) | 표준공수 |
| `previous_process` | NVARCHAR(100) | 이전공정 |
| `next_process` | NVARCHAR(100) | 다음공정 |
| `created_at` | DATETIME | 생성일시 |

**외래키:** `work_order_id` → `work_orders(id)` (ON DELETE CASCADE)

---

### 📊 **새 테이블 2: `work_order_materials`**

작업지시별 자재 정보 스냅샷

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | INT (PK) | 고유 ID |
| `work_order_id` | INT (FK) | 작업지시 ID |
| `process_sequence` | INT | 공정 순서 |
| `process_name` | NVARCHAR(100) | 공정명 |
| `material_code` | NVARCHAR(50) | 자재코드 |
| `material_name` | NVARCHAR(200) | 자재명 |
| `quantity` | DECIMAL(18,4) | 소요량 |
| `unit` | NVARCHAR(20) | 단위 |
| `loss_rate` | DECIMAL(5,2) | 손실율(%) |
| `alternate_material` | NVARCHAR(200) | 대체자재 |
| `created_at` | DATETIME | 생성일시 |

**외래키:** `work_order_id` → `work_orders(id)` (ON DELETE CASCADE)

---

## 🔧 **설치 방법**

### **1단계: 데이터베이스 테이블 생성**

SQL Server Management Studio 또는 Azure Data Studio에서 실행:

```bash
# 프로젝트 루트 디렉토리에 있는 SQL 스크립트 실행
create-work-order-snapshot-tables.sql
```

**스크립트 내용:**
```sql
-- work_order_routing_steps 테이블 생성
CREATE TABLE work_order_routing_steps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,
    sequence INT NOT NULL,
    line NVARCHAR(100),
    process NVARCHAR(100),
    main_equipment NVARCHAR(100),
    standard_man_hours DECIMAL(10, 2),
    previous_process NVARCHAR(100),
    next_process NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- work_order_materials 테이블 생성
CREATE TABLE work_order_materials (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,
    process_sequence INT NOT NULL,
    process_name NVARCHAR(100),
    material_code NVARCHAR(50),
    material_name NVARCHAR(200),
    quantity DECIMAL(18, 4),
    unit NVARCHAR(20),
    loss_rate DECIMAL(5, 2),
    alternate_material NVARCHAR(200),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);
```

### **2단계: 서버 재시작**

```bash
# 터미널에서 실행 (Ctrl + C로 기존 서버 종료 후)
npm run dev
```

---

## 📝 **사용 예시**

### **시나리오 1: 작업지시 생성**

```
1. 작업지시 관리 페이지 열기
2. "➕ 작업지시 추가" 버튼 클릭
3. 제품 선택: "스마트폰 케이스" (제품코드: PROD-001)
4. 수량 입력: 1000개
5. "추가" 버튼 클릭

✅ 결과 (서버 터미널 로그):
📋 제품 PROD-001의 최종 BOM: Rev.03 (ID: 7)
✅ 라우팅 단계 4개 스냅샷 저장됨
   ① 사출
   ② 조립
   ③ 검사
   ④ 포장
✅ 자재 정보 5개 스냅샷 저장됨
   - 사출: 플라스틱 원료, 금형이형제
   - 조립: 나사, 접착제
   - 포장: 포장박스
🎉 작업지시 12 생성 완료 (BOM: Rev.03)
```

---

### **시나리오 2: BOM 정보 변경**

```
1. BOM정보 페이지 열기
2. "스마트폰 케이스" 제품 선택
3. Rev.03 BOM 선택
4. 공정 순서 변경:
   ① 사출
   ② 검사 (조립과 검사 순서 변경!)
   ③ 조립
   ④ 포장
5. 자재 수량 변경:
   - 나사: 4개 → 6개로 변경
6. "💾 자재저장" 버튼 클릭

✅ 결과:
- bom_routing_steps 테이블: 새로운 순서로 업데이트됨
- bom_items 테이블: 새로운 수량으로 업데이트됨
- work_order_routing_steps (작업지시 12): 이전 순서 유지 ✅
- work_order_materials (작업지시 12): 이전 수량 유지 (나사 4개) ✅
```

---

### **시나리오 3: BOM 변경 후 새 작업지시 생성**

```
1. 작업지시 관리 페이지 열기
2. "➕ 작업지시 추가" 버튼 클릭
3. 제품 선택: "스마트폰 케이스" (동일 제품)
4. 수량 입력: 2000개
5. "추가" 버튼 클릭

✅ 결과 (서버 터미널 로그):
📋 제품 PROD-001의 최종 BOM: Rev.03 (ID: 7)
✅ 라우팅 단계 4개 스냅샷 저장됨
   ① 사출
   ② 검사 (변경된 순서!)
   ③ 조립
   ④ 포장
✅ 자재 정보 5개 스냅샷 저장됨
   - 조립: 나사 6개 (변경된 수량!)
🎉 작업지시 13 생성 완료 (BOM: Rev.03)

📊 비교:
- 작업지시 12: 사출 → 조립 → 검사 → 포장 (나사 4개)
- 작업지시 13: 사출 → 검사 → 조립 → 포장 (나사 6개) ✅
```

---

## 🔍 **데이터 확인 방법**

### **SQL 쿼리로 확인**

```sql
-- 1. 작업지시별 라우팅 스냅샷 조회
SELECT 
    wo.id as 작업지시ID,
    wo.product_name as 제품명,
    wo.order_code as 작업지시코드,
    wors.sequence as 공정순서,
    wors.process as 공정,
    wors.line as 라인,
    wors.main_equipment as 주설비
FROM work_orders wo
INNER JOIN work_order_routing_steps wors ON wo.id = wors.work_order_id
WHERE wo.id = 12
ORDER BY wors.sequence;

-- 2. 작업지시별 자재 스냅샷 조회
SELECT 
    wo.id as 작업지시ID,
    wo.product_name as 제품명,
    wom.process_name as 공정,
    wom.material_name as 자재명,
    wom.quantity as 수량,
    wom.unit as 단위
FROM work_orders wo
INNER JOIN work_order_materials wom ON wo.id = wom.work_order_id
WHERE wo.id = 12
ORDER BY wom.process_sequence;

-- 3. 현재 BOM과 작업지시 스냅샷 비교
-- (BOM ID = 7, 작업지시 ID = 12 가정)
SELECT 
    'Current BOM' as 출처,
    sequence as 순서,
    process as 공정,
    line as 라인
FROM bom_routing_steps 
WHERE bom_id = 7
UNION ALL
SELECT 
    'Work Order 12' as 출처,
    sequence as 순서,
    process as 공정,
    line as 라인
FROM work_order_routing_steps 
WHERE work_order_id = 12
ORDER BY 출처 DESC, 순서;
```

---

## 🎨 **작업지시 페이지에서 확인**

### **작업지시 관리 페이지**

```
┌─────────────────────────────────────────────────────────┐
│ 📋 작업지시 목록                                        │
├─────────────────────────────────────────────────────────┤
│ WO-001 │ 스마트폰 케이스 │ 1000개 │ 대기 │            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔧 공정 라우팅 (작업지시 생성 시점 스냅샷)             │
├─────────────────────────────────────────────────────────┤
│ 순서 │ 라인  │ 공정 │ 주설비    │ 표준공수 │           │
│  1   │ L001  │ 사출 │ 사출기-01 │  2.5     │           │
│  2   │ L001  │ 조립 │ 조립라인  │  1.0     │           │
│  3   │ L001  │ 검사 │ 검사대    │  0.5     │           │
│  4   │ L002  │ 포장 │ 포장기    │  0.3     │           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🧱 공정별 자재 (작업지시 생성 시점 스냅샷)             │
├─────────────────────────────────────────────────────────┤
│ 공정 │ 자재명        │ 수량 │ 단위 │ 손실율 │           │
│ 사출 │ 플라스틱 원료 │  100 │  g   │  5%    │           │
│ 사출 │ 금형이형제    │   10 │  ml  │  0%    │           │
│ 조립 │ 나사          │    4 │  개  │  0%    │           │
│ 조립 │ 접착제        │    5 │  ml  │  0%    │           │
│ 포장 │ 포장박스      │    1 │  개  │  0%    │           │
└─────────────────────────────────────────────────────────┘
```

**💡 Tip:** 
- BOM정보 페이지에서 공정이나 자재를 변경해도
- 기존 작업지시의 "공정 라우팅" 및 "공정별 자재"는 변경되지 않음!
- 새로운 작업지시를 추가하면 최신 BOM 정보가 스냅샷으로 저장됨

---

## ⚠️ **주의사항**

### **1. BOM이 없는 제품**

제품에 BOM이 등록되지 않은 경우:
```
⚠️ 제품 PROD-999의 BOM이 없습니다. 작업지시만 생성됨.
```
- 작업지시는 정상적으로 생성됨
- 공정 라우팅 및 자재 정보는 빈 상태

**해결:** BOM정보 페이지에서 해당 제품의 BOM을 먼저 등록

---

### **2. 최종 리비전 선택 로직**

```sql
SELECT TOP 1 id, revision
FROM boms
WHERE product_code = @productCode AND status = 'active'
ORDER BY 
  CAST(SUBSTRING(revision, 5, LEN(revision) - 4) AS INT) DESC,
  created_at DESC
```

**리비전 형식:** `Rev.01`, `Rev.02`, `Rev.03`, ...
- 숫자 부분을 기준으로 내림차순 정렬
- 동일 숫자일 경우 생성일시 기준 최신

---

### **3. 작업지시 삭제 시 자동 처리**

작업지시 삭제 시 연결된 스냅샷도 자동 삭제됩니다 (CASCADE).

```sql
DELETE FROM work_orders WHERE id = 12;
-- work_order_routing_steps의 해당 데이터 자동 삭제
-- work_order_materials의 해당 데이터 자동 삭제
```

---

## 🧪 **테스트 체크리스트**

### ✅ **기본 기능 테스트**

- [ ] 1. BOM이 있는 제품으로 작업지시 추가 시 스냅샷 생성 확인
- [ ] 2. BOM 정보 변경 후 기존 작업지시의 스냅샷 불변 확인
- [ ] 3. BOM 변경 후 새 작업지시 추가 시 최신 정보로 스냅샷 생성 확인
- [ ] 4. 작업지시 삭제 시 스냅샷 자동 삭제 확인

### ✅ **Edge Case 테스트**

- [ ] 5. BOM이 없는 제품으로 작업지시 추가 (작업지시만 생성)
- [ ] 6. 여러 리비전(Rev.01, Rev.02, Rev.03)이 있을 때 최종 리비전 선택 확인
- [ ] 7. BOM에 라우팅만 있고 자재가 없는 경우
- [ ] 8. BOM에 자재만 있고 라우팅이 없는 경우

---

## 📊 **데이터 흐름 다이어그램**

```
┌─────────────────────────────────────────────────────────────┐
│                    작업지시 추가 프로세스                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. 사용자: 제품 + 수량 입력                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API: POST /api/mes/work-orders                           │
│    - INSERT INTO work_orders (...) OUTPUT INSERTED.id       │
│    - newWorkOrderId = 12                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API: 최종 리비전 BOM 조회                                │
│    - SELECT TOP 1 id FROM boms WHERE product_code = ...     │
│    - 결과: BOM ID = 7, Rev.03                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API: BOM 라우팅 단계 조회 및 스냅샷 저장                │
│    - SELECT * FROM bom_routing_steps WHERE bom_id = 7       │
│    - 결과: 4개 공정 단계                                    │
│    - Loop: INSERT INTO work_order_routing_steps             │
│      (work_order_id=12, sequence, line, process, ...)       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. API: BOM 자재 정보 조회 및 스냅샷 저장                  │
│    - SELECT * FROM bom_items WHERE bom_id = 7               │
│    - 결과: 5개 자재 정보                                    │
│    - Loop: INSERT INTO work_order_materials                 │
│      (work_order_id=12, process_name, material_code, ...)   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. 콘솔 로그:                                               │
│    📋 제품 PROD-001의 최종 BOM: Rev.03 (ID: 7)              │
│    ✅ 라우팅 단계 4개 스냅샷 저장됨                         │
│    ✅ 자재 정보 5개 스냅샷 저장됨                           │
│    🎉 작업지시 12 생성 완료 (BOM: Rev.03)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 **완료!**

이제 작업지시 추가 시 BOM의 최종 리비전 공정 라우팅과 자재 정보가 스냅샷으로 저장되어, 나중에 BOM이 변경되어도 기존 작업지시는 영향을 받지 않습니다.

**테스트 방법:**
1. 브라우저 새로고침 (Ctrl + Shift + R)
2. BOM정보 페이지에서 제품의 BOM 확인
3. 작업지시 관리 페이지에서 작업지시 추가
4. 터미널에서 스냅샷 저장 로그 확인
5. BOM정보 페이지에서 공정/자재 변경
6. 작업지시 관리 페이지에서 기존 작업지시의 정보 확인 (불변!)
7. 새로운 작업지시 추가 (최신 BOM으로 스냅샷 생성!)

---

## 📞 **문제 해결**

### **에러: "Invalid object name 'work_order_routing_steps'"**

**원인:** 데이터베이스에 테이블이 생성되지 않음

**해결:**
```bash
# SQL 스크립트 실행
create-work-order-snapshot-tables.sql
```

### **작업지시에 라우팅/자재 정보가 없음**

**원인:** 
1. 해당 제품에 BOM이 등록되지 않음
2. BOM에 라우팅/자재 정보가 없음

**해결:**
- BOM정보 페이지에서 BOM 등록 또는 라우팅/자재 추가

---

**버전:** 1.0.0  
**작성일:** 2025-01-11  
**작성자:** AI Assistant


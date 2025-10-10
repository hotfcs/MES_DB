# 📊 샘플 데이터 삽입 가이드

## 🎯 샘플 데이터 개요

`insert-sample-data.sql` 파일에 다음 샘플 데이터가 포함되어 있습니다:

### 📋 데이터 구성

| 테이블 | 개수 | 설명 |
|--------|------|------|
| **부서** | 6개 | 생산관리팀, 품질관리팀, 자재관리팀, 설비관리팀, IT팀, 영업팀 |
| **역할** | 4개 | 시스템관리자, 부서관리자, 작업자, 조회자 |
| **사용자** | 6개 | admin + 5명 추가 (manager01, worker01~02, quality01, material01) |
| **거래처** | 5개 | 삼성전자, LG전자, 현대제철, 포스코, 협력업체A |
| **제품** | 6개 | 스마트폰 케이스, 태블릿 거치대, 무선충전기 등 |
| **자재** | 6개 | ABS 플라스틱, 실리콘, 알루미늄 판재, PCB 기판 등 |
| **라인** | 6개 | 사출 1~2호기, 조립 1~2호기, 검사 라인, 포장 라인 |
| **설비** | 5개 | 사출기, 조립기, 검사기, 포장기 |
| **공정** | 6개 | 플라스틱 사출, 실리콘 성형, 부품 조립, 검사, 포장 |
| **라우팅** | 3개 | 스마트폰 케이스, 무선충전기, 태블릿 거치대 생산 |
| **라우팅 단계** | 9개 | 각 라우팅별 공정 흐름 |
| **BOM** | 2개 | 스마트폰 케이스, 무선충전기 BOM |
| **BOM 아이템** | 7개 | 각 BOM의 자재 명세 |
| **창고** | 4개 | 원자재창고, 부자재창고, 공정창고, 제품창고 |
| **생산계획** | 4개 | 1~2월 생산계획 |
| **작업지시** | 5개 | 완료, 진행중, 대기 상태 포함 |
| **생산실적** | 5개 | 실제 생산 결과 데이터 |

## 🚀 삽입 방법

### 방법 1: Azure Portal Query Editor (권장)

1. **Azure Portal** 접속 (https://portal.azure.com)
2. **SQL databases** → `MES` 데이터베이스 선택
3. 왼쪽 메뉴 **Query editor** 클릭
4. 로그인:
   - Authentication: SQL Server authentication
   - Login: 실제 사용자명
   - Password: 실제 비밀번호
5. `insert-sample-data.sql` 파일 열기
6. **전체 내용 복사**
7. Query Editor에 **붙여넣기**
8. **Run** 버튼 클릭
9. 완료 메시지 확인

### 방법 2: SQL Server Management Studio (SSMS)

1. SSMS 실행
2. 서버 연결:
   - Server: `hotfcs-sql-server.database.windows.net`
   - Authentication: SQL Server Authentication
   - Login: 실제 사용자명
   - Password: 실제 비밀번호
3. 데이터베이스 `MES` 선택
4. **New Query** → `insert-sample-data.sql` 파일 열기
5. **Execute (F5)** 실행

### 방법 3: Azure Data Studio

1. Azure Data Studio 실행
2. 연결 정보 입력 후 접속
3. `MES` 데이터베이스 선택
4. 새 쿼리 → `insert-sample-data.sql` 파일 내용 붙여넣기
5. **Run** 실행

## ✅ 삽입 후 확인

SQL 실행 후 다음과 같은 결과가 표시됩니다:

```
====================================
샘플 데이터 삽입 완료!
====================================

TableName          Count
----------------   -----
BOM Items          7
BOMs               2
Customers          5
Departments        6
Equipments         5
Lines              6
Login History      2
Materials          6
Processes          6
Production Plans   4
Production Results 5
Products           6
Roles              4
Routing Steps      9
Routings           3
Users              6
Warehouses         4
Work Orders        5
```

## 🎨 웹 페이지에서 확인

샘플 데이터 삽입 후 다음 페이지에서 데이터를 확인할 수 있습니다:

### 기초정보관리

- ✅ **사용자정보** (`/basic-info/users`)
  - admin, manager01, worker01, worker02, quality01, material01

- ✅ **사용자권한** (`/basic-info/roles`)
  - 시스템관리자, 부서관리자, 작업자, 조회자

- ✅ **부서정보** (`/basic-info/departments`)
  - 생산관리팀, 품질관리팀, 자재관리팀, 설비관리팀, IT팀, 영업팀

- ✅ **로그인이력** (`/basic-info/login-history`)
  - admin의 로그인/로그아웃 이력

- ✅ **거래처정보** (`/basic-info/customers`)
  - 삼성전자, LG전자, 현대제철, 포스코, 협력업체A

- ✅ **제품정보** (`/basic-info/products`)
  - 스마트폰 케이스, 태블릿 거치대, 무선 충전기, 노트북 파우치

- ✅ **자재정보** (`/basic-info/materials`)
  - ABS 플라스틱, 실리콘, 알루미늄, PCB 기판, 코일, 포장 박스

- ✅ **라인정보** (`/basic-info/lines`)
  - 사출 1~2호기, 조립 1~2호기, 검사 라인, 포장 라인

- ✅ **설비정보** (`/basic-info/equipments`)
  - 사출기 A/B, 자동 조립기, 비전 검사기, 포장기

- ✅ **공정정보** (`/basic-info/processes`)
  - 플라스틱 사출, 실리콘 성형, 부품 조립, 검사, 포장

- ✅ **창고정보** (`/basic-info/warehouses`)
  - 원자재창고, 부자재창고, 공정창고, 제품창고

- ✅ **라우팅정보** (`/basic-info/routings`)
  - 스마트폰 케이스 생산, 무선충전기 생산, 태블릿 거치대 생산

- ✅ **BOM정보** (`/basic-info/bom`)
  - 스마트폰 케이스 BOM, 무선충전기 BOM

### 생산관리

- ✅ **생산계획** (`/production/plan`)
  - 2024년 1~2월 생산계획 4건

- ✅ **작업지시** (`/production/work-order`)
  - 완료 3건, 진행중 1건, 대기 1건

## 📝 테스트 계정

삽입된 사용자 계정으로 로그인 테스트 가능:

| 계정 | 비밀번호 | 역할 | 부서 |
|------|----------|------|------|
| admin | admin123 | 시스템관리자 | IT팀 |
| manager01 | pass1234 | 부서관리자 | 생산관리팀 |
| worker01 | pass1234 | 작업자 | 생산관리팀 |
| worker02 | pass1234 | 작업자 | 생산관리팀 |
| quality01 | pass1234 | 작업자 | 품질관리팀 |
| material01 | pass1234 | 작업자 | 자재관리팀 |

## ⚠️ 주의사항

### 중복 실행 시

스크립트를 여러 번 실행하면 데이터가 중복 삽입될 수 있습니다.

**해결 방법:**

1. **기존 데이터 삭제 후 재삽입**
   - `insert-sample-data.sql` 파일 상단의 주석 처리된 DELETE 문 활성화

2. **전체 테이블 초기화**
   ```sql
   -- 모든 데이터 삭제 (주의!)
   DELETE FROM production_results;
   DELETE FROM work_orders;
   DELETE FROM production_plans;
   DELETE FROM bom_items;
   DELETE FROM boms;
   DELETE FROM routing_steps;
   DELETE FROM routings;
   DELETE FROM warehouses;
   DELETE FROM processes;
   DELETE FROM equipments;
   DELETE FROM lines;
   DELETE FROM materials;
   DELETE FROM products;
   DELETE FROM customers;
   DELETE FROM login_history WHERE user_id > 1;
   DELETE FROM roles;
   DELETE FROM departments;
   DELETE FROM users WHERE id > 1;
   ```

## 🎯 다음 단계

샘플 데이터 삽입 후:

1. ✅ 웹 페이지에서 데이터 확인
2. ✅ CRUD 기능 테스트
3. ✅ 검색/필터링 테스트
4. ✅ 권한별 접근 테스트

---

**모든 페이지에서 실제 데이터를 확인할 수 있습니다!** 🎉


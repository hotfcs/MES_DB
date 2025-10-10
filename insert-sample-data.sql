-- ====================================
-- MES 시스템 샘플 데이터 삽입 스크립트
-- ====================================

-- 기존 데이터 정리 (선택사항)
-- DELETE FROM production_results;
-- DELETE FROM work_orders;
-- DELETE FROM production_plans;
-- DELETE FROM bom_items;
-- DELETE FROM boms;
-- DELETE FROM routing_steps;
-- DELETE FROM routings;
-- DELETE FROM warehouses;
-- DELETE FROM processes;
-- DELETE FROM equipments;
-- DELETE FROM lines;
-- DELETE FROM materials;
-- DELETE FROM products;
-- DELETE FROM customers;
-- DELETE FROM login_history;
-- DELETE FROM roles;
-- DELETE FROM departments;
-- DELETE FROM users WHERE id > 1;

-- ====================================
-- 1. 부서 (Departments)
-- ====================================

INSERT INTO departments (name, code, manager, description, status, created_at) VALUES
(N'생산관리팀', 'DEPT-001', N'김팀장', N'생산 계획 및 관리', 'active', GETDATE()),
(N'품질관리팀', 'DEPT-002', N'이팀장', N'품질 검사 및 관리', 'active', GETDATE()),
(N'자재관리팀', 'DEPT-003', N'박팀장', N'자재 수급 및 재고 관리', 'active', GETDATE()),
(N'설비관리팀', 'DEPT-004', N'정팀장', N'설비 유지보수', 'active', GETDATE()),
(N'IT팀', 'DEPT-005', N'최팀장', N'정보시스템 관리', 'active', GETDATE()),
(N'영업팀', 'DEPT-006', N'강팀장', N'영업 및 고객 관리', 'active', GETDATE());

GO

-- ====================================
-- 2. 역할/권한 (Roles)
-- ====================================

INSERT INTO roles (code, name, description, permissions, status, created_at) VALUES
('ADMIN', N'시스템관리자', N'모든 권한 보유', '["ALL"]', 'active', GETDATE()),
('MANAGER', N'부서관리자', N'부서 내 모든 권한', '["USERS_VIEW","USERS_EDIT","PRODUCTS_VIEW","PRODUCTS_EDIT","WORK_ORDER_VIEW","WORK_ORDER_EDIT"]', 'active', GETDATE()),
('WORKER', N'작업자', N'생산 관련 권한', '["WORK_ORDER_VIEW","PRODUCTION_RESULT_EDIT"]', 'active', GETDATE()),
('VIEWER', N'조회자', N'조회만 가능', '["USERS_VIEW","PRODUCTS_VIEW","WORK_ORDER_VIEW"]', 'active', GETDATE());

GO

-- ====================================
-- 3. 사용자 (Users) - admin은 이미 존재
-- ====================================

INSERT INTO users (account, password, name, role, department, position, phone, email, status, join_date, created_at) VALUES
('manager01', 'pass1234', N'김관리', N'부서관리자', N'생산관리팀', N'팀장', '010-1111-1111', 'manager01@company.com', 'active', '2023-01-01', GETDATE()),
('worker01', 'pass1234', N'이작업', N'작업자', N'생산관리팀', N'사원', '010-2222-2222', 'worker01@company.com', 'active', '2023-03-01', GETDATE()),
('worker02', 'pass1234', N'박작업', N'작업자', N'생산관리팀', N'사원', '010-3333-3333', 'worker02@company.com', 'active', '2023-03-15', GETDATE()),
('quality01', 'pass1234', N'정품질', N'작업자', N'품질관리팀', N'대리', '010-4444-4444', 'quality01@company.com', 'active', '2023-02-01', GETDATE()),
('material01', 'pass1234', N'최자재', N'작업자', N'자재관리팀', N'사원', '010-5555-5555', 'material01@company.com', 'active', '2023-04-01', GETDATE());

GO

-- ====================================
-- 4. 거래처 (Customers)
-- ====================================

INSERT INTO customers (code, name, type, representative, business_number, phone, email, address, manager, manager_phone, status, created_at) VALUES
('CUST-001', N'삼성전자', N'고객사', N'김대표', '123-45-67890', '02-1234-5678', 'samsung@samsung.com', N'서울시 강남구', N'김담당', '010-1234-5678', 'active', GETDATE()),
('CUST-002', N'LG전자', N'고객사', N'이대표', '234-56-78901', '02-2345-6789', 'lg@lg.com', N'서울시 영등포구', N'이담당', '010-2345-6789', 'active', GETDATE()),
('SUPP-001', N'현대제철', N'공급업체', N'박대표', '345-67-89012', '02-3456-7890', 'steel@hyundai.com', N'경기도 안산시', N'박담당', '010-3456-7890', 'active', GETDATE()),
('SUPP-002', N'포스코', N'공급업체', N'정대표', '456-78-90123', '02-4567-8901', 'posco@posco.com', N'경북 포항시', N'정담당', '010-4567-8901', 'active', GETDATE()),
('PART-001', N'협력업체A', N'협력업체', N'최대표', '567-89-01234', '02-5678-9012', 'partner@company.com', N'경기도 수원시', N'최담당', '010-5678-9012', 'active', GETDATE());

GO

-- ====================================
-- 5. 제품 (Products)
-- ====================================

INSERT INTO products (code, name, category, specification, unit, standard_cost, selling_price, customer, description, status, created_at) VALUES
('PRD-001', N'스마트폰 케이스', N'제품', N'iPhone 15 Pro', 'EA', 5000, 15000, N'삼성전자', N'프리미엄 실리콘 케이스', 'active', GETDATE()),
('PRD-002', N'태블릿 거치대', N'제품', N'10-13인치용', 'EA', 8000, 25000, N'LG전자', N'각도 조절 가능', 'active', GETDATE()),
('PRD-003', N'무선 충전기', N'제품', N'15W 고속충전', 'EA', 12000, 35000, N'삼성전자', N'퀵차지 지원', 'active', GETDATE()),
('PRD-004', N'노트북 파우치', N'제품', N'15.6인치', 'EA', 7000, 20000, N'LG전자', N'방수 소재', 'active', GETDATE()),
('SEMI-001', N'플라스틱 몸체', N'반제품', N'ABS 재질', 'EA', 2000, 0, N'', N'케이스 몸체', 'active', GETDATE()),
('SEMI-002', N'충전 모듈', N'반제품', N'15W', 'EA', 8000, 0, N'', N'무선충전 모듈', 'active', GETDATE());

GO

-- ====================================
-- 6. 자재 (Materials)
-- ====================================

INSERT INTO materials (code, name, category, specification, unit, purchase_price, supplier, description, status, created_at) VALUES
('MAT-001', N'ABS 플라스틱', N'원자재', N'고강도', 'KG', 3000, N'현대제철', N'케이스용 플라스틱', 'active', GETDATE()),
('MAT-002', N'실리콘', N'원자재', N'의료용 등급', 'KG', 5000, N'포스코', N'부드러운 촉감', 'active', GETDATE()),
('MAT-003', N'알루미늄 판재', N'원자재', N'6061-T6', 'KG', 7000, N'현대제철', N'거치대용', 'active', GETDATE()),
('MAT-004', N'PCB 기판', N'부자재', N'2층 기판', 'EA', 2000, N'협력업체A', N'충전기용', 'active', GETDATE()),
('MAT-005', N'코일', N'부자재', N'구리선', 'EA', 1500, N'협력업체A', N'무선충전 코일', 'active', GETDATE()),
('MAT-006', N'포장 박스', N'부자재', N'골판지', 'EA', 500, N'협력업체A', N'제품 포장용', 'active', GETDATE());

GO

-- ====================================
-- 7. 생산라인 (Lines)
-- ====================================

INSERT INTO lines (code, name, location, capacity, manager, description, status, created_at) VALUES
('LINE-001', N'사출 1호기', N'1공장 A동', 1000, N'김관리', N'플라스틱 사출 라인', 'active', GETDATE()),
('LINE-002', N'사출 2호기', N'1공장 A동', 1000, N'이작업', N'플라스틱 사출 라인', 'active', GETDATE()),
('LINE-003', N'조립 1호기', N'1공장 B동', 500, N'박작업', N'제품 조립 라인', 'active', GETDATE()),
('LINE-004', N'조립 2호기', N'1공장 B동', 500, N'정품질', N'제품 조립 라인', 'active', GETDATE()),
('LINE-005', N'검사 라인', N'1공장 C동', 800, N'정품질', N'품질 검사 라인', 'active', GETDATE()),
('LINE-006', N'포장 라인', N'1공장 D동', 1200, N'최자재', N'제품 포장 라인', 'active', GETDATE());

GO

-- ====================================
-- 8. 설비 (Equipments)
-- ====================================

INSERT INTO equipments (code, name, type, manufacturer, model, purchase_date, line, manager, description, status, created_at) VALUES
('EQ-001', N'사출기 A', N'사출기', N'현대중공업', 'HIM-500', '2022-01-15', N'사출 1호기', N'김관리', N'500톤 사출기', 'active', GETDATE()),
('EQ-002', N'사출기 B', N'사출기', N'현대중공업', 'HIM-500', '2022-02-20', N'사출 2호기', N'이작업', N'500톤 사출기', 'active', GETDATE()),
('EQ-003', N'자동 조립기', N'조립기', N'삼성테크윈', 'SM-100', '2022-03-10', N'조립 1호기', N'박작업', N'자동화 조립 설비', 'active', GETDATE()),
('EQ-004', N'비전 검사기', N'검사기', N'LG이노텍', 'VI-200', '2022-04-05', N'검사 라인', N'정품질', N'자동 외관 검사', 'active', GETDATE()),
('EQ-005', N'포장기', N'포장기', N'한화기계', 'PK-300', '2022-05-15', N'포장 라인', N'최자재', N'자동 포장 설비', 'active', GETDATE());

GO

-- ====================================
-- 9. 공정 (Processes)
-- ====================================

INSERT INTO processes (code, name, type, standard_time, line, warehouse, description, status, created_at) VALUES
('PROC-001', N'플라스틱 사출', N'사출', 10, N'사출 1호기', N'원자재창고', N'ABS 플라스틱 사출', 'active', GETDATE()),
('PROC-002', N'실리콘 성형', N'성형', 15, N'사출 2호기', N'원자재창고', N'실리콘 커버 성형', 'active', GETDATE()),
('PROC-003', N'부품 조립', N'조립', 20, N'조립 1호기', N'자재창고', N'부품 조립', 'active', GETDATE()),
('PROC-004', N'기능 검사', N'검사', 5, N'검사 라인', N'공정창고', N'기능 테스트', 'active', GETDATE()),
('PROC-005', N'외관 검사', N'검사', 3, N'검사 라인', N'공정창고', N'외관 품질 검사', 'active', GETDATE()),
('PROC-006', N'포장', N'포장', 5, N'포장 라인', N'제품창고', N'제품 포장', 'active', GETDATE());

GO

-- ====================================
-- 10. 라우팅 (Routings)
-- ====================================

SET IDENTITY_INSERT routings ON;

INSERT INTO routings (id, code, name, status, created_at) VALUES
(1, 'ROUTE-001', N'스마트폰 케이스 생산', 'active', GETDATE()),
(2, 'ROUTE-002', N'무선충전기 생산', 'active', GETDATE()),
(3, 'ROUTE-003', N'태블릿 거치대 생산', 'active', GETDATE());

SET IDENTITY_INSERT routings OFF;

GO

-- ====================================
-- 11. 라우팅 단계 (Routing Steps)
-- ====================================

-- 스마트폰 케이스 라우팅
INSERT INTO routing_steps (routing_id, sequence, line, process, main_equipment, standard_man_hours, previous_process, next_process) VALUES
(1, 1, N'사출 1호기', N'플라스틱 사출', N'사출기 A', 1.0, N'', N'실리콘 성형'),
(1, 2, N'사출 2호기', N'실리콘 성형', N'사출기 B', 1.5, N'플라스틱 사출', N'부품 조립'),
(1, 3, N'조립 1호기', N'부품 조립', N'자동 조립기', 2.0, N'실리콘 성형', N'외관 검사'),
(1, 4, N'검사 라인', N'외관 검사', N'비전 검사기', 0.5, N'부품 조립', N'포장'),
(1, 5, N'포장 라인', N'포장', N'포장기', 0.5, N'외관 검사', N'');

-- 무선충전기 라우팅
INSERT INTO routing_steps (routing_id, sequence, line, process, main_equipment, standard_man_hours, previous_process, next_process) VALUES
(2, 1, N'사출 1호기', N'플라스틱 사출', N'사출기 A', 1.0, N'', N'부품 조립'),
(2, 2, N'조립 1호기', N'부품 조립', N'자동 조립기', 3.0, N'플라스틱 사출', N'기능 검사'),
(2, 3, N'검사 라인', N'기능 검사', N'비전 검사기', 1.0, N'부품 조립', N'포장'),
(2, 4, N'포장 라인', N'포장', N'포장기', 0.5, N'기능 검사', N'');

GO

-- ====================================
-- 12. BOM (Bill of Materials)
-- ====================================

SET IDENTITY_INSERT boms ON;

INSERT INTO boms (id, product_code, product_name, routing_id, routing_name, revision, status, created_at) VALUES
(1, 'PRD-001', N'스마트폰 케이스', 1, N'스마트폰 케이스 생산', 'V1.0', 'active', GETDATE()),
(2, 'PRD-003', N'무선 충전기', 2, N'무선충전기 생산', 'V1.0', 'active', GETDATE());

SET IDENTITY_INSERT boms OFF;

GO

-- ====================================
-- 13. BOM 아이템 (BOM Items)
-- ====================================

-- 스마트폰 케이스 BOM
INSERT INTO bom_items (bom_id, process_sequence, process_name, material_code, material_name, quantity, unit, loss_rate, alternate_material) VALUES
(1, 1, N'플라스틱 사출', 'MAT-001', N'ABS 플라스틱', 0.05, 'KG', 5, N''),
(1, 2, N'실리콘 성형', 'MAT-002', N'실리콘', 0.03, 'KG', 3, N''),
(1, 5, N'포장', 'MAT-006', N'포장 박스', 1, 'EA', 1, N'');

-- 무선충전기 BOM
INSERT INTO bom_items (bom_id, process_sequence, process_name, material_code, material_name, quantity, unit, loss_rate, alternate_material) VALUES
(2, 1, N'플라스틱 사출', 'MAT-001', N'ABS 플라스틱', 0.08, 'KG', 5, N''),
(2, 2, N'부품 조립', 'MAT-004', N'PCB 기판', 1, 'EA', 2, N''),
(2, 2, N'부품 조립', 'MAT-005', N'코일', 1, 'EA', 2, N''),
(2, 4, N'포장', 'MAT-006', N'포장 박스', 1, 'EA', 1, N'');

GO

-- ====================================
-- 14. 창고 (Warehouses)
-- ====================================

INSERT INTO warehouses (code, name, type, location, capacity, manager, description, status, created_at) VALUES
('WH-001', N'원자재 창고 A', N'원자재창고', N'1공장 1층', 10000, N'최자재', N'플라스틱, 금속 보관', 'active', GETDATE()),
('WH-002', N'부자재 창고 B', N'자재창고', N'1공장 1층', 5000, N'최자재', N'부품, 포장재 보관', 'active', GETDATE()),
('WH-003', N'공정 창고 C', N'공정창고', N'1공장 2층', 3000, N'김관리', N'공정 중 임시 보관', 'active', GETDATE()),
('WH-004', N'제품 창고 D', N'제품창고', N'2공장 1층', 15000, N'최자재', N'완제품 보관', 'active', GETDATE());

GO

-- ====================================
-- 15. 생산계획 (Production Plans)
-- ====================================

INSERT INTO production_plans (plan_code, plan_date, product_code, product_name, plan_quantity, unit, start_date, end_date, status, manager, note, created_at) VALUES
('PLAN-2024-001', '2024-01-01', 'PRD-001', N'스마트폰 케이스', 1000, 'EA', '2024-01-05', '2024-01-10', N'완료', N'김관리', N'1월 정기 생산', GETDATE()),
('PLAN-2024-002', '2024-01-15', 'PRD-003', N'무선 충전기', 500, 'EA', '2024-01-20', '2024-01-25', N'완료', N'김관리', N'1월 정기 생산', GETDATE()),
('PLAN-2024-003', '2024-02-01', 'PRD-001', N'스마트폰 케이스', 1500, 'EA', '2024-02-05', '2024-02-12', N'진행중', N'김관리', N'2월 정기 생산', GETDATE()),
('PLAN-2024-004', '2024-02-01', 'PRD-002', N'태블릿 거치대', 800, 'EA', '2024-02-10', '2024-02-15', N'계획', N'김관리', N'신규 주문', GETDATE());

GO

-- ====================================
-- 16. 작업지시 (Work Orders)
-- ====================================

INSERT INTO work_orders (order_code, order_date, plan_code, product_code, product_name, order_quantity, unit, line, start_date, end_date, status, worker, note, created_at) VALUES
('WO-2024-001', '2024-01-05', 'PLAN-2024-001', 'PRD-001', N'스마트폰 케이스', 500, 'EA', N'사출 1호기', '2024-01-05', '2024-01-07', N'완료', N'이작업', N'', GETDATE()),
('WO-2024-002', '2024-01-08', 'PLAN-2024-001', 'PRD-001', N'스마트폰 케이스', 500, 'EA', N'사출 1호기', '2024-01-08', '2024-01-10', N'완료', N'이작업', N'', GETDATE()),
('WO-2024-003', '2024-01-20', 'PLAN-2024-002', 'PRD-003', N'무선 충전기', 500, 'EA', N'조립 1호기', '2024-01-20', '2024-01-25', N'완료', N'박작업', N'', GETDATE()),
('WO-2024-004', '2024-02-05', 'PLAN-2024-003', 'PRD-001', N'스마트폰 케이스', 750, 'EA', N'사출 1호기', '2024-02-05', '2024-02-08', N'진행중', N'이작업', N'', GETDATE()),
('WO-2024-005', '2024-02-09', 'PLAN-2024-003', 'PRD-001', N'스마트폰 케이스', 750, 'EA', N'사출 2호기', '2024-02-09', '2024-02-12', N'대기', N'이작업', N'', GETDATE());

GO

-- ====================================
-- 17. 생산실적 (Production Results)
-- ====================================

INSERT INTO production_results (result_code, result_date, order_code, product_code, product_name, line, process_sequence, process_name, target_quantity, result_quantity, defect_quantity, unit, worker, start_time, end_time, note, created_at) VALUES
('RES-2024-001', '2024-01-05', 'WO-2024-001', 'PRD-001', N'스마트폰 케이스', N'사출 1호기', 1, N'플라스틱 사출', 500, 495, 5, 'EA', N'이작업', '2024-01-05 08:00:00', '2024-01-05 16:00:00', N'양호', GETDATE()),
('RES-2024-002', '2024-01-06', 'WO-2024-001', 'PRD-001', N'스마트폰 케이스', N'조립 1호기', 3, N'부품 조립', 495, 490, 5, 'EA', N'박작업', '2024-01-06 08:00:00', '2024-01-06 17:00:00', N'양호', GETDATE()),
('RES-2024-003', '2024-01-07', 'WO-2024-001', 'PRD-001', N'스마트폰 케이스', N'검사 라인', 4, N'외관 검사', 490, 488, 2, 'EA', N'정품질', '2024-01-07 08:00:00', '2024-01-07 12:00:00', N'양호', GETDATE()),
('RES-2024-004', '2024-01-20', 'WO-2024-003', 'PRD-003', N'무선 충전기', N'조립 1호기', 2, N'부품 조립', 500, 495, 5, 'EA', N'박작업', '2024-01-20 08:00:00', '2024-01-20 18:00:00', N'', GETDATE()),
('RES-2024-005', '2024-01-21', 'WO-2024-003', 'PRD-003', N'무선 충전기', N'검사 라인', 3, N'기능 검사', 495, 490, 5, 'EA', N'정품질', '2024-01-21 08:00:00', '2024-01-21 14:00:00', N'', GETDATE());

GO

-- ====================================
-- 로그인 이력 샘플 데이터
-- ====================================

INSERT INTO login_history (user_id, account, name, action, timestamp, ip_address, host_name) VALUES
(1, 'admin', N'시스템관리자', 'login', DATEADD(HOUR, -2, GETDATE()), '192.168.0.100', 'localhost'),
(1, 'admin', N'시스템관리자', 'logout', DATEADD(HOUR, -1, GETDATE()), '192.168.0.100', 'localhost');

GO

-- ====================================
-- 데이터 확인
-- ====================================

PRINT '====================================';
PRINT '샘플 데이터 삽입 완료!';
PRINT '====================================';

SELECT 'Departments' as TableName, COUNT(*) as Count FROM departments
UNION ALL SELECT 'Roles', COUNT(*) FROM roles
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Customers', COUNT(*) FROM customers
UNION ALL SELECT 'Products', COUNT(*) FROM products
UNION ALL SELECT 'Materials', COUNT(*) FROM materials
UNION ALL SELECT 'Lines', COUNT(*) FROM lines
UNION ALL SELECT 'Equipments', COUNT(*) FROM equipments
UNION ALL SELECT 'Processes', COUNT(*) FROM processes
UNION ALL SELECT 'Routings', COUNT(*) FROM routings
UNION ALL SELECT 'Routing Steps', COUNT(*) FROM routing_steps
UNION ALL SELECT 'BOMs', COUNT(*) FROM boms
UNION ALL SELECT 'BOM Items', COUNT(*) FROM bom_items
UNION ALL SELECT 'Warehouses', COUNT(*) FROM warehouses
UNION ALL SELECT 'Production Plans', COUNT(*) FROM production_plans
UNION ALL SELECT 'Work Orders', COUNT(*) FROM work_orders
UNION ALL SELECT 'Production Results', COUNT(*) FROM production_results
UNION ALL SELECT 'Login History', COUNT(*) FROM login_history
ORDER BY TableName;

GO


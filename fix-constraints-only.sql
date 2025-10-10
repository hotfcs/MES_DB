-- ====================================
-- CHECK Constraint만 수정하는 스크립트
-- (테이블 삭제 없이 빠르게 수정)
-- ====================================

-- 1. customers 테이블 CHECK constraint 제거 및 재생성
DECLARE @ConstraintName NVARCHAR(200);

-- customers.type constraint 제거
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('customers') 
AND COL_NAME(parent_object_id, parent_column_id) = 'type';

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE customers DROP CONSTRAINT ' + @ConstraintName);

-- 새로운 constraint 추가 (N 접두사 포함)
ALTER TABLE customers 
ADD CONSTRAINT CK_customers_type 
CHECK (type IN (N'공급업체', N'고객사', N'협력업체'));

PRINT '✅ customers.type constraint 수정 완료';
GO

-- 2. products 테이블 CHECK constraint 제거 및 재생성
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('products') 
AND COL_NAME(parent_object_id, parent_column_id) = 'category';

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE products DROP CONSTRAINT ' + @ConstraintName);

ALTER TABLE products 
ADD CONSTRAINT CK_products_category 
CHECK (category IN (N'제품', N'반제품', N'상품'));

PRINT '✅ products.category constraint 수정 완료';
GO

-- 3. materials 테이블 CHECK constraint 제거 및 재생성
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('materials') 
AND COL_NAME(parent_object_id, parent_column_id) = 'category';

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE materials DROP CONSTRAINT ' + @ConstraintName);

ALTER TABLE materials 
ADD CONSTRAINT CK_materials_category 
CHECK (category IN (N'원자재', N'부자재'));

PRINT '✅ materials.category constraint 수정 완료';
GO

-- 4. warehouses 테이블 CHECK constraint 제거 및 재생성
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('warehouses') 
AND COL_NAME(parent_object_id, parent_column_id) = 'type';

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE warehouses DROP CONSTRAINT ' + @ConstraintName);

ALTER TABLE warehouses 
ADD CONSTRAINT CK_warehouses_type 
CHECK (type IN (N'원자재창고', N'제품창고', N'자재창고', N'공정창고'));

PRINT '✅ warehouses.type constraint 수정 완료';
GO

-- 5. production_plans 테이블 CHECK constraint 제거 및 재생성
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('production_plans') 
AND COL_NAME(parent_object_id, parent_column_id) = 'status';

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE production_plans DROP CONSTRAINT ' + @ConstraintName);

ALTER TABLE production_plans 
ADD CONSTRAINT CK_production_plans_status 
CHECK (status IN (N'계획', N'진행중', N'완료', N'취소'));

PRINT '✅ production_plans.status constraint 수정 완료';
GO

-- 6. work_orders 테이블 CHECK constraint 제거 및 재생성
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('work_orders') 
AND COL_NAME(parent_object_id, parent_column_id) = 'status';

IF @ConstraintName IS NOT NULL
    EXEC('ALTER TABLE work_orders DROP CONSTRAINT ' + @ConstraintName);

ALTER TABLE work_orders 
ADD CONSTRAINT CK_work_orders_status 
CHECK (status IN (N'대기', N'진행중', N'완료', N'보류'));

PRINT '✅ work_orders.status constraint 수정 완료';
GO

PRINT '====================================';
PRINT '✅ 모든 CHECK Constraint 수정 완료!';
PRINT '이제 insert-sample-data.sql을 실행하세요.';
PRINT '====================================';


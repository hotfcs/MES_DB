-- ====================================
-- 성능 최적화를 위한 인덱스 추가
-- ====================================

USE MES_DB;
GO

-- 1. Products 테이블 인덱스
-- 제품명, 코드로 검색시 성능 향상
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Name' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_Name 
    ON products(name)
    INCLUDE (code, category, specification, unit, status);
    PRINT '✅ IX_Products_Name 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Products_Name 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Code' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_Code 
    ON products(code)
    INCLUDE (name, category, specification, unit, status);
    PRINT '✅ IX_Products_Code 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Products_Code 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Category_Status' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Products_Category_Status 
    ON products(category, status)
    INCLUDE (code, name, selling_price, customer);
    PRINT '✅ IX_Products_Category_Status 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Products_Category_Status 인덱스 이미 존재';

-- 2. Users 테이블 인덱스
-- 사용자명, 계정으로 검색시 성능 향상
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Name' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Name 
    ON users(name)
    INCLUDE (account, role, department, status);
    PRINT '✅ IX_Users_Name 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Users_Name 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Account' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_Account 
    ON users(account);
    PRINT '✅ IX_Users_Account 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Users_Account 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Department_Status' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_Department_Status 
    ON users(department, status)
    INCLUDE (account, name, role, position);
    PRINT '✅ IX_Users_Department_Status 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Users_Department_Status 인덱스 이미 존재';

-- 3. Customers 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Name' AND object_id = OBJECT_ID('customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_Name 
    ON customers(name)
    INCLUDE (code, type, phone, status);
    PRINT '✅ IX_Customers_Name 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Customers_Name 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Code' AND object_id = OBJECT_ID('customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_Code 
    ON customers(code);
    PRINT '✅ IX_Customers_Code 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Customers_Code 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Type_Status' AND object_id = OBJECT_ID('customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_Type_Status 
    ON customers(type, status)
    INCLUDE (code, name, phone, email);
    PRINT '✅ IX_Customers_Type_Status 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Customers_Type_Status 인덱스 이미 존재';

-- 4. Materials 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Materials_Name' AND object_id = OBJECT_ID('materials'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Materials_Name 
    ON materials(name)
    INCLUDE (code, category, specification, status);
    PRINT '✅ IX_Materials_Name 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Materials_Name 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Materials_Code' AND object_id = OBJECT_ID('materials'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Materials_Code 
    ON materials(code);
    PRINT '✅ IX_Materials_Code 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Materials_Code 인덱스 이미 존재';

-- 5. Work Orders 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkOrders_OrderCode' AND object_id = OBJECT_ID('work_orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_WorkOrders_OrderCode 
    ON work_orders(order_code);
    PRINT '✅ IX_WorkOrders_OrderCode 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_WorkOrders_OrderCode 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkOrders_Status' AND object_id = OBJECT_ID('work_orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_WorkOrders_Status 
    ON work_orders(status)
    INCLUDE (order_code, product_name, order_quantity, start_date, end_date);
    PRINT '✅ IX_WorkOrders_Status 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_WorkOrders_Status 인덱스 이미 존재';

-- 6. Production Plans 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductionPlans_PlanCode' AND object_id = OBJECT_ID('production_plans'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProductionPlans_PlanCode 
    ON production_plans(plan_code);
    PRINT '✅ IX_ProductionPlans_PlanCode 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_ProductionPlans_PlanCode 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductionPlans_Status_PlanDate' AND object_id = OBJECT_ID('production_plans'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProductionPlans_Status_PlanDate 
    ON production_plans(status, plan_date DESC);
    PRINT '✅ IX_ProductionPlans_Status_PlanDate 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_ProductionPlans_Status_PlanDate 인덱스 이미 존재';

-- 7. Login History 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoginHistory_UserId_Timestamp' AND object_id = OBJECT_ID('login_history'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_LoginHistory_UserId_Timestamp 
    ON login_history(user_id, timestamp DESC);
    PRINT '✅ IX_LoginHistory_UserId_Timestamp 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_LoginHistory_UserId_Timestamp 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LoginHistory_Timestamp' AND object_id = OBJECT_ID('login_history'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_LoginHistory_Timestamp 
    ON login_history(timestamp DESC);
    PRINT '✅ IX_LoginHistory_Timestamp 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_LoginHistory_Timestamp 인덱스 이미 존재';

-- 8. Departments 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Departments_Code' AND object_id = OBJECT_ID('departments'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Departments_Code 
    ON departments(code);
    PRINT '✅ IX_Departments_Code 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Departments_Code 인덱스 이미 존재';

-- 9. Roles 테이블 인덱스
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Roles_Code' AND object_id = OBJECT_ID('roles'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Roles_Code 
    ON roles(code);
    PRINT '✅ IX_Roles_Code 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Roles_Code 인덱스 이미 존재';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Roles_Name' AND object_id = OBJECT_ID('roles'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Roles_Name 
    ON roles(name)
    INCLUDE (code, description, status);
    PRINT '✅ IX_Roles_Name 인덱스 생성 완료';
END
ELSE
    PRINT 'ℹ️  IX_Roles_Name 인덱스 이미 존재';

-- 10. Full-Text Search 인덱스 (선택사항 - 텍스트 검색 성능 대폭 향상)
-- 주의: Full-Text Search 기능이 Azure SQL에서 활성화되어 있어야 합니다

-- Full-Text Catalog 생성
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'MES_Catalog')
BEGIN
    CREATE FULLTEXT CATALOG MES_Catalog AS DEFAULT;
    PRINT '✅ Full-Text Catalog 생성 완료';
END
ELSE
    PRINT 'ℹ️  Full-Text Catalog 이미 존재';

-- Products Full-Text Index (동적 PK 찾기)
IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('products'))
BEGIN
    DECLARE @pkName NVARCHAR(255);
    
    -- products 테이블의 실제 PK 이름 찾기
    SELECT @pkName = i.name
    FROM sys.indexes i
    INNER JOIN sys.tables t ON i.object_id = t.object_id
    WHERE t.name = 'products' 
      AND i.is_primary_key = 1
      AND i.is_unique = 1;
    
    IF @pkName IS NOT NULL
    BEGIN
        DECLARE @sql NVARCHAR(MAX);
        SET @sql = N'CREATE FULLTEXT INDEX ON products(name, specification) ' +
                   N'KEY INDEX ' + QUOTENAME(@pkName) + N' ' +
                   N'ON MES_Catalog WITH CHANGE_TRACKING AUTO;';
        
        BEGIN TRY
            EXEC sp_executesql @sql;
            PRINT '✅ Products Full-Text Index 생성 완료';
        END TRY
        BEGIN CATCH
            PRINT '⚠️  Full-Text Index 생성 건너뜀 (선택사항, 성능에 큰 영향 없음)';
            PRINT '   오류: ' + ERROR_MESSAGE();
        END CATCH
    END
    ELSE
    BEGIN
        PRINT '⚠️  Products 테이블의 PK를 찾을 수 없어 Full-Text Index 건너뜀';
    END
END
ELSE
    PRINT 'ℹ️  Products Full-Text Index 이미 존재';

-- 통계 정보 업데이트 (쿼리 최적화에 필수)
UPDATE STATISTICS products WITH FULLSCAN;
UPDATE STATISTICS users WITH FULLSCAN;
UPDATE STATISTICS customers WITH FULLSCAN;
UPDATE STATISTICS materials WITH FULLSCAN;
UPDATE STATISTICS work_orders WITH FULLSCAN;
UPDATE STATISTICS production_plans WITH FULLSCAN;
UPDATE STATISTICS login_history WITH FULLSCAN;

PRINT '';
PRINT '🎉 ====================================';
PRINT '🎉 모든 성능 최적화 인덱스 생성 완료!';
PRINT '🎉 ====================================';
PRINT '';
PRINT '📊 생성된 인덱스 확인:';
PRINT '';

-- 생성된 인덱스 목록 출력
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    CASE WHEN i.is_unique = 1 THEN 'Yes' ELSE 'No' END AS IsUnique
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name LIKE 'IX_%'
ORDER BY t.name, i.name;

GO


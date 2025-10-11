-- ====================================
-- 이미지 컬럼 변경: Base64 → Azure Blob URL
-- ====================================
-- 실행 전 주의: 기존 Base64 데이터는 손실됩니다.
-- 백업을 먼저 수행하세요!

USE [your-database-name];
GO

-- 1. 사용자 테이블 이미지 컬럼 변경
ALTER TABLE users 
ALTER COLUMN image NVARCHAR(1000);
GO

PRINT '✅ users.image 컬럼 변경 완료 (NVARCHAR(500) → NVARCHAR(1000))';
GO

-- 2. 제품 테이블 이미지 컬럼 변경
ALTER TABLE products 
ALTER COLUMN image NVARCHAR(1000);
GO

PRINT '✅ products.image 컬럼 변경 완료 (NVARCHAR(500) → NVARCHAR(1000))';
GO

-- 3. 자재 테이블 이미지 컬럼 변경
ALTER TABLE materials 
ALTER COLUMN image NVARCHAR(1000);
GO

PRINT '✅ materials.image 컬럼 변경 완료 (NVARCHAR(500) → NVARCHAR(1000))';
GO

-- 4. (선택사항) 기존 Base64 데이터 정리
-- Base64 데이터는 'data:image/'로 시작하므로 이를 NULL로 변경
UPDATE users 
SET image = NULL 
WHERE image LIKE 'data:image/%';

UPDATE products 
SET image = NULL 
WHERE image LIKE 'data:image/%';

UPDATE materials 
SET image = NULL 
WHERE image LIKE 'data:image/%';

PRINT '✅ 기존 Base64 이미지 데이터 정리 완료';
GO

-- 5. 변경 내역 확인
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
GO

PRINT '====================================';
PRINT '이미지 컬럼 업데이트 완료!';
PRINT '이제 Azure Blob Storage URL (최대 1000자)을 저장할 수 있습니다.';
PRINT '====================================';
GO



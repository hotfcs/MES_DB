-- 이미지 컬럼 크기 즉시 수정
-- Azure Portal → SQL Database → Query editor에서 실행

-- 1. users 테이블
ALTER TABLE users ALTER COLUMN image NVARCHAR(MAX);
GO

-- 2. products 테이블
ALTER TABLE products ALTER COLUMN image NVARCHAR(MAX);
GO

-- 3. materials 테이블
ALTER TABLE materials ALTER COLUMN image NVARCHAR(MAX);
GO

-- 확인
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

PRINT '✅ 이미지 컬럼 업데이트 완료!';


-- ====================================
-- URL 잘림 문제 해결: 이미지 컬럼을 MAX로 변경
-- ====================================

-- 1. 현재 컬럼 크기 확인
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH as 'Current Length'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME = 'image'
AND TABLE_NAME IN ('users', 'products', 'materials');

-- 2. NVARCHAR(MAX)로 변경
ALTER TABLE users ALTER COLUMN image NVARCHAR(MAX);
GO

ALTER TABLE products ALTER COLUMN image NVARCHAR(MAX);
GO

ALTER TABLE materials ALTER COLUMN image NVARCHAR(MAX);
GO

-- 3. 변경 확인
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH as 'New Length (-1 = MAX)'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME = 'image'
AND TABLE_NAME IN ('users', 'products', 'materials');

PRINT '✅ 이미지 컬럼이 NVARCHAR(MAX)로 변경되었습니다!';
PRINT '이제 URL 잘림 문제가 해결됩니다.';
GO

-- 4. (선택) 잘린 URL 확인
SELECT TOP 5
    id,
    code,
    name,
    LEN(image) as url_length,
    RIGHT(image, 20) as url_end,
    created_at
FROM products
WHERE image IS NOT NULL
ORDER BY created_at DESC;
GO


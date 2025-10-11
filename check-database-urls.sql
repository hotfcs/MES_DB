-- ====================================
-- 데이터베이스에 저장된 이미지 URL 확인
-- ====================================

-- 최근 추가된 제품의 이미지 URL 확인
SELECT TOP 5
    id,
    code,
    name,
    image,
    LEN(image) as url_length,
    LEFT(image, 100) as url_preview,
    created_at
FROM products
WHERE image IS NOT NULL
ORDER BY created_at DESC;

-- 최근 추가된 사용자의 이미지 URL 확인
SELECT TOP 5
    id,
    account,
    name,
    image,
    LEN(image) as url_length,
    LEFT(image, 100) as url_preview,
    created_at
FROM users
WHERE image IS NOT NULL
ORDER BY created_at DESC;

-- URL이 잘렸는지 확인
SELECT 
    'products' as table_name,
    COUNT(*) as count,
    AVG(LEN(image)) as avg_url_length,
    MAX(LEN(image)) as max_url_length
FROM products
WHERE image IS NOT NULL AND image LIKE 'https://%'

UNION ALL

SELECT 
    'users' as table_name,
    COUNT(*) as count,
    AVG(LEN(image)) as avg_url_length,
    MAX(LEN(image)) as max_url_length
FROM users
WHERE image IS NOT NULL AND image LIKE 'https://%';


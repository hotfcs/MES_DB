-- ====================================
-- 임시 해결: 이미지 컬럼을 MAX로 변경
-- (Azure Blob Storage 설정 전까지 사용)
-- ====================================

-- Azure Portal → SQL Database → Query editor에서 실행

ALTER TABLE users ALTER COLUMN image NVARCHAR(MAX);
GO

ALTER TABLE products ALTER COLUMN image NVARCHAR(MAX);
GO

ALTER TABLE materials ALTER COLUMN image NVARCHAR(MAX);
GO

PRINT '✅ 이미지 컬럼이 NVARCHAR(MAX)로 변경되었습니다.';
PRINT '⚠️ 이것은 임시 해결책입니다.';
PRINT '💡 나중에 Azure Blob Storage로 전환하는 것을 권장합니다.';
GO


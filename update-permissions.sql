-- ====================================
-- 시스템관리자 권한 업데이트
-- ====================================

-- 시스템관리자 역할의 권한을 ALL로 업데이트
UPDATE roles
SET permissions = '["ALL"]',
    description = N'모든 메뉴와 기능에 대한 전체 권한'
WHERE name = N'시스템관리자' OR code = 'ADMIN';

GO

-- 확인
SELECT code, name, description, permissions
FROM roles
WHERE name = N'시스템관리자' OR code = 'ADMIN';

GO

PRINT '✅ 시스템관리자 권한이 ALL로 업데이트되었습니다!';


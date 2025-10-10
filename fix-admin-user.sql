-- ====================================
-- Admin 사용자 한글 이름 수정
-- ====================================

-- 기존 admin 사용자 업데이트
UPDATE users
SET 
    name = N'시스템관리자',
    role = N'시스템관리자',
    department = N'IT팀',
    position = N'팀장'
WHERE account = 'admin';

GO

PRINT '✅ Admin 사용자 한글 이름 수정 완료!';

-- 확인
SELECT account, name, role, department, position
FROM users
WHERE account = 'admin';

GO


-- ====================================
-- 챗봇 기능을 위한 데이터베이스 스키마
-- ====================================

-- 챗봇 세션 테이블
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatSessions')
BEGIN
    CREATE TABLE ChatSessions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        session_name NVARCHAR(200),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        is_active BIT DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_chat_sessions_user ON ChatSessions(user_id);
    CREATE INDEX idx_chat_sessions_created ON ChatSessions(created_at DESC);
END;

-- 챗봇 대화 이력 테이블
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatHistory')
BEGIN
    CREATE TABLE ChatHistory (
        id INT PRIMARY KEY IDENTITY(1,1),
        session_id INT NOT NULL,
        user_id INT NOT NULL,
        role NVARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content NVARCHAR(MAX) NOT NULL,
        function_name NVARCHAR(100),
        function_arguments NVARCHAR(MAX),
        function_result NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (session_id) REFERENCES ChatSessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    );
    
    CREATE INDEX idx_chat_history_session ON ChatHistory(session_id);
    CREATE INDEX idx_chat_history_created ON ChatHistory(created_at DESC);
END;

-- 챗봇 피드백 테이블 (선택사항)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatFeedback')
BEGIN
    CREATE TABLE ChatFeedback (
        id INT PRIMARY KEY IDENTITY(1,1),
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        feedback_text NVARCHAR(1000),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (chat_id) REFERENCES ChatHistory(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    );
END;

PRINT '✅ 챗봇 테이블이 생성되었습니다.';


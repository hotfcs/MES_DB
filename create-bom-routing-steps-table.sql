-- BOM별 라우팅 단계 스냅샷 테이블 생성
-- BOM 생성 시점의 라우팅 정보를 저장하여, 나중에 라우팅이 변경되어도 기존 BOM은 영향받지 않음

CREATE TABLE bom_routing_steps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    bom_id INT NOT NULL,                    -- BOM ID (외래키)
    sequence INT NOT NULL,                  -- 공정 순서
    line NVARCHAR(100),                     -- 라인
    process NVARCHAR(100),                  -- 공정
    main_equipment NVARCHAR(100),           -- 주설비
    standard_man_hours DECIMAL(10, 2),      -- 표준공수
    previous_process NVARCHAR(100),         -- 이전공정
    next_process NVARCHAR(100),             -- 다음공정
    created_at DATETIME DEFAULT GETDATE(),  -- 생성일시
    FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IX_bom_routing_steps_bom_id ON bom_routing_steps(bom_id);
CREATE INDEX IX_bom_routing_steps_bom_sequence ON bom_routing_steps(bom_id, sequence);

-- 설명 추가
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'BOM별 라우팅 단계 스냅샷 테이블. BOM 생성 시점의 라우팅 정보를 저장하여 이후 라우팅 변경에 영향받지 않도록 함.', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'bom_routing_steps';

GO

-- 확인
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'bom_routing_steps'
ORDER BY ORDINAL_POSITION;

GO


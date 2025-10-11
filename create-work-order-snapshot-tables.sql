-- 작업지시별 공정 라우팅 스냅샷 테이블 생성
-- 작업지시 생성 시점의 BOM 라우팅 정보를 저장하여, 나중에 BOM이 변경되어도 기존 작업지시는 영향받지 않음

-- 1. 작업지시별 공정 라우팅 스냅샷 테이블
CREATE TABLE work_order_routing_steps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,             -- 작업지시 ID (외래키)
    sequence INT NOT NULL,                  -- 공정 순서
    line NVARCHAR(100),                     -- 라인
    process NVARCHAR(100),                  -- 공정
    main_equipment NVARCHAR(100),           -- 주설비
    standard_man_hours DECIMAL(10, 2),      -- 표준공수
    previous_process NVARCHAR(100),         -- 이전공정
    next_process NVARCHAR(100),             -- 다음공정
    created_at DATETIME DEFAULT GETDATE(),  -- 생성일시
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- 2. 작업지시별 자재 정보 스냅샷 테이블
CREATE TABLE work_order_materials (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,             -- 작업지시 ID (외래키)
    process_sequence INT NOT NULL,          -- 공정 순서
    process_name NVARCHAR(100),             -- 공정명
    material_code NVARCHAR(50),             -- 자재코드
    material_name NVARCHAR(200),            -- 자재명
    quantity DECIMAL(18, 4),                -- 소요량
    unit NVARCHAR(20),                      -- 단위
    loss_rate DECIMAL(5, 2),                -- 손실율(%)
    alternate_material NVARCHAR(200),       -- 대체자재
    created_at DATETIME DEFAULT GETDATE(),  -- 생성일시
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IX_work_order_routing_steps_work_order_id ON work_order_routing_steps(work_order_id);
CREATE INDEX IX_work_order_routing_steps_work_order_sequence ON work_order_routing_steps(work_order_id, sequence);
CREATE INDEX IX_work_order_materials_work_order_id ON work_order_materials(work_order_id);
CREATE INDEX IX_work_order_materials_work_order_process ON work_order_materials(work_order_id, process_sequence);

-- 설명 추가
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'작업지시별 공정 라우팅 스냅샷 테이블. 작업지시 생성 시점의 BOM 라우팅 정보를 저장하여 이후 BOM 변경에 영향받지 않도록 함.', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'work_order_routing_steps';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'작업지시별 자재 정보 스냅샷 테이블. 작업지시 생성 시점의 BOM 자재 정보를 저장하여 이후 BOM 변경에 영향받지 않도록 함.', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'work_order_materials';

GO

-- 확인
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('work_order_routing_steps', 'work_order_materials')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

GO


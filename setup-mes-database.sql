-- ====================================
-- MES 시스템 데이터베이스 생성 스크립트
-- ====================================

-- 1. 사용자 테이블
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    account NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    department NVARCHAR(100) NOT NULL,
    position NVARCHAR(50),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    image NVARCHAR(500),
    last_login DATETIME2,
    join_date DATE,
    resign_date DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 2. 부서 테이블
CREATE TABLE departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    manager NVARCHAR(100),
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 3. 역할 테이블
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    permissions NVARCHAR(MAX), -- JSON 형식으로 저장
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 4. 로그인 이력 테이블
CREATE TABLE login_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    account NVARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    action NVARCHAR(20) NOT NULL CHECK (action IN ('login', 'logout')),
    timestamp DATETIME2 DEFAULT GETDATE(),
    ip_address NVARCHAR(50),
    host_name NVARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

-- 5. 고객사 테이블
CREATE TABLE customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(200) NOT NULL,
    type NVARCHAR(50) NOT NULL CHECK (type IN (N'공급업체', N'고객사', N'협력업체')),
    representative NVARCHAR(100),
    business_number NVARCHAR(20),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    address NVARCHAR(500),
    manager NVARCHAR(100),
    manager_phone NVARCHAR(20),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 6. 제품 테이블
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(200) NOT NULL,
    category NVARCHAR(50) NOT NULL CHECK (category IN (N'제품', N'반제품', N'상품')),
    specification NVARCHAR(500),
    unit NVARCHAR(20),
    standard_cost DECIMAL(15, 2),
    selling_price DECIMAL(15, 2),
    customer NVARCHAR(200),
    description NVARCHAR(MAX),
    image NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 7. 자재 테이블
CREATE TABLE materials (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(200) NOT NULL,
    category NVARCHAR(50) NOT NULL CHECK (category IN (N'원자재', N'부자재')),
    specification NVARCHAR(500),
    unit NVARCHAR(20),
    purchase_price DECIMAL(15, 2),
    supplier NVARCHAR(200),
    description NVARCHAR(MAX),
    image NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 8. 라인 테이블
CREATE TABLE lines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    location NVARCHAR(200),
    capacity INT,
    manager NVARCHAR(100),
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 9. 설비 테이블
CREATE TABLE equipments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50),
    manufacturer NVARCHAR(100),
    model NVARCHAR(100),
    purchase_date DATE,
    line NVARCHAR(100),
    manager NVARCHAR(100),
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 10. 공정 테이블
CREATE TABLE processes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50),
    standard_time INT, -- 분 단위
    line NVARCHAR(100),
    warehouse NVARCHAR(100),
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 11. 라우팅 테이블
CREATE TABLE routings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 12. 라우팅 단계 테이블
CREATE TABLE routing_steps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    routing_id INT NOT NULL,
    sequence INT NOT NULL,
    line NVARCHAR(100),
    process NVARCHAR(100),
    main_equipment NVARCHAR(100),
    standard_man_hours DECIMAL(10, 2),
    previous_process NVARCHAR(100),
    next_process NVARCHAR(100),
    FOREIGN KEY (routing_id) REFERENCES routings(id) ON DELETE CASCADE
);
GO

-- 13. BOM(자재명세서) 테이블
CREATE TABLE boms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_code NVARCHAR(50) NOT NULL,
    product_name NVARCHAR(200) NOT NULL,
    routing_id INT,
    routing_name NVARCHAR(100),
    revision NVARCHAR(20),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2,
    FOREIGN KEY (routing_id) REFERENCES routings(id)
);
GO

-- 14. BOM 아이템 테이블
CREATE TABLE bom_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    bom_id INT NOT NULL,
    process_sequence INT,
    process_name NVARCHAR(100),
    material_code NVARCHAR(50),
    material_name NVARCHAR(200),
    quantity DECIMAL(15, 3),
    unit NVARCHAR(20),
    loss_rate DECIMAL(5, 2),
    alternate_material NVARCHAR(200),
    FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE
);
GO

-- 15. 창고 테이블
CREATE TABLE warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50) NOT NULL CHECK (type IN (N'원자재창고', N'제품창고', N'자재창고', N'공정창고')),
    location NVARCHAR(200),
    capacity INT,
    manager NVARCHAR(100),
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 16. 생산계획 테이블
CREATE TABLE production_plans (
    id INT IDENTITY(1,1) PRIMARY KEY,
    plan_code NVARCHAR(50) NOT NULL UNIQUE,
    plan_date DATE NOT NULL,
    product_code NVARCHAR(50) NOT NULL,
    product_name NVARCHAR(200) NOT NULL,
    plan_quantity INT NOT NULL,
    unit NVARCHAR(20),
    start_date DATE,
    end_date DATE,
    status NVARCHAR(20) DEFAULT N'계획' CHECK (status IN (N'계획', N'진행중', N'완료', N'취소')),
    manager NVARCHAR(100),
    note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 17. 작업지시 테이블
CREATE TABLE work_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_code NVARCHAR(50) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    plan_code NVARCHAR(50),
    product_code NVARCHAR(50) NOT NULL,
    product_name NVARCHAR(200) NOT NULL,
    order_quantity INT NOT NULL,
    unit NVARCHAR(20),
    line NVARCHAR(100),
    start_date DATE,
    end_date DATE,
    status NVARCHAR(20) DEFAULT N'대기' CHECK (status IN (N'대기', N'진행중', N'완료', N'보류')),
    worker NVARCHAR(100),
    note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 18. 생산실적 테이블
CREATE TABLE production_results (
    id INT IDENTITY(1,1) PRIMARY KEY,
    result_code NVARCHAR(50) NOT NULL UNIQUE,
    result_date DATE NOT NULL,
    order_code NVARCHAR(50) NOT NULL,
    product_code NVARCHAR(50) NOT NULL,
    product_name NVARCHAR(200) NOT NULL,
    line NVARCHAR(100),
    process_sequence INT,
    process_name NVARCHAR(100),
    target_quantity INT,
    result_quantity INT,
    defect_quantity INT,
    unit NVARCHAR(20),
    worker NVARCHAR(100),
    start_time DATETIME2,
    end_time DATETIME2,
    note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- ====================================
-- 인덱스 생성
-- ====================================

CREATE INDEX idx_users_account ON users(account);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_timestamp ON login_history(timestamp DESC);

CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_customers_status ON customers(status);

CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);

CREATE INDEX idx_materials_code ON materials(code);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_status ON materials(status);

CREATE INDEX idx_production_plans_plan_code ON production_plans(plan_code);
CREATE INDEX idx_production_plans_status ON production_plans(status);
CREATE INDEX idx_production_plans_plan_date ON production_plans(plan_date DESC);

CREATE INDEX idx_work_orders_order_code ON work_orders(order_code);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_order_date ON work_orders(order_date DESC);

CREATE INDEX idx_production_results_result_code ON production_results(result_code);
CREATE INDEX idx_production_results_order_code ON production_results(order_code);
CREATE INDEX idx_production_results_result_date ON production_results(result_date DESC);

GO

-- ====================================
-- 샘플 데이터 삽입 (관리자 계정)
-- ====================================

INSERT INTO users (account, password, name, role, department, position, phone, email, status, image, last_login, join_date)
VALUES 
('admin', 'admin123', N'시스템관리자', N'시스템관리자', N'IT팀', N'팀장', '010-1234-5678', 'admin@company.com', 'active', 
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 
 GETDATE(), '2020-03-15');

GO

PRINT '✅ MES 데이터베이스 테이블 생성 완료!';
PRINT '📊 총 18개 테이블 생성됨';
PRINT '✅ 인덱스 생성 완료';
PRINT '✅ 관리자 계정 생성 완료 (admin/admin123)';


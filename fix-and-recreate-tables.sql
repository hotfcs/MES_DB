-- ====================================
-- 테이블 재생성 스크립트 (CHECK Constraint 수정)
-- ====================================

-- 1단계: 기존 테이블 삭제 (역순으로)
DROP TABLE IF EXISTS production_results;
DROP TABLE IF EXISTS work_orders;
DROP TABLE IF EXISTS production_plans;
DROP TABLE IF EXISTS bom_items;
DROP TABLE IF EXISTS boms;
DROP TABLE IF EXISTS routing_steps;
DROP TABLE IF EXISTS routings;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS processes;
DROP TABLE IF EXISTS equipments;
DROP TABLE IF EXISTS lines;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS login_history;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS departments;
-- users 테이블은 admin이 있으므로 주의
-- DROP TABLE IF EXISTS users;

GO

PRINT '기존 테이블 삭제 완료';
GO

-- 2단계: 수정된 테이블 생성 (customers, products, materials, warehouses, production_plans, work_orders만)

-- 고객사 테이블 (수정됨)
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

-- 제품 테이블 (수정됨)
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

-- 자재 테이블 (수정됨)
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

-- 부서 테이블
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

-- 역할 테이블
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    permissions NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 로그인 이력 테이블
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

-- 라인 테이블
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

-- 설비 테이블
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

-- 공정 테이블
CREATE TABLE processes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    type NVARCHAR(50),
    standard_time INT,
    line NVARCHAR(100),
    warehouse NVARCHAR(100),
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 라우팅 테이블
CREATE TABLE routings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2
);
GO

-- 라우팅 단계 테이블
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

-- BOM 테이블
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

-- BOM 아이템 테이블
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

-- 창고 테이블 (수정됨)
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

-- 생산계획 테이블 (수정됨)
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

-- 작업지시 테이블 (수정됨)
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

-- 생산실적 테이블
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

PRINT '====================================';
PRINT '테이블 재생성 완료!';
PRINT '이제 insert-sample-data.sql을 실행하세요.';
PRINT '====================================';


-- ====================================
-- Azure SQL Server 테이블 생성 스크립트
-- ====================================

-- 데이터베이스가 없는 경우 생성 (Azure Portal에서 생성하는 것을 권장)
-- CREATE DATABASE test_db;
-- GO

-- 사용자 테이블 생성
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 상품 테이블 생성
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 고객 테이블 생성
CREATE TABLE customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(20),
    address NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 주문 테이블 생성
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending',
    order_date DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
GO

-- 주문 상세 테이블 생성
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
GO

-- ====================================
-- 인덱스 생성 (성능 최적화)
-- ====================================

-- 사용자 이메일 인덱스
CREATE INDEX idx_users_email ON users(email);
GO

-- 상품 이름 인덱스
CREATE INDEX idx_products_name ON products(name);
GO

-- 주문 날짜 인덱스
CREATE INDEX idx_orders_date ON orders(order_date DESC);
GO

-- 주문 상태 인덱스
CREATE INDEX idx_orders_status ON orders(status);
GO

-- ====================================
-- 샘플 데이터 삽입
-- ====================================

-- 사용자 샘플 데이터
INSERT INTO users (name, email) VALUES
('홍길동', 'hong@example.com'),
('김철수', 'kim@example.com'),
('이영희', 'lee@example.com'),
('박민수', 'park@example.com'),
('정수진', 'jung@example.com');
GO

-- 상품 샘플 데이터
INSERT INTO products (name, price, stock) VALUES
('노트북', 1200000, 10),
('마우스', 35000, 50),
('키보드', 89000, 30),
('모니터', 350000, 15),
('헤드셋', 95000, 25),
('웹캠', 120000, 20),
('USB 허브', 28000, 40),
('노트북 거치대', 45000, 35),
('외장 SSD 1TB', 180000, 18),
('무선 충전기', 52000, 30);
GO

-- 고객 샘플 데이터
INSERT INTO customers (name, email, phone, address) VALUES
('김고객', 'customer1@example.com', '010-1234-5678', '서울시 강남구'),
('이구매', 'customer2@example.com', '010-2345-6789', '서울시 서초구'),
('박주문', 'customer3@example.com', '010-3456-7890', '서울시 송파구');
GO

-- 주문 샘플 데이터
INSERT INTO orders (customer_id, total_amount, status) VALUES
(1, 1235000, 'completed'),
(2, 475000, 'pending'),
(3, 350000, 'shipped');
GO

-- 주문 상세 샘플 데이터
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 1200000),  -- 노트북
(1, 2, 1, 35000),     -- 마우스
(2, 4, 1, 350000),    -- 모니터
(2, 5, 1, 95000),     -- 헤드셋
(2, 7, 1, 28000),     -- USB 허브
(3, 4, 1, 350000);    -- 모니터
GO

-- ====================================
-- 유용한 Stored Procedure
-- ====================================

-- 상품 재고 업데이트
CREATE PROCEDURE sp_UpdateProductStock
    @product_id INT,
    @quantity INT
AS
BEGIN
    UPDATE products 
    SET stock = stock + @quantity
    WHERE id = @product_id;
END;
GO

-- 주문 생성 (트랜잭션)
CREATE PROCEDURE sp_CreateOrder
    @customer_id INT,
    @product_id INT,
    @quantity INT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @price DECIMAL(10, 2);
        DECLARE @total DECIMAL(10, 2);
        DECLARE @order_id INT;
        
        -- 상품 가격 조회
        SELECT @price = price FROM products WHERE id = @product_id;
        SET @total = @price * @quantity;
        
        -- 주문 생성
        INSERT INTO orders (customer_id, total_amount, status)
        VALUES (@customer_id, @total, 'pending');
        
        SET @order_id = SCOPE_IDENTITY();
        
        -- 주문 상세 생성
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (@order_id, @product_id, @quantity, @price);
        
        -- 재고 감소
        UPDATE products SET stock = stock - @quantity WHERE id = @product_id;
        
        COMMIT TRANSACTION;
        SELECT @order_id as order_id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ====================================
-- 뷰 생성
-- ====================================

-- 주문 상세 뷰
CREATE VIEW vw_order_details AS
SELECT 
    o.id as order_id,
    o.order_date,
    o.status,
    c.name as customer_name,
    c.email as customer_email,
    p.name as product_name,
    oi.quantity,
    oi.price,
    (oi.quantity * oi.price) as line_total
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;
GO

-- 재고 부족 상품 뷰
CREATE VIEW vw_low_stock_products AS
SELECT 
    id,
    name,
    price,
    stock,
    CASE 
        WHEN stock = 0 THEN '재고 없음'
        WHEN stock < 5 THEN '재고 부족'
        ELSE '정상'
    END as stock_status
FROM products
WHERE stock < 10;
GO

-- ====================================
-- 테이블 목록 확인
-- ====================================

SELECT 
    t.name AS table_name,
    s.name AS schema_name
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
ORDER BY t.name;
GO

-- ====================================
-- 데이터 확인
-- ====================================

SELECT 'Users' as TableName, COUNT(*) as RowCount FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items;
GO


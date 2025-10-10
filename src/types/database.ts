/**
 * Azure SQL Server 데이터베이스 타입 정의
 */

// ====================================
// 공통 타입
// ====================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ====================================
// 데이터베이스 테이블 타입
// ====================================

// 사용자
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

// 상품
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stock?: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  stock?: number;
}

// 고객
export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: Date;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// 주문
export interface Order {
  id: number;
  customer_id: number;
  total_amount: number;
  status: OrderStatus;
  order_date: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface CreateOrderDto {
  customer_id: number;
  total_amount: number;
  status?: OrderStatus;
}

export interface UpdateOrderDto {
  customer_id?: number;
  total_amount?: number;
  status?: OrderStatus;
}

// 주문 상세
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface CreateOrderItemDto {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

// ====================================
// 조인된 데이터 타입
// ====================================

export interface OrderDetail extends Order {
  customer_name: string;
  customer_email: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    line_total: number;
  }>;
}

export interface OrderWithCustomer extends Order {
  customer: Customer;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

// ====================================
// 쿼리 파라미터 타입
// ====================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface UserSearchParams extends PaginationParams {
  search?: string;
  email?: string;
}

export interface ProductSearchParams extends PaginationParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface OrderSearchParams extends PaginationParams {
  customer_id?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

// ====================================
// Server Action 응답 타입
// ====================================

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ====================================
// 통계 타입
// ====================================

export interface SalesStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  min_order: number;
  max_order: number;
}

export interface ProductStats {
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers_this_month: number;
}

// ====================================
// 유틸리티 타입
// ====================================

// 테이블 이름
export type TableName = 'users' | 'products' | 'customers' | 'orders' | 'order_items';

// 정렬 방향
export type SortDirection = 'ASC' | 'DESC';

// 필터 조건
export interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: unknown;
}

// SQL 파라미터
export type SqlParams = Record<string, string | number | boolean | Date | null>;


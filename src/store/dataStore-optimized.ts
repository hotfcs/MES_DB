"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ====================================
// 타입 정의 (기존과 동일)
// ====================================

export type User = {
  id: number;
  account: string;
  password: string;
  name: string;
  role: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  image?: string;
  lastLogin?: string;
  joinDate?: string;
  resignDate?: string;
  createdAt?: string;
  modifiedAt?: string;
};

export type Department = {
  id: number;
  name: string;
  code: string;
  manager: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Role = {
  id: number;
  code: string;
  name: string;
  description: string;
  permissions: string[];
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type LoginHistory = {
  id: number;
  userId: number;
  account: string;
  name: string;
  action: "login" | "logout";
  timestamp: string;
  ipAddress?: string;
  hostName?: string;
};

export type Customer = {
  id: number;
  code: string;
  name: string;
  type: "공급업체" | "고객사" | "협력업체";
  representative: string;
  businessNumber: string;
  phone: string;
  email: string;
  address: string;
  manager: string;
  managerPhone: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Product = {
  id: number;
  code: string;
  name: string;
  category: "제품" | "반제품" | "상품";
  specification: string;
  unit: string;
  standardCost: number;
  sellingPrice: number;
  customer: string;
  description: string;
  image?: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Material = {
  id: number;
  code: string;
  name: string;
  category: "원자재" | "부자재";
  specification: string;
  unit: string;
  purchasePrice: number;
  supplier: string;
  description: string;
  image?: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Line = {
  id: number;
  code: string;
  name: string;
  location: string;
  capacity: number;
  manager: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Equipment = {
  id: number;
  code: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  line: string;
  manager: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Process = {
  id: number;
  code: string;
  name: string;
  type: string;
  standardTime: number;
  line: string;
  warehouse: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type Routing = {
  id: number;
  code: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type RoutingStep = {
  id: number;
  routingId: number;
  sequence: number;
  line: string;
  process: string;
  mainEquipment: string;
  standardManHours: number;
  previousProcess: string;
  nextProcess: string;
};

export type BOM = {
  id: number;
  productCode: string;
  productName: string;
  routingId: number;
  routingName: string;
  revision: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type BOMItem = {
  id: number;
  bomId: number;
  processSequence: number;
  processName: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  lossRate: number;
  alternateMaterial: string;
};

export type BOMRoutingStep = {
  id: number;
  bomId: number;
  sequence: number;
  line: string;
  process: string;
  mainEquipment: string;
  standardManHours: number;
  previousProcess: string;
  nextProcess: string;
};

export type Warehouse = {
  id: number;
  code: string;
  name: string;
  type: "원자재창고" | "제품창고" | "자재창고" | "공정창고";
  location: string;
  capacity: number;
  manager: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  modifiedAt?: string;
};

export type ProductionPlan = {
  id: number;
  planCode: string;
  planDate: string;
  productCode: string;
  productName: string;
  planQuantity: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: "계획" | "진행중" | "완료" | "취소";
  manager: string;
  note: string;
  createdAt: string;
  modifiedAt?: string;
};

export type WorkOrder = {
  id: number;
  orderCode: string;
  orderDate: string;
  planCode: string;
  productCode: string;
  productName: string;
  orderQuantity: number;
  unit: string;
  line: string;
  startDate: string;
  endDate: string;
  status: "대기" | "진행중" | "완료" | "보류";
  worker: string;
  note: string;
  createdAt: string;
  modifiedAt?: string;
};

export type WorkOrderRoutingStep = {
  id: number;
  workOrderId: number;
  sequence: number;
  line: string;
  process: string;
  mainEquipment: string;
  standardManHours: number;
  previousProcess: string;
  nextProcess: string;
};

export type WorkOrderMaterial = {
  id: number;
  workOrderId: number;
  processSequence: number;
  processName: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  lossRate: number;
  alternateMaterial: string;
};

export type ProductionResult = {
  id: number;
  resultCode: string;
  resultDate: string;
  orderCode: string;
  productCode: string;
  productName: string;
  line: string;
  processSequence: number;
  processName: string;
  targetQuantity: number;
  resultQuantity: number;
  defectQuantity: number;
  unit: string;
  worker: string;
  startTime: string;
  endTime: string;
  note: string;
  createdAt: string;
  modifiedAt?: string;
};

// ====================================
// API 헬퍼 함수 (최적화)
// ====================================

async function fetchAPI(url: string, options?: RequestInit) {
  console.log('🌐 API 호출:', options?.method || 'GET', url);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  console.log('📡 응답 상태:', response.status, response.statusText);
  
  // 응답 텍스트 가져오기 (오류 응답도 JSON을 가질 수 있음)
  const text = await response.text();
  
  // 빈 응답 처리
  if (!text || text.trim().length === 0) {
    if (!response.ok) {
      if (response.status === 405) {
        throw new Error(`HTTP 405: ${options?.method || 'GET'} 메서드가 ${url}에서 허용되지 않습니다.`);
      }
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    console.log('⚠️ 빈 응답 반환됨');
    return null;
  }
  
  // JSON 파싱
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error('❌ JSON 파싱 오류:', text.substring(0, 200));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    throw new Error('서버 응답을 파싱할 수 없습니다');
  }
  
  // 응답 실패 처리 (성공하지 않은 경우)
  if (!data.success) {
    console.log('ℹ️ API 검증:', data.message || data.error);
    throw new Error(data.message || data.error || 'API 요청 실패');
  }
  
  console.log('✅ API 성공');
  return data.data;
}

// ====================================
// Query Keys (캐시 키 관리)
// ====================================

export const queryKeys = {
  users: ['users'] as const,
  products: ['products'] as const,
  customers: ['customers'] as const,
  materials: ['materials'] as const,
  departments: ['departments'] as const,
  roles: ['roles'] as const,
  lines: ['lines'] as const,
  equipments: ['equipments'] as const,
  processes: ['processes'] as const,
  routings: ['routings'] as const,
  boms: ['boms'] as const,
  warehouses: ['warehouses'] as const,
  productionPlans: ['productionPlans'] as const,
  workOrders: ['workOrders'] as const,
  loginHistory: ['loginHistory'] as const,
};

// ====================================
// 제품 관리 Hook (최적화 버전)
// ====================================

export function useProductsStore() {
  const queryClient = useQueryClient();

  // 데이터 조회 (자동 캐싱, 중복 요청 제거)
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => fetchAPI('/api/mes/products'),
    staleTime: 30 * 60 * 1000, // 30분간 fresh (페이지 전환 시 재요청 없음)
  });

  // 추가 (낙관적 업데이트)
  const addMutation = useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'createdAt' | 'modifiedAt'>) =>
      fetchAPI('/api/mes/products', {
        method: 'POST',
        body: JSON.stringify(product),
      }),
    onMutate: async (newProduct) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: queryKeys.products });

      // 이전 데이터 백업
      const previousProducts = queryClient.getQueryData<Product[]>(queryKeys.products);

      // 낙관적 업데이트 (즉시 UI 반영)
      queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) => [
        ...old,
        { 
          ...newProduct, 
          id: Date.now(), // 임시 ID
          createdAt: new Date().toISOString(),
        } as Product,
      ]);

      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      // 에러 발생시 이전 데이터로 롤백
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
    },
    onSettled: () => {
      // 성공/실패 상관없이 서버 데이터로 동기화
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  // 수정 (낙관적 업데이트)
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: Partial<Product> & { id: number }) =>
      fetchAPI('/api/mes/products', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      }),
    onMutate: async (updatedProduct) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });
      
      const previousProducts = queryClient.getQueryData<Product[]>(queryKeys.products);

      queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) =>
        old.map((product) =>
          product.id === updatedProduct.id
            ? { ...product, ...updatedProduct, modifiedAt: new Date().toISOString() }
            : product
        )
      );

      return { previousProducts };
    },
    onError: (err, updatedProduct, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  // 삭제 (낙관적 업데이트)
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchAPI(`/api/mes/products?id=${id}`, {
        method: 'DELETE',
      }),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });
      
      const previousProducts = queryClient.getQueryData<Product[]>(queryKeys.products);

      queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) =>
        old.filter((product) => product.id !== deletedId)
      );

      return { previousProducts };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  return {
    products,
    loading,
    addProduct: addMutation.mutateAsync,
    updateProduct: (id: number, updates: Partial<Product>) => 
      updateMutation.mutateAsync({ id, ...updates }),
    deleteProduct: deleteMutation.mutateAsync,
    refreshProducts: () => queryClient.invalidateQueries({ queryKey: queryKeys.products }),
  };
}

// ====================================
// 사용자 관리 Hook (최적화 버전)
// ====================================

export function useUsersStore() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => fetchAPI('/api/mes/users'),
    staleTime: 30 * 60 * 1000, // 30분간 캐시
  });

  const addMutation = useMutation({
    mutationFn: (user: Omit<User, 'id' | 'createdAt' | 'modifiedAt'>) =>
      fetchAPI('/api/mes/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users);
      queryClient.setQueryData<User[]>(queryKeys.users, (old = []) => [
        ...old,
        { ...newUser, id: Date.now(), createdAt: new Date().toISOString() } as User,
      ]);
      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users, context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: Partial<User> & { id: number }) =>
      fetchAPI('/api/mes/users', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      }),
    onMutate: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users);
      queryClient.setQueryData<User[]>(queryKeys.users, (old = []) =>
        old.map((user) =>
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user
        )
      );
      return { previousUsers };
    },
    onError: (err, updatedUser, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users, context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchAPI(`/api/mes/users?id=${id}`, {
        method: 'DELETE',
      }),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users);
      queryClient.setQueryData<User[]>(queryKeys.users, (old = []) =>
        old.filter((user) => user.id !== deletedId)
      );
      return { previousUsers };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users, context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  return {
    users,
    loading,
    addUser: addMutation.mutateAsync,
    updateUser: (id: number, updates: Partial<User>) => 
      updateMutation.mutateAsync({ id, ...updates }),
    deleteUser: deleteMutation.mutateAsync,
    refreshUsers: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  };
}

// ====================================
// 거래처 관리 Hook (최적화 버전)
// ====================================

export function useCustomersStore() {
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => fetchAPI('/api/mes/customers'),
    staleTime: 30 * 60 * 1000, // 30분간 캐시
  });

  const addMutation = useMutation({
    mutationFn: (customer: Omit<Customer, 'id' | 'createdAt' | 'modifiedAt'>) =>
      fetchAPI('/api/mes/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: Partial<Customer> & { id: number }) =>
      fetchAPI('/api/mes/customers', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchAPI(`/api/mes/customers?id=${id}`, {
        method: 'DELETE',
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });

  return {
    customers,
    loading,
    addCustomer: addMutation.mutateAsync,
    updateCustomer: (id: number, updates: Partial<Customer>) =>
      updateMutation.mutateAsync({ id, ...updates }),
    deleteCustomer: deleteMutation.mutateAsync,
    refreshCustomers: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
  };
}

// 나머지 hooks도 동일한 패턴으로 구현...
// 간결성을 위해 기존 dataStore의 다른 함수들은 그대로 export

export { 
  useDepartmentsStore,
  useRolesStore,
  useMaterialsStore,
  useLinesStore,
  useEquipmentsStore,
  useProcessesStore,
  useRoutingsStore,
  useBOMsStore,
  useWarehousesStore,
  useProductionPlansStore,
  useWorkOrdersStore,
  useLoginHistoryStore,
  useProductionResultsStore,
} from './dataStore';


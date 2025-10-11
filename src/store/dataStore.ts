"use client";

import { useState, useEffect } from "react";

// ====================================
// 타입 정의
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
// API 헬퍼 함수
// ====================================

async function fetchAPI(url: string, options?: RequestInit) {
  console.log('🌐 API 호출:', options?.method || 'GET', url);
  
  const response = await fetch(url, options);
  
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
// 사용자 관리 Hook
// ====================================

export function useUsersStore() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/users');
      setUsers(data || []);
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    await fetchUsers();
  };

  const updateUser = async (id: number, updates: Partial<User>) => {
    await fetchAPI('/api/mes/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchUsers();
  };

  const deleteUser = async (id: number) => {
    await fetchAPI(`/api/mes/users?id=${id}`, {
      method: 'DELETE',
    });
    await fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers,
  };
}

// ====================================
// 로그인 이력 Hook
// ====================================

export function useLoginHistoryStore() {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (params?: { userId?: number; action?: string; limit?: number }) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append('userId', params.userId.toString());
      if (params?.action) queryParams.append('action', params.action);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const data = await fetchAPI(`/api/mes/login-history?${queryParams}`);
      setLoginHistory(data || []);
    } catch (error) {
      console.error('로그인 이력 조회 실패:', error);
      setLoginHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory({ limit: 100 });
  }, []);

  return {
    loginHistory,
    loading,
    refreshHistory: fetchHistory,
  };
}

// ====================================
// 제품 관리 Hook
// ====================================

export function useProductsStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/products');
      setProducts(data || []);
    } catch (error) {
      console.error('제품 조회 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    await fetchProducts();
  };

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    await fetchAPI('/api/mes/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    await fetchAPI(`/api/mes/products?id=${id}`, {
      method: 'DELETE',
    });
    await fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: fetchProducts,
  };
}

// ====================================
// 작업지시 Hook
// ====================================

export function useWorkOrdersStore() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrderRoutingSteps, setWorkOrderRoutingSteps] = useState<WorkOrderRoutingStep[]>([]);
  const [workOrderMaterials, setWorkOrderMaterials] = useState<WorkOrderMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/work-orders');
      setWorkOrders(data?.workOrders || []);
      setWorkOrderRoutingSteps(data?.workOrderRoutingSteps || []);
      setWorkOrderMaterials(data?.workOrderMaterials || []);
    } catch (error) {
      console.error('작업지시 조회 실패:', error);
      setWorkOrders([]);
      setWorkOrderRoutingSteps([]);
      setWorkOrderMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const addWorkOrder = async (workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workOrder),
    });
    await fetchWorkOrders();
  };

  const updateWorkOrder = async (id: number, updates: Partial<WorkOrder>) => {
    await fetchAPI('/api/mes/work-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchWorkOrders();
  };

  const deleteWorkOrder = async (id: number) => {
    await fetchAPI(`/api/mes/work-orders?id=${id}`, {
      method: 'DELETE',
    });
    await fetchWorkOrders();
  };

  const getWorkOrderRoutingSteps = (workOrderId: number) => {
    return workOrderRoutingSteps.filter(step => step.workOrderId === workOrderId);
  };

  const getWorkOrderMaterials = (workOrderId: number) => {
    return workOrderMaterials.filter(material => material.workOrderId === workOrderId);
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  return {
    workOrders,
    workOrderRoutingSteps,
    workOrderMaterials,
    loading,
    getWorkOrderRoutingSteps,
    getWorkOrderMaterials,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    refreshWorkOrders: fetchWorkOrders,
  };
}

// ====================================
// 부서 관리 Hook
// ====================================

export function useDepartmentsStore() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/departments');
      setDepartments(data || []);
    } catch (error) {
      console.error('부서 조회 실패:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (department: Omit<Department, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(department),
    });
    await fetchDepartments();
  };

  const updateDepartment = async (id: number, updates: Partial<Department>) => {
    await fetchAPI('/api/mes/departments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchDepartments();
  };

  const deleteDepartment = async (id: number) => {
    await fetchAPI(`/api/mes/departments?id=${id}`, {
      method: 'DELETE',
    });
    await fetchDepartments();
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    refreshDepartments: fetchDepartments,
  };
}

// ====================================
// 역할 관리 Hook
// ====================================

export function useRolesStore() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/roles');
      setRoles(data || []);
    } catch (error) {
      console.error('역할 조회 실패:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (role: Omit<Role, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role),
    });
    await fetchRoles();
  };

  const updateRole = async (id: number, updates: Partial<Role>) => {
    await fetchAPI('/api/mes/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchRoles();
  };

  const deleteRole = async (id: number) => {
    await fetchAPI(`/api/mes/roles?id=${id}`, {
      method: 'DELETE',
    });
    await fetchRoles();
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    loading,
    addRole,
    updateRole,
    deleteRole,
    refreshRoles: fetchRoles,
  };
}

// ====================================
// 임시: 나머지 기능들은 빈 배열 반환
// ====================================

export function useCustomersStore() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/customers');
      setCustomers(data || []);
    } catch (error) {
      console.error('거래처 조회 실패:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    await fetchCustomers();
  };

  const updateCustomer = async (id: number, updates: Partial<Customer>) => {
    await fetchAPI('/api/mes/customers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchCustomers();
  };

  const deleteCustomer = async (id: number) => {
    await fetchAPI(`/api/mes/customers?id=${id}`, {
      method: 'DELETE',
    });
    await fetchCustomers();
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers: fetchCustomers,
  };
}

export function useMaterialsStore() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/materials');
      setMaterials(data || []);
    } catch (error) {
      console.error('자재 조회 실패:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (material: Omit<Material, 'id' | 'createdAt' | 'modifiedAt'>) => {
    await fetchAPI('/api/mes/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    await fetchMaterials();
  };

  const updateMaterial = async (id: number, updates: Partial<Material>) => {
    await fetchAPI('/api/mes/materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchMaterials();
  };

  const deleteMaterial = async (id: number) => {
    await fetchAPI(`/api/mes/materials?id=${id}`, {
      method: 'DELETE',
    });
    await fetchMaterials();
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return {
    materials,
    loading,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    refreshMaterials: fetchMaterials,
  };
}

export function useLinesStore() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLines = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/lines');
      setLines(data || []);
    } catch (error) {
      console.error('라인 조회 실패:', error);
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLines(); }, []);

  return {
    lines, loading,
    addLine: async (line: Omit<Line, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/lines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(line) }); await fetchLines(); },
    updateLine: async (id: number, updates: Partial<Line>) => { await fetchAPI('/api/mes/lines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) }); await fetchLines(); },
    deleteLine: async (id: number) => { await fetchAPI(`/api/mes/lines?id=${id}`, { method: 'DELETE' }); await fetchLines(); },
    refreshLines: fetchLines,
  };
}

export function useEquipmentsStore() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/equipments');
      setEquipments(data || []);
    } catch (error) {
      console.error('설비 조회 실패:', error);
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEquipments(); }, []);

  return {
    equipments, loading,
    addEquipment: async (equipment: Omit<Equipment, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/equipments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(equipment) }); await fetchEquipments(); },
    updateEquipment: async (id: number, updates: Partial<Equipment>) => { await fetchAPI('/api/mes/equipments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) }); await fetchEquipments(); },
    deleteEquipment: async (id: number) => { await fetchAPI(`/api/mes/equipments?id=${id}`, { method: 'DELETE' }); await fetchEquipments(); },
    refreshEquipments: fetchEquipments,
  };
}

export function useProcessesStore() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/processes');
      setProcesses(data || []);
    } catch (error) {
      console.error('공정 조회 실패:', error);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProcesses(); }, []);

  return {
    processes, loading,
    addProcess: async (process: Omit<Process, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/processes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(process) }); await fetchProcesses(); },
    updateProcess: async (id: number, updates: Partial<Process>) => { await fetchAPI('/api/mes/processes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) }); await fetchProcesses(); },
    deleteProcess: async (id: number) => { await fetchAPI(`/api/mes/processes?id=${id}`, { method: 'DELETE' }); await fetchProcesses(); },
    refreshProcesses: fetchProcesses,
  };
}

export function useRoutingsStore() {
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [routingSteps, setRoutingSteps] = useState<RoutingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutings = async () => {
    try {
      setLoading(true);
      const result = await fetchAPI('/api/mes/routings');
      setRoutings(result.routings || []);
      setRoutingSteps(result.routingSteps || []);
    } catch (error) {
      console.error('라우팅 조회 실패:', error);
      setRoutings([]);
      setRoutingSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoutingStepsByRoutingId = (routingId: number) => {
    return routingSteps.filter(step => step.routingId === routingId);
  };

  const saveRoutingSteps = async (routingId: number, steps: RoutingStep[]) => {
    await fetchAPI('/api/mes/routings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routingId, steps })
    });
    await fetchRoutings();
  };

  useEffect(() => { fetchRoutings(); }, []);

  return {
    routings, 
    routingSteps, 
    loading,
    getRoutingStepsByRoutingId,
    saveRoutingSteps,
    addRouting: async (routing: Omit<Routing, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/routings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(routing) }); await fetchRoutings(); },
    updateRouting: async () => { await fetchRoutings(); },
    deleteRouting: async (id: number) => { await fetchAPI(`/api/mes/routings?id=${id}`, { method: 'DELETE' }); await fetchRoutings(); },
    addRoutingStep: async () => { await fetchRoutings(); },
    updateRoutingStep: async () => { await fetchRoutings(); },
    deleteRoutingStep: async () => { await fetchRoutings(); },
    refreshRoutings: fetchRoutings,
  };
}

export function useBOMsStore() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [bomRoutingSteps, setBomRoutingSteps] = useState<BOMRoutingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      const result = await fetchAPI('/api/mes/boms');
      setBoms(result.boms || []);
      setBomItems(result.bomItems || []);
      setBomRoutingSteps(result.bomRoutingSteps || []);
    } catch (error) {
      console.error('BOM 조회 실패:', error);
      setBoms([]);
      setBomItems([]);
      setBomRoutingSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const getBOMItemsByBOMId = (bomId: number) => {
    return bomItems.filter(item => item.bomId === bomId);
  };

  const getBOMRoutingStepsByBOMId = (bomId: number) => {
    return bomRoutingSteps.filter(step => step.bomId === bomId);
  };

  const saveBOMItems = async (bomId: number, items: BOMItem[]) => {
    await fetchAPI('/api/mes/boms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bomId, items })
    });
    await fetchBOMs();
  };

  useEffect(() => { fetchBOMs(); }, []);

  return {
    boms, 
    bomItems,
    bomRoutingSteps,
    loading,
    getBOMItemsByBOMId,
    getBOMRoutingStepsByBOMId,
    saveBOMItems,
    addBOM: async (bom: Omit<BOM, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/boms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bom) }); await fetchBOMs(); },
    updateBOM: async () => { await fetchBOMs(); },
    deleteBOM: async (id: number) => { await fetchAPI(`/api/mes/boms?id=${id}`, { method: 'DELETE' }); await fetchBOMs(); },
    addBOMItem: async () => { await fetchBOMs(); },
    updateBOMItem: async () => { await fetchBOMs(); },
    deleteBOMItem: async () => { await fetchBOMs(); },
    refreshBOMs: fetchBOMs,
  };
}

export function useWarehousesStore() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/warehouses');
      setWarehouses(data || []);
    } catch (error) {
      console.error('창고 조회 실패:', error);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  return {
    warehouses, loading,
    addWarehouse: async (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(warehouse) }); await fetchWarehouses(); },
    updateWarehouse: async (id: number, updates: Partial<Warehouse>) => { await fetchAPI('/api/mes/warehouses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) }); await fetchWarehouses(); },
    deleteWarehouse: async (id: number) => { await fetchAPI(`/api/mes/warehouses?id=${id}`, { method: 'DELETE' }); await fetchWarehouses(); },
    refreshWarehouses: fetchWarehouses,
  };
}

export function useProductionPlansStore() {
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductionPlans = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/mes/production-plans');
      setProductionPlans(data || []);
    } catch (error) {
      console.error('생산계획 조회 실패:', error);
      setProductionPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductionPlans(); }, []);

  return {
    productionPlans, loading,
    addProductionPlan: async (plan: Omit<ProductionPlan, 'id' | 'createdAt' | 'modifiedAt'>) => { await fetchAPI('/api/mes/production-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) }); await fetchProductionPlans(); },
    updateProductionPlan: async (plan: Partial<ProductionPlan> & {id: number}) => { 
      await fetchAPI(`/api/mes/production-plans`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(plan) 
      }); 
      await fetchProductionPlans(); 
    },
    deleteProductionPlan: async (id: number) => { await fetchAPI(`/api/mes/production-plans?id=${id}`, { method: 'DELETE' }); await fetchProductionPlans(); },
    refreshProductionPlans: fetchProductionPlans,
  };
}

export function useProductionResultsStore() {
  return {
    productionResults: [] as ProductionResult[],
    loading: false,
    addProductionResult: async () => {},
    updateProductionResult: async () => {},
    deleteProductionResult: async () => {},
    refreshProductionResults: async () => {},
  };
}

// 기본 export (하위 호환성)
const dataStoreHooks = {
  useUsersStore,
  useLoginHistoryStore,
  useProductsStore,
  useWorkOrdersStore,
  useDepartmentsStore,
  useRolesStore,
  useCustomersStore,
  useMaterialsStore,
  useLinesStore,
  useEquipmentsStore,
  useProcessesStore,
  useRoutingsStore,
  useBOMsStore,
  useWarehousesStore,
  useProductionPlansStore,
  useProductionResultsStore,
};

export default dataStoreHooks;

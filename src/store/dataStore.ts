"use client";

import { useSyncExternalStore } from "react";

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
  lastLogin: string;
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

type Listener = () => void;

class DataStore {
  private users: User[] = [
    {
      id: 1,
      account: "admin",
      password: "admin123",
      name: "시스템관리자",
      role: "시스템관리자",
      department: "IT팀",
      position: "팀장",
      phone: "010-1234-5678",
      email: "admin@company.com",
      status: "active",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-15 09:30",
      joinDate: "2020-03-15",
      createdAt: "2020-03-15"
    },
    {
      id: 2,
      account: "kimcs",
      password: "password123",
      name: "김철수",
      role: "부서관리자",
      department: "IT팀",
      position: "대리",
      phone: "010-2345-6789",
      email: "kim@company.com",
      status: "active",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-15 08:45",
      joinDate: "2021-07-01",
      createdAt: "2021-07-01"
    },
    {
      id: 3,
      account: "leeyh",
      password: "password456",
      name: "이영희",
      role: "부서관리자",
      department: "생산팀",
      position: "팀장",
      phone: "010-3456-7890",
      email: "lee@company.com",
      status: "active",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-15 10:15",
      joinDate: "2019-05-20",
      createdAt: "2019-05-20"
    },
    {
      id: 4,
      account: "parkms",
      password: "password789",
      name: "박민수",
      role: "일반사용자",
      department: "품질팀",
      position: "주임",
      phone: "010-4567-8901",
      email: "park@company.com",
      status: "active",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-10 14:20",
      joinDate: "2022-01-10",
      createdAt: "2022-01-10"
    },
    {
      id: 5,
      account: "jungsj",
      password: "password012",
      name: "정수진",
      role: "부서관리자",
      department: "영업팀",
      position: "부장",
      phone: "010-5678-9012",
      email: "jung@company.com",
      status: "active",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-15 11:30",
      joinDate: "2018-03-01",
      createdAt: "2018-03-01"
    },
    {
      id: 6,
      account: "choihw",
      password: "password345",
      name: "최현우",
      role: "일반사용자",
      department: "재고팀",
      position: "대리",
      phone: "010-6789-0123",
      email: "choi@company.com",
      status: "inactive",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-05 16:45",
      joinDate: "2021-09-15",
      createdAt: "2021-09-15"
    },
    {
      id: 7,
      account: "testuser",
      password: "test123",
      name: "테스트사용자",
      role: "조회전용",
      department: "IT팀",
      position: "사원",
      phone: "010-7890-1234",
      email: "test@company.com",
      status: "active",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      lastLogin: "2024-01-14 13:20",
      joinDate: "2023-01-01",
      createdAt: "2023-01-01"
    }
  ];

  private departments: Department[] = [
    { id: 1, name: "IT팀", code: "IT", manager: "시스템관리자", description: "정보기술 및 시스템 관리", status: "active", createdAt: "2020-03-15" },
    { id: 2, name: "생산팀", code: "PRD", manager: "이영희", description: "제품 생산 및 품질 관리", status: "active", createdAt: "2019-05-20" },
    { id: 3, name: "품질팀", code: "QA", manager: "박민수", description: "품질 검사 및 관리", status: "active", createdAt: "2022-01-10" },
    { id: 4, name: "영업팀", code: "SALES", manager: "정수진", description: "고객 관리 및 영업 활동", status: "active", createdAt: "2018-03-01" },
    { id: 5, name: "재고팀", code: "INV", manager: "최현우", description: "재고 관리 및 물류", status: "inactive", createdAt: "2021-09-15" }
  ];

  private roles: Role[] = [
    { 
      id: 1, 
      code: "ADMIN", 
      name: "시스템관리자", 
      description: "시스템 전체 관리 권한", 
      permissions: [
        "USERS_VIEW", "USERS_EDIT", "ROLES_VIEW", "ROLES_EDIT", "DEPARTMENTS_VIEW", "DEPARTMENTS_EDIT",
        "LOGIN_HISTORY_VIEW", "CUSTOMERS_VIEW", "CUSTOMERS_EDIT", "PRODUCTS_VIEW", "PRODUCTS_EDIT",
        "MATERIALS_VIEW", "MATERIALS_EDIT", "LINES_VIEW", "LINES_EDIT", "EQUIPMENTS_VIEW", "EQUIPMENTS_EDIT",
        "PROCESSES_VIEW", "PROCESSES_EDIT", "WAREHOUSES_VIEW", "WAREHOUSES_EDIT", "ROUTINGS_VIEW", "ROUTINGS_EDIT",
        "BOM_VIEW", "BOM_EDIT", "PRODUCTION_PLAN_VIEW", "PRODUCTION_PLAN_EDIT", "WORK_ORDER_VIEW", "WORK_ORDER_EDIT",
        "PRODUCTION_RESULT_VIEW", "PRODUCTION_RESULT_EDIT", "INSPECTION_PLAN_VIEW", "INSPECTION_PLAN_EDIT",
        "INSPECTION_RESULT_VIEW", "INSPECTION_RESULT_EDIT", "INBOUND_VIEW", "INBOUND_EDIT", "OUTBOUND_VIEW", "OUTBOUND_EDIT",
        "INVENTORY_STATUS_VIEW", "INVENTORY_STATUS_EDIT"
      ],
      status: "active", 
      createdAt: "2020-03-15" 
    },
    { 
      id: 2, 
      code: "MANAGER", 
      name: "부서관리자", 
      description: "부서 내 사용자 및 업무 관리", 
      permissions: [
        "USERS_VIEW", "DEPARTMENTS_VIEW", "LOGIN_HISTORY_VIEW", "CUSTOMERS_VIEW", "PRODUCTS_VIEW",
        "MATERIALS_VIEW", "LINES_VIEW", "EQUIPMENTS_VIEW", "PROCESSES_VIEW", "WAREHOUSES_VIEW",
        "ROUTINGS_VIEW", "BOM_VIEW", "PRODUCTION_PLAN_VIEW", "PRODUCTION_PLAN_EDIT", "WORK_ORDER_VIEW", "WORK_ORDER_EDIT",
        "PRODUCTION_RESULT_VIEW", "PRODUCTION_RESULT_EDIT", "INSPECTION_PLAN_VIEW", "INSPECTION_PLAN_EDIT",
        "INSPECTION_RESULT_VIEW", "INSPECTION_RESULT_EDIT", "INBOUND_VIEW", "INBOUND_EDIT", "OUTBOUND_VIEW", "OUTBOUND_EDIT",
        "INVENTORY_STATUS_VIEW", "INVENTORY_STATUS_EDIT"
      ],
      status: "active", 
      createdAt: "2019-05-20" 
    },
    { 
      id: 3, 
      code: "USER", 
      name: "일반사용자", 
      description: "기본 업무 수행 권한", 
      permissions: [
        "CUSTOMERS_VIEW", "PRODUCTS_VIEW", "MATERIALS_VIEW", "LINES_VIEW", "EQUIPMENTS_VIEW",
        "PROCESSES_VIEW", "WAREHOUSES_VIEW", "ROUTINGS_VIEW", "BOM_VIEW", "PRODUCTION_PLAN_VIEW",
        "WORK_ORDER_VIEW", "WORK_ORDER_EDIT", "PRODUCTION_RESULT_VIEW", "PRODUCTION_RESULT_EDIT",
        "INSPECTION_PLAN_VIEW", "INSPECTION_RESULT_VIEW", "INSPECTION_RESULT_EDIT", "INBOUND_VIEW", "INBOUND_EDIT",
        "OUTBOUND_VIEW", "OUTBOUND_EDIT", "INVENTORY_STATUS_VIEW"
      ],
      status: "active", 
      createdAt: "2022-01-10" 
    },
    { 
      id: 4, 
      code: "VIEWER", 
      name: "조회전용", 
      description: "데이터 조회만 가능", 
      permissions: [
        "CUSTOMERS_VIEW", "PRODUCTS_VIEW", "MATERIALS_VIEW", "LINES_VIEW", "EQUIPMENTS_VIEW",
        "PROCESSES_VIEW", "WAREHOUSES_VIEW", "ROUTINGS_VIEW", "BOM_VIEW", "PRODUCTION_PLAN_VIEW",
        "WORK_ORDER_VIEW", "PRODUCTION_RESULT_VIEW", "INSPECTION_PLAN_VIEW", "INSPECTION_RESULT_VIEW",
        "INBOUND_VIEW", "OUTBOUND_VIEW", "INVENTORY_STATUS_VIEW"
      ],
      status: "active", 
      createdAt: "2023-01-01" 
    },
    { 
      id: 5, 
      code: "GUEST", 
      name: "게스트", 
      description: "제한된 조회 권한", 
      permissions: [
        "PRODUCTS_VIEW", "MATERIALS_VIEW", "INVENTORY_STATUS_VIEW"
      ],
      status: "inactive", 
      createdAt: "2024-01-01" 
    }
  ];

  private loginHistory: LoginHistory[] = [];

  private customers: Customer[] = [
    {
      id: 1,
      code: "CUST001",
      name: "(주)삼성전자",
      type: "고객사",
      representative: "김대표",
      businessNumber: "123-45-67890",
      phone: "02-1234-5678",
      email: "contact@samsung.com",
      address: "서울시 강남구 테헤란로 123",
      manager: "박영수",
      managerPhone: "010-1111-2222",
      status: "active",
      createdAt: "2023-01-15"
    },
    {
      id: 2,
      code: "SUPP001",
      name: "(주)현대자재",
      type: "공급업체",
      representative: "이사장",
      businessNumber: "234-56-78901",
      phone: "02-2345-6789",
      email: "info@hyundai-mat.com",
      address: "경기도 성남시 분당구 판교로 456",
      manager: "최담당",
      managerPhone: "010-2222-3333",
      status: "active",
      createdAt: "2023-02-01"
    },
    {
      id: 3,
      code: "PART001",
      name: "(주)LG협력",
      type: "협력업체",
      representative: "정대표",
      businessNumber: "345-67-89012",
      phone: "031-3456-7890",
      email: "partner@lg-coop.com",
      address: "경기도 수원시 영통구 월드컵로 789",
      manager: "강과장",
      managerPhone: "010-3333-4444",
      status: "active",
      createdAt: "2023-03-10"
    },
    {
      id: 4,
      code: "CUST002",
      name: "(주)하이테크",
      type: "고객사",
      representative: "송대표",
      businessNumber: "456-78-90123",
      phone: "02-4567-8901",
      email: "sales@hitech.com",
      address: "서울시 서초구 서초대로 321",
      manager: "윤팀장",
      managerPhone: "010-4444-5555",
      status: "inactive",
      createdAt: "2023-04-20"
    },
    {
      id: 5,
      code: "SUPP002",
      name: "(주)부품상사",
      type: "공급업체",
      representative: "한대표",
      businessNumber: "567-89-01234",
      phone: "031-5678-9012",
      email: "supply@parts.com",
      address: "경기도 안양시 동안구 평촌대로 654",
      manager: "임주임",
      managerPhone: "010-5555-6666",
      status: "active",
      createdAt: "2023-05-15"
    }
  ];

  private products: Product[] = [
    {
      id: 1,
      code: "PROD001",
      name: "스마트폰 케이스",
      category: "제품",
      specification: "150x75x10mm",
      unit: "EA",
      standardCost: 5000,
      sellingPrice: 15000,
      customer: "(주)삼성전자",
      description: "프리미엄 스마트폰 보호 케이스",
      image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop",
      status: "active",
      createdAt: "2023-01-10"
    },
    {
      id: 2,
      code: "PROD002",
      name: "노트북 거치대",
      category: "제품",
      specification: "300x250x50mm",
      unit: "EA",
      standardCost: 12000,
      sellingPrice: 35000,
      customer: "(주)하이테크",
      description: "알루미늄 접이식 노트북 거치대",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
      status: "active",
      createdAt: "2023-02-05"
    },
    {
      id: 3,
      code: "SEMI001",
      name: "플라스틱 하우징",
      category: "반제품",
      specification: "100x80x30mm",
      unit: "EA",
      standardCost: 2000,
      sellingPrice: 4000,
      customer: "(주)삼성전자",
      description: "전자제품용 플라스틱 외장",
      image: "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=400&h=400&fit=crop",
      status: "active",
      createdAt: "2023-03-15"
    },
    {
      id: 4,
      code: "MERCH001",
      name: "무선 이어폰",
      category: "상품",
      specification: "Bluetooth 5.0",
      unit: "SET",
      standardCost: 25000,
      sellingPrice: 89000,
      customer: "(주)삼성전자",
      description: "프리미엄 무선 이어폰 세트",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
      status: "active",
      createdAt: "2023-04-20"
    },
    {
      id: 5,
      code: "PROD003",
      name: "USB 허브",
      category: "제품",
      specification: "4 Port USB 3.0",
      unit: "EA",
      standardCost: 8000,
      sellingPrice: 25000,
      customer: "(주)하이테크",
      description: "멀티포트 USB 허브",
      image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
      status: "inactive",
      createdAt: "2023-05-10"
    }
  ];

  private materials: Material[] = [
    {
      id: 1,
      code: "MAT001",
      name: "알루미늄 판재",
      category: "원자재",
      specification: "1000x500x2mm",
      unit: "KG",
      purchasePrice: 8500,
      supplier: "(주)현대자재",
      description: "6061 알루미늄 합금 판재",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23c0c0c0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-weight='bold'%3E알루미늄%3C/text%3E%3C/svg%3E",
      status: "active",
      createdAt: "2023-01-15"
    },
    {
      id: 2,
      code: "MAT002",
      name: "ABS 플라스틱",
      category: "원자재",
      specification: "고강도 사출용",
      unit: "KG",
      purchasePrice: 3200,
      supplier: "(주)부품상사",
      description: "내열성 ABS 수지",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23fbbf24'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-weight='bold'%3EABS%3C/text%3E%3C/svg%3E",
      status: "active",
      createdAt: "2023-02-10"
    },
    {
      id: 3,
      code: "SUB001",
      name: "나사 세트",
      category: "부자재",
      specification: "M3x8mm",
      unit: "SET",
      purchasePrice: 150,
      supplier: "(주)LG협력",
      description: "스테인리스 십자 나사 100개입",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%2394a3b8'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-weight='bold'%3E나사%3C/text%3E%3C/svg%3E",
      status: "active",
      createdAt: "2023-03-05"
    },
    {
      id: 4,
      code: "SUB002",
      name: "포장 박스",
      category: "부자재",
      specification: "200x150x100mm",
      unit: "EA",
      purchasePrice: 500,
      supplier: "(주)삼성전자",
      description: "5겹 골판지 박스",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23a78bfa'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-weight='bold'%3E박스%3C/text%3E%3C/svg%3E",
      status: "active",
      createdAt: "2023-04-12"
    },
    {
      id: 5,
      code: "MAT003",
      name: "실리콘 고무",
      category: "원자재",
      specification: "내열 250도",
      unit: "KG",
      purchasePrice: 12000,
      supplier: "(주)하이테크",
      description: "의료용 실리콘 원료",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%2334d399'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-weight='bold'%3E실리콘%3C/text%3E%3C/svg%3E",
      status: "inactive",
      createdAt: "2023-05-20"
    }
  ];

  private lines: Line[] = [
    {
      id: 1,
      code: "LINE001",
      name: "조립라인 A",
      location: "1공장 1층",
      capacity: 1000,
      manager: "김철수",
      description: "스마트폰 케이스 조립 라인",
      status: "active",
      createdAt: "2023-01-10"
    },
    {
      id: 2,
      code: "LINE002",
      name: "사출라인 B",
      location: "1공장 2층",
      capacity: 500,
      manager: "이영희",
      description: "플라스틱 사출 성형 라인",
      status: "active",
      createdAt: "2023-02-15"
    },
    {
      id: 3,
      code: "LINE003",
      name: "검사라인 C",
      location: "2공장 1층",
      capacity: 800,
      manager: "박민수",
      description: "최종 제품 품질 검사 라인",
      status: "active",
      createdAt: "2023-03-20"
    },
    {
      id: 4,
      code: "LINE004",
      name: "포장라인 D",
      location: "2공장 2층",
      capacity: 1200,
      manager: "정수연",
      description: "완제품 포장 및 출하 라인",
      status: "active",
      createdAt: "2023-04-10"
    },
    {
      id: 5,
      code: "LINE005",
      name: "도금라인 E",
      location: "3공장 1층",
      capacity: 300,
      manager: "최동욱",
      description: "금속 표면 도금 처리 라인",
      status: "inactive",
      createdAt: "2023-05-25"
    }
  ];

  private equipments: Equipment[] = [
    {
      id: 1,
      code: "EQ001",
      name: "CNC 가공기",
      type: "가공설비",
      manufacturer: "두산공작기계",
      model: "DNM-400",
      purchaseDate: "2022-01-15",
      line: "조립라인 A",
      manager: "김철수",
      description: "5축 CNC 밀링 머신",
      status: "active",
      createdAt: "2022-01-15"
    },
    {
      id: 2,
      code: "EQ002",
      name: "사출 성형기",
      type: "성형설비",
      manufacturer: "LS엠트론",
      model: "HPM-180",
      purchaseDate: "2022-03-10",
      line: "사출라인 B",
      manager: "이영희",
      description: "180톤 사출 성형기",
      status: "active",
      createdAt: "2022-03-10"
    },
    {
      id: 3,
      code: "EQ003",
      name: "3D 스캐너",
      type: "검사설비",
      manufacturer: "칼자이스",
      model: "T-SCAN CS",
      purchaseDate: "2022-05-20",
      line: "검사라인 C",
      manager: "박민수",
      description: "고정밀 3D 치수 검사기",
      status: "active",
      createdAt: "2022-05-20"
    },
    {
      id: 4,
      code: "EQ004",
      name: "자동 포장기",
      type: "포장설비",
      manufacturer: "청호나이스",
      model: "AP-500",
      purchaseDate: "2022-07-15",
      line: "포장라인 D",
      manager: "정수연",
      description: "자동 박스 테이핑 머신",
      status: "active",
      createdAt: "2022-07-15"
    },
    {
      id: 5,
      code: "EQ005",
      name: "도금 설비",
      type: "표면처리설비",
      manufacturer: "한국표면처리",
      model: "KP-300",
      purchaseDate: "2021-12-01",
      line: "도금라인 E",
      manager: "최동욱",
      description: "전기 도금 처리 장비",
      status: "inactive",
      createdAt: "2021-12-01"
    }
  ];

  private processes: Process[] = [
    {
      id: 1,
      code: "PROC001",
      name: "외관 가공",
      type: "가공",
      standardTime: 15,
      line: "조립라인 A",
      warehouse: "공정창고 1",
      description: "케이스 외관 밀링 가공",
      status: "active",
      createdAt: "2023-01-20"
    },
    {
      id: 2,
      code: "PROC002",
      name: "사출 성형",
      type: "성형",
      standardTime: 30,
      line: "사출라인 B",
      warehouse: "공정창고 2",
      description: "플라스틱 부품 사출 성형",
      status: "active",
      createdAt: "2023-02-10"
    },
    {
      id: 3,
      code: "PROC003",
      name: "치수 검사",
      type: "검사",
      standardTime: 10,
      line: "검사라인 C",
      warehouse: "공정창고 1",
      description: "3D 스캔 치수 검사",
      status: "active",
      createdAt: "2023-03-15"
    },
    {
      id: 4,
      code: "PROC004",
      name: "최종 포장",
      type: "포장",
      standardTime: 5,
      line: "포장라인 D",
      warehouse: "공정창고 3",
      description: "완제품 포장 및 라벨링",
      status: "active",
      createdAt: "2023-04-05"
    },
    {
      id: 5,
      code: "PROC005",
      name: "표면 도금",
      type: "표면처리",
      standardTime: 60,
      line: "도금라인 E",
      warehouse: "공정창고 2",
      description: "니켈 크롬 도금 처리",
      status: "inactive",
      createdAt: "2023-05-10"
    }
  ];

  private routings: Routing[] = [
    {
      id: 1,
      code: "RT001",
      name: "스마트폰 케이스 라우팅",
      status: "active",
      createdAt: "2023-01-25"
    },
    {
      id: 2,
      code: "RT002",
      name: "플라스틱 하우징 라우팅",
      status: "active",
      createdAt: "2023-03-20"
    },
    {
      id: 3,
      code: "RT003",
      name: "노트북 거치대 라우팅",
      status: "active",
      createdAt: "2023-05-10"
    }
  ];

  private routingSteps: RoutingStep[] = [
    // RT001 - 스마트폰 케이스 라우팅
    {
      id: 1,
      routingId: 1,
      sequence: 1,
      line: "조립라인 A",
      process: "외관 가공",
      mainEquipment: "CNC 가공기",
      standardManHours: 0.5,
      previousProcess: "-",
      nextProcess: "치수 검사"
    },
    {
      id: 2,
      routingId: 1,
      sequence: 2,
      line: "검사라인 C",
      process: "치수 검사",
      mainEquipment: "3D 스캐너",
      standardManHours: 0.3,
      previousProcess: "외관 가공",
      nextProcess: "최종 포장"
    },
    {
      id: 3,
      routingId: 1,
      sequence: 3,
      line: "포장라인 D",
      process: "최종 포장",
      mainEquipment: "자동 포장기",
      standardManHours: 0.2,
      previousProcess: "치수 검사",
      nextProcess: "-"
    },
    // RT002 - 플라스틱 하우징 라우팅
    {
      id: 4,
      routingId: 2,
      sequence: 1,
      line: "사출라인 B",
      process: "사출 성형",
      mainEquipment: "사출기",
      standardManHours: 0.8,
      previousProcess: "-",
      nextProcess: "최종 포장"
    },
    {
      id: 5,
      routingId: 2,
      sequence: 2,
      line: "포장라인 D",
      process: "최종 포장",
      mainEquipment: "자동 포장기",
      standardManHours: 0.2,
      previousProcess: "사출 성형",
      nextProcess: "-"
    },
    // RT003 - 노트북 거치대 라우팅
    {
      id: 6,
      routingId: 3,
      sequence: 1,
      line: "조립라인 A",
      process: "외관 가공",
      mainEquipment: "CNC 가공기",
      standardManHours: 1.0,
      previousProcess: "-",
      nextProcess: "표면 도금"
    },
    {
      id: 7,
      routingId: 3,
      sequence: 2,
      line: "도금라인 E",
      process: "표면 도금",
      mainEquipment: "도금 장비",
      standardManHours: 1.5,
      previousProcess: "외관 가공",
      nextProcess: "치수 검사"
    },
    {
      id: 8,
      routingId: 3,
      sequence: 3,
      line: "검사라인 C",
      process: "치수 검사",
      mainEquipment: "3D 스캐너",
      standardManHours: 0.3,
      previousProcess: "표면 도금",
      nextProcess: "-"
    }
  ];

  private boms: BOM[] = [
    {
      id: 1,
      productCode: "PROD001",
      productName: "스마트폰 케이스",
      routingId: 1,
      routingName: "스마트폰 케이스 라우팅",
      revision: "Rev.01",
      status: "active",
      createdAt: "2023-01-30"
    },
    {
      id: 2,
      productCode: "PROD002",
      productName: "플라스틱 하우징",
      routingId: 2,
      routingName: "플라스틱 하우징 라우팅",
      revision: "Rev.01",
      status: "active",
      createdAt: "2023-02-15"
    },
    {
      id: 3,
      productCode: "PROD003",
      productName: "노트북 거치대",
      routingId: 3,
      routingName: "노트북 거치대 라우팅",
      revision: "Rev.01",
      status: "active",
      createdAt: "2023-03-20"
    }
  ];

  private bomItems: BOMItem[] = [
    // BOM ID 1 - 스마트폰 케이스 (Rev.01)
    {
      id: 1,
      bomId: 1,
      processSequence: 1,
      processName: "외관 가공",
      materialCode: "MAT001",
      materialName: "알루미늄 판재",
      quantity: 0.5,
      unit: "KG",
      lossRate: 5,
      alternateMaterial: "MAT002"
    },
    {
      id: 2,
      bomId: 1,
      processSequence: 1,
      processName: "외관 가공",
      materialCode: "MAT004",
      materialName: "절삭유",
      quantity: 0.1,
      unit: "L",
      lossRate: 10,
      alternateMaterial: ""
    },
    {
      id: 3,
      bomId: 1,
      processSequence: 3,
      processName: "최종 포장",
      materialCode: "MAT005",
      materialName: "포장 박스",
      quantity: 1,
      unit: "EA",
      lossRate: 2,
      alternateMaterial: ""
    },
    // BOM ID 2 - 플라스틱 하우징 (Rev.01)
    {
      id: 4,
      bomId: 2,
      processSequence: 1,
      processName: "사출 성형",
      materialCode: "MAT002",
      materialName: "ABS 수지",
      quantity: 2,
      unit: "KG",
      lossRate: 3,
      alternateMaterial: "MAT001"
    },
    {
      id: 5,
      bomId: 2,
      processSequence: 2,
      processName: "최종 포장",
      materialCode: "MAT005",
      materialName: "포장 박스",
      quantity: 1,
      unit: "EA",
      lossRate: 2,
      alternateMaterial: ""
    },
    // BOM ID 3 - 노트북 거치대 (Rev.01)
    {
      id: 6,
      bomId: 3,
      processSequence: 1,
      processName: "외관 가공",
      materialCode: "MAT001",
      materialName: "알루미늄 판재",
      quantity: 1.2,
      unit: "KG",
      lossRate: 5,
      alternateMaterial: "MAT002"
    },
    {
      id: 7,
      bomId: 3,
      processSequence: 2,
      processName: "표면 도금",
      materialCode: "MAT003",
      materialName: "나사 세트",
      quantity: 1,
      unit: "SET",
      lossRate: 1,
      alternateMaterial: ""
    }
  ];

  private warehouses: Warehouse[] = [
    {
      id: 1,
      code: "WH001",
      name: "원자재 1창고",
      type: "원자재창고",
      location: "1공장 A동",
      capacity: 5000,
      manager: "김영수",
      description: "알루미늄, 플라스틱 원자재 보관",
      status: "active",
      createdAt: "2023-01-05"
    },
    {
      id: 2,
      code: "WH002",
      name: "제품 1창고",
      type: "제품창고",
      location: "2공장 B동",
      capacity: 10000,
      manager: "이민정",
      description: "완제품 보관 및 출하 대기",
      status: "active",
      createdAt: "2023-02-10"
    },
    {
      id: 3,
      code: "WH003",
      name: "자재 1창고",
      type: "자재창고",
      location: "1공장 C동",
      capacity: 3000,
      manager: "박준호",
      description: "부자재 및 소모품 보관",
      status: "active",
      createdAt: "2023-03-15"
    },
    {
      id: 4,
      code: "WH004",
      name: "제품 2창고",
      type: "제품창고",
      location: "3공장 D동",
      capacity: 8000,
      manager: "정수연",
      description: "수출용 제품 보관",
      status: "active",
      createdAt: "2023-04-20"
    },
    {
      id: 5,
      code: "WH005",
      name: "원자재 2창고",
      type: "원자재창고",
      location: "2공장 E동",
      capacity: 4000,
      manager: "최동욱",
      description: "예비 원자재 보관소",
      status: "inactive",
      createdAt: "2023-05-25"
    }
  ];

  private productionPlans: ProductionPlan[] = [
    {
      id: 1,
      planCode: "PLAN-2025-001",
      planDate: "2025-10-07",
      productCode: "PROD001",
      productName: "스마트폰 케이스",
      planQuantity: 1000,
      unit: "EA",
      startDate: "2025-10-08",
      endDate: "2025-10-12",
      status: "계획",
      manager: "김철수",
      note: "신규 고객 주문 건",
      createdAt: "2025-10-07"
    },
    {
      id: 2,
      planCode: "PLAN-2025-002",
      planDate: "2025-10-07",
      productCode: "PROD002",
      productName: "플라스틱 하우징",
      planQuantity: 500,
      unit: "EA",
      startDate: "2025-10-09",
      endDate: "2025-10-11",
      status: "진행중",
      manager: "이영희",
      note: "",
      createdAt: "2025-10-05",
      modifiedAt: "2025-10-07"
    },
    {
      id: 3,
      planCode: "PLAN-2025-003",
      planDate: "2025-10-06",
      productCode: "PROD003",
      productName: "노트북 거치대",
      planQuantity: 300,
      unit: "EA",
      startDate: "2025-10-07",
      endDate: "2025-10-10",
      status: "완료",
      manager: "박지민",
      note: "정기 생산 계획",
      createdAt: "2025-10-01",
      modifiedAt: "2025-10-06"
    },
    {
      id: 4,
      planCode: "PLAN-2025-004",
      planDate: "2025-10-08",
      productCode: "PROD001",
      productName: "스마트폰 케이스",
      planQuantity: 2000,
      unit: "EA",
      startDate: "2025-10-15",
      endDate: "2025-10-20",
      status: "계획",
      manager: "최민수",
      note: "대량 주문 건",
      createdAt: "2025-10-08"
    }
  ];

  private workOrders: WorkOrder[] = [
    {
      id: 1,
      orderCode: "WO-2025-001",
      orderDate: "2025-10-07",
      planCode: "PLAN-2025-001",
      productCode: "PROD001",
      productName: "스마트폰 케이스",
      orderQuantity: 500,
      unit: "EA",
      line: "조립라인 A",
      startDate: "2025-10-08",
      endDate: "2025-10-10",
      status: "진행중",
      worker: "작업자1팀",
      note: "1차 작업지시",
      createdAt: "2025-10-07"
    },
    {
      id: 2,
      orderCode: "WO-2025-002",
      orderDate: "2025-10-07",
      planCode: "PLAN-2025-002",
      productCode: "PROD002",
      productName: "플라스틱 하우징",
      orderQuantity: 500,
      unit: "EA",
      line: "사출라인 B",
      startDate: "2025-10-09",
      endDate: "2025-10-11",
      status: "대기",
      worker: "작업자2팀",
      note: "",
      createdAt: "2025-10-07"
    },
    {
      id: 3,
      orderCode: "WO-2025-003",
      orderDate: "2025-10-06",
      planCode: "PLAN-2025-003",
      productCode: "PROD003",
      productName: "노트북 거치대",
      orderQuantity: 300,
      unit: "EA",
      line: "조립라인 A",
      startDate: "2025-10-07",
      endDate: "2025-10-10",
      status: "완료",
      worker: "작업자1팀",
      note: "정기 생산",
      createdAt: "2025-10-06",
      modifiedAt: "2025-10-10"
    }
  ];

  private productionResults: ProductionResult[] = [
    {
      id: 1,
      resultCode: "PR-2025-001",
      resultDate: "2025-10-08",
      orderCode: "WO-2025-001",
      productCode: "PROD001",
      productName: "스마트폰 케이스",
      line: "조립라인 A",
      processSequence: 1,
      processName: "외관 가공",
      targetQuantity: 500,
      resultQuantity: 480,
      defectQuantity: 20,
      unit: "EA",
      worker: "김작업",
      startTime: "08:00",
      endTime: "12:00",
      note: "일부 불량 발생",
      createdAt: "2025-10-08"
    },
    {
      id: 2,
      resultCode: "PR-2025-002",
      resultDate: "2025-10-08",
      orderCode: "WO-2025-001",
      productCode: "PROD001",
      productName: "스마트폰 케이스",
      line: "조립라인 A",
      processSequence: 2,
      processName: "치수 검사",
      targetQuantity: 480,
      resultQuantity: 475,
      defectQuantity: 5,
      unit: "EA",
      worker: "이검사",
      startTime: "13:00",
      endTime: "15:00",
      note: "",
      createdAt: "2025-10-08"
    },
    {
      id: 3,
      resultCode: "PR-2025-003",
      resultDate: "2025-10-10",
      orderCode: "WO-2025-003",
      productCode: "PROD003",
      productName: "노트북 거치대",
      line: "조립라인 A",
      processSequence: 1,
      processName: "최종 포장",
      targetQuantity: 300,
      resultQuantity: 300,
      defectQuantity: 0,
      unit: "EA",
      worker: "박포장",
      startTime: "09:00",
      endTime: "11:00",
      note: "양품 100%",
      createdAt: "2025-10-10"
    }
  ];

  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  // Users
  getUsers() {
    return this.users;
  }

  addUser(newUser: Omit<User, "id">) {
    const user: User = { 
      ...newUser, 
      id: this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0]
    };
    this.users = [...this.users, user];
    this.emit();
    return user;
  }

  updateUser(updated: User) {
    const userWithModifiedDate = { ...updated, modifiedAt: new Date().toISOString().split("T")[0] };
    this.users = this.users.map(u => (u.id === updated.id ? userWithModifiedDate : u));
    this.emit();
  }

  deleteUser(userId: number) {
    this.users = this.users.filter(u => u.id !== userId);
    this.emit();
  }

  // Departments
  getDepartments() {
    return this.departments;
  }

  addDepartment(newDept: Omit<Department, "id" | "createdAt" | "status"> & Partial<Pick<Department, "status">>) {
    const department: Department = {
      id: this.departments.length ? Math.max(...this.departments.map(d => d.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newDept.status ?? "active",
      name: newDept.name,
      code: newDept.code,
      manager: newDept.manager,
      description: newDept.description
    };
    this.departments = [...this.departments, department];
    this.emit();
    return department;
  }

  updateDepartment(deptId: number, updater: (prev: Department) => Department) {
    const prev = this.departments.find(d => d.id === deptId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    const nameChanged = prev.name !== updated.name;
    this.departments = this.departments.map(d => (d.id === deptId ? updated : d));
    if (nameChanged) {
      // Propagate department name changes to users
      this.users = this.users.map(u => (u.department === prev.name ? { ...u, department: updated.name } : u));
    }
    this.emit();
  }

  toggleDepartmentStatus(deptId: number) {
    this.departments = this.departments.map(d => d.id === deptId ? { ...d, status: d.status === "active" ? "inactive" : "active" } : d);
    this.emit();
  }

  deleteDepartment(deptId: number) {
    const removed = this.departments.find(d => d.id === deptId);
    this.departments = this.departments.filter(d => d.id !== deptId);
    if (removed) {
      // Unassign users from removed department
      this.users = this.users.map(u => (u.department === removed.name ? { ...u, department: "" } : u));
    }
    this.emit();
  }

  // Roles
  getRoles() {
    return this.roles;
  }

  addRole(newRole: Omit<Role, "id" | "createdAt" | "status"> & Partial<Pick<Role, "status">>) {
    const role: Role = {
      id: this.roles.length ? Math.max(...this.roles.map(r => r.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newRole.status ?? "active",
      code: newRole.code,
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions
    };
    this.roles = [...this.roles, role];
    this.emit();
    return role;
  }

  updateRole(roleId: number, updater: (prev: Role) => Role) {
    const prev = this.roles.find(r => r.id === roleId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.roles = this.roles.map(r => (r.id === roleId ? updated : r));
    this.emit();
  }

  deleteRole(roleId: number) {
    this.roles = this.roles.filter(r => r.id !== roleId);
    this.emit();
  }

  // Login History
  getLoginHistory() {
    return this.loginHistory;
  }

  addLoginHistory(history: Omit<LoginHistory, "id">) {
    const newHistory: LoginHistory = {
      ...history,
      id: this.loginHistory.length ? Math.max(...this.loginHistory.map(h => h.id)) + 1 : 1,
    };
    this.loginHistory = [newHistory, ...this.loginHistory]; // 최신 기록을 앞에
    this.emit();
    return newHistory;
  }

  // Customers
  getCustomers() {
    return this.customers;
  }

  addCustomer(newCustomer: Omit<Customer, "id" | "createdAt" | "status"> & Partial<Pick<Customer, "status">>) {
    const customer: Customer = {
      id: this.customers.length ? Math.max(...this.customers.map(c => c.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newCustomer.status ?? "active",
      code: newCustomer.code,
      name: newCustomer.name,
      type: newCustomer.type,
      representative: newCustomer.representative,
      businessNumber: newCustomer.businessNumber,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address,
      manager: newCustomer.manager,
      managerPhone: newCustomer.managerPhone
    };
    this.customers = [...this.customers, customer];
    this.emit();
    return customer;
  }

  updateCustomer(customerId: number, updater: (prev: Customer) => Customer) {
    const prev = this.customers.find(c => c.id === customerId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.customers = this.customers.map(c => (c.id === customerId ? updated : c));
    this.emit();
  }

  deleteCustomer(customerId: number) {
    this.customers = this.customers.filter(c => c.id !== customerId);
    this.emit();
  }

  // Products
  getProducts() {
    return this.products;
  }

  addProduct(newProduct: Omit<Product, "id" | "createdAt" | "status"> & Partial<Pick<Product, "status">>) {
    const product: Product = {
      id: this.products.length ? Math.max(...this.products.map(p => p.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newProduct.status ?? "active",
      code: newProduct.code,
      name: newProduct.name,
      category: newProduct.category,
      specification: newProduct.specification,
      unit: newProduct.unit,
      standardCost: newProduct.standardCost,
      sellingPrice: newProduct.sellingPrice,
      customer: newProduct.customer,
      description: newProduct.description,
      image: newProduct.image
    };
    this.products = [...this.products, product];
    this.emit();
    return product;
  }

  updateProduct(productId: number, updater: (prev: Product) => Product) {
    const prev = this.products.find(p => p.id === productId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.products = this.products.map(p => (p.id === productId ? updated : p));
    this.emit();
  }

  deleteProduct(productId: number) {
    this.products = this.products.filter(p => p.id !== productId);
    this.emit();
  }

  // Materials
  getMaterials() {
    return this.materials;
  }

  addMaterial(newMaterial: Omit<Material, "id" | "createdAt" | "status"> & Partial<Pick<Material, "status">>) {
    const material: Material = {
      id: this.materials.length ? Math.max(...this.materials.map(m => m.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newMaterial.status ?? "active",
      code: newMaterial.code,
      name: newMaterial.name,
      category: newMaterial.category,
      specification: newMaterial.specification,
      unit: newMaterial.unit,
      purchasePrice: newMaterial.purchasePrice,
      supplier: newMaterial.supplier,
      description: newMaterial.description,
      image: newMaterial.image
    };
    this.materials = [...this.materials, material];
    this.emit();
    return material;
  }

  updateMaterial(materialId: number, updater: (prev: Material) => Material) {
    const prev = this.materials.find(m => m.id === materialId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.materials = this.materials.map(m => (m.id === materialId ? updated : m));
    this.emit();
  }

  deleteMaterial(materialId: number) {
    this.materials = this.materials.filter(m => m.id !== materialId);
    this.emit();
  }

  // Lines
  getLines() {
    return this.lines;
  }

  addLine(newLine: Omit<Line, "id" | "createdAt" | "status"> & Partial<Pick<Line, "status">>) {
    const line: Line = {
      id: this.lines.length ? Math.max(...this.lines.map(l => l.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newLine.status ?? "active",
      code: newLine.code,
      name: newLine.name,
      location: newLine.location,
      capacity: newLine.capacity,
      manager: newLine.manager,
      description: newLine.description
    };
    this.lines = [...this.lines, line];
    this.emit();
    return line;
  }

  updateLine(lineId: number, updater: (prev: Line) => Line) {
    const prev = this.lines.find(l => l.id === lineId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.lines = this.lines.map(l => (l.id === lineId ? updated : l));
    this.emit();
  }

  deleteLine(lineId: number) {
    this.lines = this.lines.filter(l => l.id !== lineId);
    this.emit();
  }

  // Equipments
  getEquipments() {
    return this.equipments;
  }

  addEquipment(newEquipment: Omit<Equipment, "id" | "createdAt" | "status"> & Partial<Pick<Equipment, "status">>) {
    const equipment: Equipment = {
      id: this.equipments.length ? Math.max(...this.equipments.map(e => e.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newEquipment.status ?? "active",
      code: newEquipment.code,
      name: newEquipment.name,
      type: newEquipment.type,
      manufacturer: newEquipment.manufacturer,
      model: newEquipment.model,
      purchaseDate: newEquipment.purchaseDate,
      line: newEquipment.line,
      manager: newEquipment.manager,
      description: newEquipment.description
    };
    this.equipments = [...this.equipments, equipment];
    this.emit();
    return equipment;
  }

  updateEquipment(equipmentId: number, updater: (prev: Equipment) => Equipment) {
    const prev = this.equipments.find(e => e.id === equipmentId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.equipments = this.equipments.map(e => (e.id === equipmentId ? updated : e));
    this.emit();
  }

  deleteEquipment(equipmentId: number) {
    this.equipments = this.equipments.filter(e => e.id !== equipmentId);
    this.emit();
  }

  // Processes
  getProcesses() {
    return this.processes;
  }

  addProcess(newProcess: Omit<Process, "id" | "createdAt" | "status"> & Partial<Pick<Process, "status">>) {
    const process: Process = {
      id: this.processes.length ? Math.max(...this.processes.map(p => p.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newProcess.status ?? "active",
      code: newProcess.code,
      name: newProcess.name,
      type: newProcess.type,
      standardTime: newProcess.standardTime,
      line: newProcess.line,
      warehouse: newProcess.warehouse,
      description: newProcess.description
    };
    this.processes = [...this.processes, process];
    this.emit();
    return process;
  }

  updateProcess(processId: number, updater: (prev: Process) => Process) {
    const prev = this.processes.find(p => p.id === processId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.processes = this.processes.map(p => (p.id === processId ? updated : p));
    this.emit();
  }

  deleteProcess(processId: number) {
    this.processes = this.processes.filter(p => p.id !== processId);
    this.emit();
  }

  // Routings
  getRoutings() {
    return this.routings;
  }

  addRouting(newRouting: Omit<Routing, "id" | "createdAt" | "status"> & Partial<Pick<Routing, "status">>) {
    const routing: Routing = {
      id: this.routings.length ? Math.max(...this.routings.map(r => r.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newRouting.status ?? "active",
      code: newRouting.code,
      name: newRouting.name
    };
    this.routings = [...this.routings, routing];
    this.emit();
    return routing;
  }

  updateRouting(routingId: number, updater: (prev: Routing) => Routing) {
    const prev = this.routings.find(r => r.id === routingId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.routings = this.routings.map(r => (r.id === routingId ? updated : r));
    this.emit();
  }

  deleteRouting(routingId: number) {
    this.routings = this.routings.filter(r => r.id !== routingId);
    // Also delete associated routing steps
    this.routingSteps = this.routingSteps.filter(rs => rs.routingId !== routingId);
    this.emit();
  }

  // Routing Steps
  getRoutingSteps() {
    return this.routingSteps;
  }

  getRoutingStepsByRoutingId(routingId: number) {
    return this.routingSteps.filter(rs => rs.routingId === routingId);
  }

  addRoutingStep(newStep: Omit<RoutingStep, "id">) {
    const step: RoutingStep = {
      id: this.routingSteps.length ? Math.max(...this.routingSteps.map(rs => rs.id)) + 1 : 1,
      ...newStep
    };
    this.routingSteps = [...this.routingSteps, step];
    this.emit();
    return step;
  }

  updateRoutingStep(stepId: number, updater: (prev: RoutingStep) => RoutingStep) {
    const prev = this.routingSteps.find(rs => rs.id === stepId);
    if (!prev) return;
    const updated = updater(prev);
    this.routingSteps = this.routingSteps.map(rs => (rs.id === stepId ? updated : rs));
    this.emit();
  }

  deleteRoutingStep(stepId: number) {
    this.routingSteps = this.routingSteps.filter(rs => rs.id !== stepId);
    this.emit();
  }

  saveRoutingSteps(routingId: number, steps: RoutingStep[]) {
    // Remove existing steps for this routing
    this.routingSteps = this.routingSteps.filter(rs => rs.routingId !== routingId);
    // Add new steps
    this.routingSteps = [...this.routingSteps, ...steps];
    // Update routing modified date
    const routing = this.routings.find(r => r.id === routingId);
    if (routing) {
      routing.modifiedAt = new Date().toISOString().split("T")[0];
    }
    this.emit();
  }

  // BOMs
  getBOMs() {
    return this.boms;
  }

  addBOM(newBOM: Omit<BOM, "id" | "createdAt" | "status"> & Partial<Pick<BOM, "status">>) {
    const bom: BOM = {
      id: this.boms.length ? Math.max(...this.boms.map(b => b.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newBOM.status ?? "active",
      productCode: newBOM.productCode,
      productName: newBOM.productName,
      routingId: newBOM.routingId,
      routingName: newBOM.routingName,
      revision: newBOM.revision
    };
    this.boms = [...this.boms, bom];
    this.emit();
    return bom;
  }

  updateBOM(bomId: number, updater: (prev: BOM) => BOM) {
    const prev = this.boms.find(b => b.id === bomId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.boms = this.boms.map(b => (b.id === bomId ? updated : b));
    this.emit();
  }

  deleteBOM(bomId: number) {
    this.boms = this.boms.filter(b => b.id !== bomId);
    // Also delete associated BOM items
    this.bomItems = this.bomItems.filter(bi => bi.bomId !== bomId);
    this.emit();
  }

  // BOM Items
  getBOMItems() {
    return this.bomItems;
  }

  getBOMItemsByBOMId(bomId: number) {
    return this.bomItems.filter(bi => bi.bomId === bomId);
  }

  addBOMItem(newItem: Omit<BOMItem, "id">) {
    const item: BOMItem = {
      id: this.bomItems.length ? Math.max(...this.bomItems.map(bi => bi.id)) + 1 : 1,
      ...newItem
    };
    this.bomItems = [...this.bomItems, item];
    this.emit();
    return item;
  }

  updateBOMItem(itemId: number, updater: (prev: BOMItem) => BOMItem) {
    const prev = this.bomItems.find(bi => bi.id === itemId);
    if (!prev) return;
    const updated = updater(prev);
    this.bomItems = this.bomItems.map(bi => (bi.id === itemId ? updated : bi));
    this.emit();
  }

  deleteBOMItem(itemId: number) {
    this.bomItems = this.bomItems.filter(bi => bi.id !== itemId);
    this.emit();
  }

  saveBOMItems(bomId: number, items: BOMItem[]) {
    // Remove existing items for this BOM
    this.bomItems = this.bomItems.filter(bi => bi.bomId !== bomId);
    // Add new items
    this.bomItems = [...this.bomItems, ...items];
    // Update BOM modified date
    const bom = this.boms.find(b => b.id === bomId);
    if (bom) {
      bom.modifiedAt = new Date().toISOString().split("T")[0];
    }
    this.emit();
  }

  // Warehouses
  getWarehouses() {
    return this.warehouses;
  }

  addWarehouse(newWarehouse: Omit<Warehouse, "id" | "createdAt" | "status"> & Partial<Pick<Warehouse, "status">>) {
    const warehouse: Warehouse = {
      id: this.warehouses.length ? Math.max(...this.warehouses.map(w => w.id)) + 1 : 1,
      createdAt: new Date().toISOString().split("T")[0],
      status: newWarehouse.status ?? "active",
      code: newWarehouse.code,
      name: newWarehouse.name,
      type: newWarehouse.type,
      location: newWarehouse.location,
      capacity: newWarehouse.capacity,
      manager: newWarehouse.manager,
      description: newWarehouse.description
    };
    this.warehouses = [...this.warehouses, warehouse];
    this.emit();
    return warehouse;
  }

  updateWarehouse(warehouseId: number, updater: (prev: Warehouse) => Warehouse) {
    const prev = this.warehouses.find(w => w.id === warehouseId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.warehouses = this.warehouses.map(w => (w.id === warehouseId ? updated : w));
    this.emit();
  }

  deleteWarehouse(warehouseId: number) {
    this.warehouses = this.warehouses.filter(w => w.id !== warehouseId);
    this.emit();
  }

  // Production Plans
  getProductionPlans() {
    return this.productionPlans;
  }

  addProductionPlan(newPlan: Omit<ProductionPlan, "id" | "createdAt"> & Partial<Pick<ProductionPlan, "createdAt">>) {
    const plan: ProductionPlan = {
      id: this.productionPlans.length ? Math.max(...this.productionPlans.map(p => p.id)) + 1 : 1,
      createdAt: newPlan.createdAt ?? new Date().toISOString().split("T")[0],
      ...newPlan
    };
    this.productionPlans = [...this.productionPlans, plan];
    this.emit();
    return plan;
  }

  updateProductionPlan(planId: number, updater: (prev: ProductionPlan) => ProductionPlan) {
    const prev = this.productionPlans.find(p => p.id === planId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.productionPlans = this.productionPlans.map(p => (p.id === planId ? updated : p));
    this.emit();
  }

  deleteProductionPlan(planId: number) {
    this.productionPlans = this.productionPlans.filter(p => p.id !== planId);
    this.emit();
  }

  // Work Orders
  getWorkOrders() {
    return this.workOrders;
  }

  addWorkOrder(newOrder: Omit<WorkOrder, "id" | "createdAt"> & Partial<Pick<WorkOrder, "createdAt">>) {
    const order: WorkOrder = {
      id: this.workOrders.length ? Math.max(...this.workOrders.map(w => w.id)) + 1 : 1,
      createdAt: newOrder.createdAt ?? new Date().toISOString().split("T")[0],
      ...newOrder
    };
    this.workOrders = [...this.workOrders, order];
    this.emit();
    return order;
  }

  updateWorkOrder(orderId: number, updater: (prev: WorkOrder) => WorkOrder) {
    const prev = this.workOrders.find(w => w.id === orderId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.workOrders = this.workOrders.map(w => (w.id === orderId ? updated : w));
    this.emit();
  }

  deleteWorkOrder(orderId: number) {
    this.workOrders = this.workOrders.filter(w => w.id !== orderId);
    this.emit();
  }

  // Production Results
  getProductionResults() {
    return this.productionResults;
  }

  addProductionResult(newResult: Omit<ProductionResult, "id" | "createdAt"> & Partial<Pick<ProductionResult, "createdAt">>) {
    const result: ProductionResult = {
      id: this.productionResults.length ? Math.max(...this.productionResults.map(r => r.id)) + 1 : 1,
      createdAt: newResult.createdAt ?? new Date().toISOString().split("T")[0],
      ...newResult
    };
    this.productionResults = [...this.productionResults, result];
    this.emit();
    return result;
  }

  updateProductionResult(resultId: number, updater: (prev: ProductionResult) => ProductionResult) {
    const prev = this.productionResults.find(r => r.id === resultId);
    if (!prev) return;
    const updated = { ...updater(prev), modifiedAt: new Date().toISOString().split("T")[0] };
    this.productionResults = this.productionResults.map(r => (r.id === resultId ? updated : r));
    this.emit();
  }

  deleteProductionResult(resultId: number) {
    this.productionResults = this.productionResults.filter(r => r.id !== resultId);
    this.emit();
  }
}

const store = new DataStore();

export { store as dataStore };

export function useUsersStore() {
  const users = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getUsers(),
    () => store.getUsers()
  );

  return {
    users,
    addUser: store.addUser.bind(store),
    updateUser: store.updateUser.bind(store),
    deleteUser: store.deleteUser.bind(store)
  };
}

export function useDepartmentsStore() {
  const departments = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getDepartments(),
    () => store.getDepartments()
  );

  return {
    departments,
    addDepartment: store.addDepartment.bind(store),
    updateDepartment: store.updateDepartment.bind(store),
    deleteDepartment: store.deleteDepartment.bind(store),
    toggleDepartmentStatus: store.toggleDepartmentStatus.bind(store)
  };
}

export function useRolesStore() {
  const roles = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getRoles(),
    () => store.getRoles()
  );

  return {
    roles,
    addRole: store.addRole.bind(store),
    updateRole: store.updateRole.bind(store),
    deleteRole: store.deleteRole.bind(store)
  };
}

export function useLoginHistoryStore() {
  const loginHistory = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getLoginHistory(),
    () => store.getLoginHistory()
  );

  return {
    loginHistory,
    addLoginHistory: store.addLoginHistory.bind(store)
  };
}

export function useCustomersStore() {
  const customers = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getCustomers(),
    () => store.getCustomers()
  );

  return {
    customers,
    addCustomer: store.addCustomer.bind(store),
    updateCustomer: store.updateCustomer.bind(store),
    deleteCustomer: store.deleteCustomer.bind(store)
  };
}

export function useProductsStore() {
  const products = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getProducts(),
    () => store.getProducts()
  );

  return {
    products,
    addProduct: store.addProduct.bind(store),
    updateProduct: store.updateProduct.bind(store),
    deleteProduct: store.deleteProduct.bind(store)
  };
}

export function useMaterialsStore() {
  const materials = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getMaterials(),
    () => store.getMaterials()
  );

  return {
    materials,
    addMaterial: store.addMaterial.bind(store),
    updateMaterial: store.updateMaterial.bind(store),
    deleteMaterial: store.deleteMaterial.bind(store)
  };
}

export function useLinesStore() {
  const lines = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getLines(),
    () => store.getLines()
  );

  return {
    lines,
    addLine: store.addLine.bind(store),
    updateLine: store.updateLine.bind(store),
    deleteLine: store.deleteLine.bind(store)
  };
}

export function useEquipmentsStore() {
  const equipments = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getEquipments(),
    () => store.getEquipments()
  );

  return {
    equipments,
    addEquipment: store.addEquipment.bind(store),
    updateEquipment: store.updateEquipment.bind(store),
    deleteEquipment: store.deleteEquipment.bind(store)
  };
}

export function useProcessesStore() {
  const processes = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getProcesses(),
    () => store.getProcesses()
  );

  return {
    processes,
    addProcess: store.addProcess.bind(store),
    updateProcess: store.updateProcess.bind(store),
    deleteProcess: store.deleteProcess.bind(store)
  };
}

export function useRoutingsStore() {
  const routings = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getRoutings(),
    () => store.getRoutings()
  );

  const routingSteps = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getRoutingSteps(),
    () => store.getRoutingSteps()
  );

  return {
    routings,
    routingSteps,
    addRouting: store.addRouting.bind(store),
    updateRouting: store.updateRouting.bind(store),
    deleteRouting: store.deleteRouting.bind(store),
    getRoutingStepsByRoutingId: store.getRoutingStepsByRoutingId.bind(store),
    addRoutingStep: store.addRoutingStep.bind(store),
    updateRoutingStep: store.updateRoutingStep.bind(store),
    deleteRoutingStep: store.deleteRoutingStep.bind(store),
    saveRoutingSteps: store.saveRoutingSteps.bind(store)
  };
}

export function useBOMsStore() {
  const boms = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getBOMs(),
    () => store.getBOMs()
  );

  const bomItems = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getBOMItems(),
    () => store.getBOMItems()
  );

  return {
    boms,
    bomItems,
    addBOM: store.addBOM.bind(store),
    updateBOM: store.updateBOM.bind(store),
    deleteBOM: store.deleteBOM.bind(store),
    getBOMItemsByBOMId: store.getBOMItemsByBOMId.bind(store),
    addBOMItem: store.addBOMItem.bind(store),
    updateBOMItem: store.updateBOMItem.bind(store),
    deleteBOMItem: store.deleteBOMItem.bind(store),
    saveBOMItems: store.saveBOMItems.bind(store)
  };
}

export function useWarehousesStore() {
  const warehouses = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getWarehouses(),
    () => store.getWarehouses()
  );

  return {
    warehouses,
    addWarehouse: store.addWarehouse.bind(store),
    updateWarehouse: store.updateWarehouse.bind(store),
    deleteWarehouse: store.deleteWarehouse.bind(store)
  };
}

export function useProductionPlansStore() {
  const productionPlans = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getProductionPlans(),
    () => store.getProductionPlans()
  );

  return {
    productionPlans,
    addProductionPlan: store.addProductionPlan.bind(store),
    updateProductionPlan: store.updateProductionPlan.bind(store),
    deleteProductionPlan: store.deleteProductionPlan.bind(store)
  };
}

export function useWorkOrdersStore() {
  const workOrders = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getWorkOrders(),
    () => store.getWorkOrders()
  );

  return {
    workOrders,
    addWorkOrder: store.addWorkOrder.bind(store),
    updateWorkOrder: store.updateWorkOrder.bind(store),
    deleteWorkOrder: store.deleteWorkOrder.bind(store)
  };
}

export function useProductionResultsStore() {
  const productionResults = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getProductionResults(),
    () => store.getProductionResults()
  );

  return {
    productionResults,
    addProductionResult: store.addProductionResult.bind(store),
    updateProductionResult: store.updateProductionResult.bind(store),
    deleteProductionResult: store.deleteProductionResult.bind(store)
  };
}



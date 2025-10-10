"use client";

import { useState, useEffect } from "react";
import { useWorkOrdersStore, type WorkOrder, useProductionPlansStore, type ProductionPlan, useProductsStore, useLinesStore, useBOMsStore, useRoutingsStore, useMaterialsStore } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

// Helper function to check and update plan status based on work orders
const checkAndUpdatePlanStatus = (
  plan: ProductionPlan,
  totalOrderQty: number,
  orderCount: number,
  updatePlan: (planId: number, updater: (prev: ProductionPlan) => ProductionPlan) => void
) => {
  const remainingQty = plan.planQuantity - totalOrderQty;
  
  // Priority 1: If remaining quantity is 0 or less and status is not already "완료", update to "완료"
  if (remainingQty <= 0 && plan.status !== "완료") {
    updatePlan(plan.id, (prev) => ({ ...prev, status: "완료" }));
  }
  // Priority 2: If there are 0 work orders and status is not "계획", update to "계획"
  else if (orderCount === 0 && plan.status !== "계획") {
    updatePlan(plan.id, (prev) => ({ ...prev, status: "계획" }));
  }
  // Priority 3: If there are 1 or more work orders and status is "계획", update to "진행중"
  else if (orderCount >= 1 && plan.status === "계획") {
    updatePlan(plan.id, (prev) => ({ ...prev, status: "진행중" }));
  }
};

export default function WorkOrderPage() {
  const { workOrders, addWorkOrder, updateWorkOrder, deleteWorkOrder } = useWorkOrdersStore();
  const { productionPlans, updateProductionPlan } = useProductionPlansStore();
  const { products } = useProductsStore();
  const { lines } = useLinesStore();
  const { boms, bomItems } = useBOMsStore();
  const { routings, routingSteps } = useRoutingsStore();
  const { materials } = useMaterialsStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState<"all" | "계획" | "진행중" | "완료" | "취소">("all");
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    orderCode: "",
    orderDate: new Date().toISOString().split("T")[0],
    planCode: "",
    productCode: "",
    productName: "",
    orderQuantity: 0,
    unit: "EA",
    line: "조립라인 A", // Default line value
    startDate: "",
    endDate: "",
    status: "대기" as "대기" | "진행중" | "완료" | "보류",
    worker: "",
    note: ""
  });
  
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);

  // Auto-update plan status when work orders change
  useEffect(() => {
    productionPlans.forEach(plan => {
      const planOrders = workOrders.filter(order => order.planCode === plan.planCode);
      const totalOrderQty = planOrders.reduce((sum, order) => sum + order.orderQuantity, 0);
      const orderCount = planOrders.length;
      
      checkAndUpdatePlanStatus(plan, totalOrderQty, orderCount, updateProductionPlan);
    });
  }, [workOrders, productionPlans, updateProductionPlan]);

  // Get active options
  const activeProducts = products.filter(p => p.status === "active");
  const activeLines = lines.filter(l => l.status === "active");
  const activePlans = productionPlans.filter(p => p.status === "계획" || p.status === "진행중");

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    if (currentUser.role === '시스템관리자' || currentUser.role === '관리자' || currentUser.role === 'admin') {
      return ['ALL'];
    }
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    if (!currentUser) return false;
    if (currentUser.role === '시스템관리자' || currentUser.role === '관리자' || currentUser.role === 'admin') {
      return true;
    }
    const permissions = getUserPermissions();
    return permissions.includes("WORK_ORDER_EDIT") || permissions.includes('ALL');
  };

  // Filter plans: exclude plans with end date before today
  const today = new Date().toISOString().split("T")[0];
  const filteredPlans = productionPlans.filter(plan => {
    // Get customer for the product
    const product = products.find(p => p.code === plan.productCode);
    const customerName = product?.customer || "";
    
    const matchesSearch = 
      (plan.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = planStatusFilter === "all" || plan.status === planStatusFilter;
    const notExpired = plan.endDate >= today; // Exclude plans with end date before today
    
    return matchesSearch && matchesStatus && notExpired;
  });

  const filteredOrders = workOrders.filter(order => {
    // Only show orders for the selected plan
    if (selectedPlan && order.planCode !== selectedPlan.planCode) {
      return false;
    }
    
    // Get customer for the product
    const product = products.find(p => p.code === order.productCode);
    const customerName = product?.customer || "";
    
    const matchesSearch = 
      (order.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get routing steps and BOM items for selected order (not plan)
  const selectedOrderBOM = selectedOrder ? boms.find(b => b.productCode === selectedOrder.productCode) : null;
  const selectedRoutingSteps = selectedOrderBOM ? routingSteps.filter(rs => rs.routingId === selectedOrderBOM.routingId) : [];
  const selectedBOMItems = selectedOrderBOM ? bomItems.filter(bi => bi.bomId === selectedOrderBOM.id) : [];

  const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planCode = e.target.value;
    const plan = activePlans.find(p => p.planCode === planCode);
    if (plan) {
      setNewOrder({
        ...newOrder,
        planCode: plan.planCode,
        productCode: plan.productCode,
        productName: plan.productName,
        unit: plan.unit,
        startDate: plan.startDate,
        endDate: plan.endDate
      });
    }
  };

  const handlePlanSelectEdit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editingOrder) return;
    const planCode = e.target.value;
    const plan = productionPlans.find(p => p.planCode === planCode);
    if (plan) {
      setEditingOrder({
        ...editingOrder,
        planCode: plan.planCode,
        productCode: plan.productCode,
        productName: plan.productName,
        unit: plan.unit,
        startDate: plan.startDate,
        endDate: plan.endDate
      });
    }
  };

  const generateOrderCode = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const orderCount = workOrders.filter(w => w.orderDate.startsWith(`${year}-${month}`)).length + 1;
    return `WO-${year}-${String(orderCount).padStart(3, '0')}`;
  };

  const handleAddOrderFromPlan = () => {
    if (!selectedPlan) {
      alert("작업지시를 생성할 생산계획을 먼저 선택해주세요.");
      return;
    }

    // Check if plan is completed or cancelled
    if (selectedPlan.status === "완료" || selectedPlan.status === "취소") {
      alert("완료되었거나 취소된 생산계획에 대해서는 작업지시를 생성할 수 없습니다.");
      return;
    }

    // Pre-fill modal with selected plan data
    setNewOrder({
      orderCode: "",
      orderDate: new Date().toISOString().split("T")[0],
      planCode: selectedPlan.planCode,
      productCode: selectedPlan.productCode,
      productName: selectedPlan.productName,
      orderQuantity: selectedPlan.planQuantity,
      unit: selectedPlan.unit,
      line: "조립라인 A", // Default line value
      startDate: selectedPlan.startDate,
      endDate: selectedPlan.endDate,
      status: "대기",
      worker: "",
      note: ""
    });
    setShowAddModal(true);
  };

  const handleAddOrder = () => {
    if (!newOrder.planCode || !newOrder.orderQuantity) {
      alert("생산계획, 지시수량은 필수 입력 항목입니다.");
      return;
    }
    
    const orderCode = generateOrderCode();
    addWorkOrder({
      ...newOrder,
      orderCode
    });
    
    // Update plan status after adding work order
    setTimeout(() => {
      const plan = productionPlans.find(p => p.planCode === newOrder.planCode);
      if (plan) {
        const planOrders = workOrders.filter(order => order.planCode === plan.planCode);
        const totalOrderQty = planOrders.reduce((sum, order) => sum + order.orderQuantity, 0) + newOrder.orderQuantity;
        const orderCount = planOrders.length + 1;
        checkAndUpdatePlanStatus(plan, totalOrderQty, orderCount, updateProductionPlan);
      }
    }, 0);
    
    setNewOrder({
      orderCode: "",
      orderDate: new Date().toISOString().split("T")[0],
      planCode: "",
      productCode: "",
      productName: "",
      orderQuantity: 0,
      unit: "EA",
      line: "조립라인 A",
      startDate: "",
      endDate: "",
      status: "대기",
      worker: "",
      note: ""
    });
    setShowAddModal(false);
  };

  const handleUpdateOrder = () => {
    if (!editingOrder) return;
    if (!editingOrder.planCode || !editingOrder.orderQuantity) {
      alert("생산계획, 지시수량은 필수 입력 항목입니다.");
      return;
    }
    updateWorkOrder(editingOrder.id, () => editingOrder);
    
    // Update plan status after updating work order
    setTimeout(() => {
      const plan = productionPlans.find(p => p.planCode === editingOrder.planCode);
      if (plan) {
        const planOrders = workOrders.filter(order => order.planCode === plan.planCode);
        const totalOrderQty = planOrders.reduce((sum, order) => sum + order.orderQuantity, 0);
        const orderCount = planOrders.length;
        checkAndUpdatePlanStatus(plan, totalOrderQty, orderCount, updateProductionPlan);
      }
    }, 0);
    
    setShowEditModal(false);
    setEditingOrder(null);
    setSelectedOrder(editingOrder);
  };

  const handleDeleteOrder = () => {
    if (!selectedOrder) {
      alert("삭제할 작업지시를 선택해주세요.");
      return;
    }
    if (confirm(`${selectedOrder.orderCode} 작업지시를 삭제하시겠습니까?`)) {
      const planCode = selectedOrder.planCode;
      deleteWorkOrder(selectedOrder.id);
      
      // Update plan status after deleting work order
      setTimeout(() => {
        const plan = productionPlans.find(p => p.planCode === planCode);
        if (plan) {
          const planOrders = workOrders.filter(order => order.planCode === plan.planCode && order.id !== selectedOrder.id);
          const totalOrderQty = planOrders.reduce((sum, order) => sum + order.orderQuantity, 0);
          const orderCount = planOrders.length;
          checkAndUpdatePlanStatus(plan, totalOrderQty, orderCount, updateProductionPlan);
        }
      }, 0);
      
      setSelectedOrder(null);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredOrders.map(order => ({
      "지시코드": order.orderCode,
      "지시일": order.orderDate,
      "계획코드": order.planCode,
      "제품코드": order.productCode,
      "제품명": order.productName,
      "지시수량": order.orderQuantity,
      "단위": order.unit,
      "생산라인": order.line,
      "시작일": order.startDate,
      "종료일": order.endDate,
      "상태": order.status,
      "작업자": order.worker,
      "비고": order.note,
      "생성일": order.createdAt,
      "수정일": order.modifiedAt || "-"
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "작업지시");
    XLSX.writeFile(workbook, "작업지시.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">작업지시 관리</h1>
            <p className="text-sm text-gray-600 mt-1">생산 작업지시를 생성하고 관리합니다.</p>
          </div>
          {hasEditPermission() && (
            <div className="flex gap-2">
              <button
                onClick={handleAddOrderFromPlan}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedPlan}
                title={!selectedPlan ? "생산계획을 먼저 선택해주세요" : "선택된 계획으로 작업지시 생성"}
              >
                ➕ 지시추가
              </button>
              <button
                onClick={() => {
                  if (selectedOrder) {
                    setEditingOrder(selectedOrder);
                    setShowEditModal(true);
                  } else {
                    alert("수정할 작업지시를 선택해주세요.");
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedOrder}
              >
                ✏️ 지시수정
              </button>
              <button
                onClick={handleDeleteOrder}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-32 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedOrder}
              >
                🗑️ 지시삭제
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-32"
              >
                📊 엑셀출력
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="제품명, 거래처로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={planStatusFilter}
            onChange={(e) => setPlanStatusFilter(e.target.value as typeof planStatusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 계획상태</option>
            <option value="계획">계획</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
            <option value="취소">취소</option>
          </select>
        </div>
      </div>

      {/* 4-Section Layout */}
      <div className="grid gap-4" style={{ height: 'calc(100vh - 280px)', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr' }}>
        {/* Top Left: Production Plans */}
        <div className="bg-white rounded-lg border border-black/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-base font-semibold">생산계획 목록</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">계획코드</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">제품명</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">거래처</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">계획수량</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">지시수량</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">미지시수량</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">시작일</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">종료일</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-gray-500 text-sm">
                      등록된 생산계획이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => {
                    // Calculate total order quantity for this plan
                    const totalOrderQty = workOrders
                      .filter(order => order.planCode === plan.planCode)
                      .reduce((sum, order) => sum + order.orderQuantity, 0);
                    
                    // Calculate remaining quantity (not yet ordered)
                    const remainingQty = plan.planQuantity - totalOrderQty;
                    
                    // Get customer for the product
                    const product = products.find(p => p.code === plan.productCode);
                    const customerName = product?.customer || "-";
                    
                    return (
                      <tr
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedPlan?.id === plan.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-xs">{plan.planCode}</td>
                        <td className="px-3 py-2 text-xs font-medium">{plan.productName}</td>
                        <td className="px-3 py-2 text-xs">{customerName}</td>
                        <td className="px-3 py-2 text-xs text-right">{plan.planQuantity.toLocaleString()} {plan.unit}</td>
                        <td className="px-3 py-2 text-xs text-right">{totalOrderQty.toLocaleString()} {plan.unit}</td>
                        <td className="px-3 py-2 text-xs text-right">
                          <span className={remainingQty > 0 ? "text-orange-600 font-medium" : "text-gray-500"}>
                            {remainingQty.toLocaleString()} {plan.unit}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{plan.startDate}</td>
                        <td className="px-3 py-2 text-xs">{plan.endDate}</td>
                        <td className="px-3 py-2 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              plan.status === "계획"
                                ? "bg-blue-100 text-blue-700"
                                : plan.status === "진행중"
                                ? "bg-orange-100 text-orange-700"
                                : plan.status === "완료"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {plan.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Right: Routing Steps */}
        <div className="bg-white rounded-lg border border-black/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-base font-semibold">공정 라우팅 리스트</h2>
          </div>
          <div className="flex-1 overflow-auto">
            {selectedOrder ? (
              selectedOrderBOM ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">순서</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">라인</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">공정</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">주설비</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">지시수량</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">표준공수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedRoutingSteps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-500 text-sm">
                          라우팅 정보가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      selectedRoutingSteps.map((step) => (
                        <tr key={step.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs">{step.sequence}</td>
                          <td className="px-3 py-2 text-xs">{step.line}</td>
                          <td className="px-3 py-2 text-xs font-medium">{step.process}</td>
                          <td className="px-3 py-2 text-xs">{step.mainEquipment}</td>
                          <td className="px-3 py-2 text-xs text-right">{selectedOrder.orderQuantity ? selectedOrder.orderQuantity.toLocaleString() : '0'} {selectedOrder.unit}</td>
                          <td className="px-3 py-2 text-xs text-right">{step.standardManHours}h</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  선택된 제품의 BOM 정보가 없습니다.
                </div>
              )
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                작업지시를 선택하면 공정 라우팅이 표시됩니다.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Left: Work Orders */}
        <div className="bg-white rounded-lg border border-black/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-base font-semibold">작업지시 목록</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">지시코드</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">제품명</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">지시수량</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">실적수량</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">시작일</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">종료일</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!selectedPlan ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-sm">
                      생산계획을 선택하면 해당 작업지시 목록이 표시됩니다.
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-sm">
                      선택된 생산계획에 대한 작업지시가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    // TODO: Calculate actual result quantity from production results
                    const resultQuantity = 0; // Placeholder for actual production result
                    
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedOrder?.id === order.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-xs">{order.orderCode}</td>
                        <td className="px-3 py-2 text-xs font-medium">{order.productName}</td>
                        <td className="px-3 py-2 text-xs text-right">{order.orderQuantity ? order.orderQuantity.toLocaleString() : '0'} {order.unit}</td>
                        <td className="px-3 py-2 text-xs text-right">
                          <span className={resultQuantity > 0 ? "text-green-600 font-medium" : "text-gray-400"}>
                            {resultQuantity.toLocaleString()} {order.unit}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{order.startDate}</td>
                        <td className="px-3 py-2 text-xs">{order.endDate}</td>
                        <td className="px-3 py-2 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              order.status === "대기"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "진행중"
                                ? "bg-orange-100 text-orange-700"
                                : order.status === "완료"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Right: BOM Items */}
        <div className="bg-white rounded-lg border border-black/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-base font-semibold">공정별 투입자재 리스트</h2>
          </div>
          <div className="flex-1 overflow-auto">
            {selectedOrder ? (
              selectedOrderBOM ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">공정순서</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">공정명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">자재코드</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">자재명</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">투입량</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">손실율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedBOMItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-500 text-sm">
                          자재 정보가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      selectedBOMItems.map((item) => {
                        // Calculate input quantity: order quantity * required quantity
                        const inputQuantity = selectedOrder.orderQuantity * item.quantity;
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs">{item.processSequence}</td>
                            <td className="px-3 py-2 text-xs">{item.processName}</td>
                            <td className="px-3 py-2 text-xs">{item.materialCode}</td>
                            <td className="px-3 py-2 text-xs font-medium">{item.materialName}</td>
                            <td className="px-3 py-2 text-xs text-right">{inputQuantity.toLocaleString()} {item.unit}</td>
                            <td className="px-3 py-2 text-xs text-right">{item.lossRate}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  선택된 제품의 BOM 정보가 없습니다.
                </div>
              )
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                작업지시를 선택하면 투입자재 리스트가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 작업지시 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시코드</label>
                  <input
                    type="text"
                    value="자동 생성됩니다"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시일</label>
                  <input
                    type="date"
                    value={newOrder.orderDate}
                    onChange={(e) => setNewOrder({ ...newOrder, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생산계획 선택 *</label>
                  <select
                    value={newOrder.planCode}
                    onChange={handlePlanSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">생산계획 선택</option>
                    {activePlans.map(plan => (
                      <option key={plan.id} value={plan.planCode}>
                        {plan.planCode} - {plan.productName} ({plan.planQuantity} {plan.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명</label>
                  <input
                    type="text"
                    value={newOrder.productName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시수량 *</label>
                  <input
                    type="number"
                    value={newOrder.orderQuantity}
                    onChange={(e) => setNewOrder({ ...newOrder, orderQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={newOrder.startDate}
                    onChange={(e) => setNewOrder({ ...newOrder, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={newOrder.endDate}
                    onChange={(e) => setNewOrder({ ...newOrder, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value as WorkOrder["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="대기">대기</option>
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                    <option value="보류">보류</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업자</label>
                  <input
                    type="text"
                    value={newOrder.worker}
                    onChange={(e) => setNewOrder({ ...newOrder, worker: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 작업자1팀"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={newOrder.note}
                    onChange={(e) => setNewOrder({ ...newOrder, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="비고사항을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddOrder}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">작업지시 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시코드</label>
                  <input
                    type="text"
                    value={editingOrder.orderCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시일</label>
                  <input
                    type="date"
                    value={editingOrder.orderDate}
                    onChange={(e) => setEditingOrder({ ...editingOrder, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생산계획 선택 *</label>
                  <select
                    value={editingOrder.planCode}
                    onChange={handlePlanSelectEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">생산계획 선택</option>
                    {productionPlans.map(plan => (
                      <option key={plan.id} value={plan.planCode}>
                        {plan.planCode} - {plan.productName} ({plan.planQuantity} {plan.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명</label>
                  <input
                    type="text"
                    value={editingOrder.productName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지시수량 *</label>
                  <input
                    type="number"
                    value={editingOrder.orderQuantity}
                    onChange={(e) => setEditingOrder({ ...editingOrder, orderQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={editingOrder.startDate}
                    onChange={(e) => setEditingOrder({ ...editingOrder, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={editingOrder.endDate}
                    onChange={(e) => setEditingOrder({ ...editingOrder, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as WorkOrder["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="대기">대기</option>
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                    <option value="보류">보류</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업자</label>
                  <input
                    type="text"
                    value={editingOrder.worker}
                    onChange={(e) => setEditingOrder({ ...editingOrder, worker: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 작업자1팀"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={editingOrder.note}
                    onChange={(e) => setEditingOrder({ ...editingOrder, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="비고사항을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateOrder}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


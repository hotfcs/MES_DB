"use client";

import { useState } from "react";
import { useProductionPlansStore, type ProductionPlan, useProductsStore, type Product } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function ProductionPlanPage() {
  const { productionPlans, addProductionPlan, updateProductionPlan, deleteProductionPlan } = useProductionPlansStore();
  const { products } = useProductsStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "계획" | "진행중" | "완료" | "취소">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newPlan, setNewPlan] = useState({
    planCode: "",
    planDate: new Date().toISOString().split("T")[0],
    productCode: "",
    productName: "",
    planQuantity: 0,
    unit: "EA",
    startDate: "",
    endDate: "",
    status: "계획" as "계획" | "진행중" | "완료" | "취소",
    manager: "",
    note: ""
  });
  
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);

  // Get active options
  const activeProducts = products.filter((p: Product) => p.status === "active");

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
    return permissions.includes("PRODUCTION_PLAN_EDIT") || permissions.includes('ALL');
  };

  const filteredPlans = productionPlans.filter(plan => {
    // Get customer for the product
    const product = products.find((p: Product) => p.code === plan.productCode);
    const customerName = product?.customer || "";
    
    const matchesSearch = 
      (plan.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    const matchesDate = !dateFilter || plan.planDate === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productCode = e.target.value;
    const product = activeProducts.find((p: Product) => p.code === productCode);
    if (product) {
      setNewPlan({
        ...newPlan,
        productCode: product.code,
        productName: product.name,
        unit: product.unit
      });
    }
  };

  const handleProductSelectEdit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editingPlan) return;
    const productCode = e.target.value;
    const product = activeProducts.find((p: Product) => p.code === productCode);
    if (product) {
      setEditingPlan({
        ...editingPlan,
        productCode: product.code,
        productName: product.name,
        unit: product.unit
      });
    }
  };

  const generatePlanCode = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const planCount = productionPlans.filter(p => p.planDate.startsWith(`${year}-${month}`)).length + 1;
    return `PLAN-${year}-${String(planCount).padStart(3, '0')}`;
  };

  const handleAddPlan = () => {
    if (!newPlan.productCode || !newPlan.startDate || !newPlan.endDate) {
      alert("제품, 시작일, 종료일은 필수 입력 항목입니다.");
      return;
    }
    
    const planCode = generatePlanCode();
    addProductionPlan({
      ...newPlan,
      planCode
    });
    
    setNewPlan({
      planCode: "",
      planDate: new Date().toISOString().split("T")[0],
      productCode: "",
      productName: "",
      planQuantity: 0,
      unit: "EA",
      startDate: "",
      endDate: "",
      status: "계획",
      manager: "",
      note: ""
    });
    setShowAddModal(false);
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;
    if (!editingPlan.productCode || !editingPlan.startDate || !editingPlan.endDate) {
      alert("제품, 시작일, 종료일은 필수 입력 항목입니다.");
      return;
    }
    updateProductionPlan(editingPlan);
    setShowEditModal(false);
    setEditingPlan(null);
    setSelectedPlan(editingPlan);
  };

  const handleDeletePlan = () => {
    if (!selectedPlan) {
      alert("삭제할 생산계획을 선택해주세요.");
      return;
    }
    if (confirm(`${selectedPlan.planCode} 생산계획을 삭제하시겠습니까?`)) {
      deleteProductionPlan(selectedPlan.id);
      setSelectedPlan(null);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredPlans.map(plan => {
      const product = products.find((p: Product) => p.code === plan.productCode);
      const customerName = product?.customer || "-";
      
      return {
        "계획코드": plan.planCode,
        "계획일": plan.planDate,
        "제품코드": plan.productCode,
        "제품명": plan.productName,
        "거래처": customerName,
        "계획수량": plan.planQuantity,
        "단위": plan.unit,
        "시작일": plan.startDate,
        "종료일": plan.endDate,
        "상태": plan.status,
        "담당자": plan.manager,
        "비고": plan.note,
        "생성일": plan.createdAt,
        "수정일": plan.modifiedAt || "-"
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "생산계획");
    XLSX.writeFile(workbook, "생산계획.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">생산계획 관리</h1>
            <p className="text-sm text-gray-600 mt-1">제품 생산 계획을 수립하고 관리합니다.</p>
          </div>
          {hasEditPermission() && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32"
              >
                ➕ 계획추가
              </button>
              <button
                onClick={() => {
                  if (selectedPlan) {
                    setEditingPlan(selectedPlan);
                    setShowEditModal(true);
                  } else {
                    alert("수정할 생산계획을 선택해주세요.");
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
                disabled={!selectedPlan}
              >
                ✏️ 계획수정
              </button>
              <button
                onClick={handleDeletePlan}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-32"
                disabled={!selectedPlan}
              >
                🗑️ 계획삭제
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="제품명, 거래처로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="계획">계획</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
            <option value="취소">취소</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="계획일 선택"
          />
        </div>
      </div>

      {/* Main Grid and Detail Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">계획코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">계획일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제품명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">거래처</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">계획수량</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      등록된 생산계획이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => {
                    // Get customer for the product
                    const product = products.find((p: Product) => p.code === plan.productCode);
                    const customerName = product?.customer || "-";
                    
                    return (
                      <tr
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedPlan?.id === plan.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm">{plan.planCode}</td>
                        <td className="px-4 py-3 text-sm">{plan.planDate}</td>
                        <td className="px-4 py-3 text-sm font-medium">{plan.productName}</td>
                        <td className="px-4 py-3 text-sm">{customerName}</td>
                        <td className="px-4 py-3 text-sm text-right">{plan.planQuantity ? plan.planQuantity.toLocaleString() : '0'} {plan.unit}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
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

        {/* Plan Detail Info */}
        <div className="bg-white rounded-lg border border-black/10 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <h2 className="text-lg font-semibold mb-4">생산계획 세부사항</h2>
          {selectedPlan ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">계획코드</label>
                <p className="text-sm mt-1">{selectedPlan.planCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">계획일</label>
                <p className="text-sm mt-1">{selectedPlan.planDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">상태</label>
                <p className="text-sm mt-1">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedPlan.status === "계획"
                        ? "bg-blue-100 text-blue-700"
                        : selectedPlan.status === "진행중"
                        ? "bg-orange-100 text-orange-700"
                        : selectedPlan.status === "완료"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedPlan.status}
                  </span>
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">제품명</label>
                <p className="text-sm mt-1">{selectedPlan.productName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">제품코드</label>
                <p className="text-sm mt-1">{selectedPlan.productCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">거래처</label>
                <p className="text-sm mt-1">{products.find((p: Product) => p.code === selectedPlan.productCode)?.customer || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">계획수량</label>
                <p className="text-sm mt-1">{selectedPlan.planQuantity ? selectedPlan.planQuantity.toLocaleString() : '0'} {selectedPlan.unit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">시작일</label>
                <p className="text-sm mt-1">{selectedPlan.startDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">종료일</label>
                <p className="text-sm mt-1">{selectedPlan.endDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">담당자</label>
                <p className="text-sm mt-1">{selectedPlan.manager}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">비고</label>
                <p className="text-sm mt-1">{selectedPlan.note || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">생성일</label>
                <p className="text-sm mt-1">{selectedPlan.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수정일</label>
                <p className="text-sm mt-1">{selectedPlan.modifiedAt || "-"}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              생산계획을 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 생산계획 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획코드</label>
                  <input
                    type="text"
                    value="자동 생성됩니다"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획일</label>
                  <input
                    type="date"
                    value={newPlan.planDate}
                    onChange={(e) => setNewPlan({ ...newPlan, planDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 선택 *</label>
                  <select
                    value={newPlan.productCode}
                    onChange={handleProductSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">제품 선택</option>
                    {activeProducts.map((product: Product) => (
                      <option key={product.id} value={product.code}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획수량 *</label>
                  <input
                    type="number"
                    value={newPlan.planQuantity}
                    onChange={(e) => setNewPlan({ ...newPlan, planQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                  <input
                    type="date"
                    value={newPlan.startDate}
                    onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
                  <input
                    type="date"
                    value={newPlan.endDate}
                    onChange={(e) => setNewPlan({ ...newPlan, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={newPlan.status}
                    onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value as ProductionPlan["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="계획">계획</option>
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                    <option value="취소">취소</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={newPlan.manager}
                    onChange={(e) => setNewPlan({ ...newPlan, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김철수"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={newPlan.note}
                    onChange={(e) => setNewPlan({ ...newPlan, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="비고사항을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddPlan}
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
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">생산계획 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획코드</label>
                  <input
                    type="text"
                    value={editingPlan.planCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획일</label>
                  <input
                    type="date"
                    value={editingPlan.planDate}
                    onChange={(e) => setEditingPlan({ ...editingPlan, planDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 선택 *</label>
                  <select
                    value={editingPlan.productCode}
                    onChange={handleProductSelectEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">제품 선택</option>
                    {activeProducts.map((product: Product) => (
                      <option key={product.id} value={product.code}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계획수량 *</label>
                  <input
                    type="number"
                    value={editingPlan.planQuantity}
                    onChange={(e) => setEditingPlan({ ...editingPlan, planQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                  <input
                    type="date"
                    value={editingPlan.startDate}
                    onChange={(e) => setEditingPlan({ ...editingPlan, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
                  <input
                    type="date"
                    value={editingPlan.endDate}
                    onChange={(e) => setEditingPlan({ ...editingPlan, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={editingPlan.status}
                    onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as ProductionPlan["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="계획">계획</option>
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                    <option value="취소">취소</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={editingPlan.manager}
                    onChange={(e) => setEditingPlan({ ...editingPlan, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김철수"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea
                    value={editingPlan.note}
                    onChange={(e) => setEditingPlan({ ...editingPlan, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="비고사항을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdatePlan}
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


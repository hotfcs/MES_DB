"use client";

import { useState } from "react";
import { useWarehousesStore, type Warehouse } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function WarehousesPage() {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = useWarehousesStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "원자재창고" | "제품창고" | "자재창고" | "공정창고">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    code: "",
    name: "",
    type: "원자재창고" as "원자재창고" | "제품창고" | "자재창고" | "공정창고",
    location: "",
    capacity: 0,
    manager: "",
    description: "",
    status: "active" as const
  });
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("WAREHOUSES_EDIT");
  };

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = 
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || warehouse.type === typeFilter;
    const matchesStatus = statusFilter === "all" || warehouse.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddWarehouse = () => {
    if (!newWarehouse.code || !newWarehouse.name) {
      alert("창고코드와 창고명은 필수 입력 항목입니다.");
      return;
    }
    addWarehouse(newWarehouse);
    setNewWarehouse({
      code: "",
      name: "",
      type: "원자재창고",
      location: "",
      capacity: 0,
      manager: "",
      description: "",
      status: "active" as const
    });
    setShowAddModal(false);
  };

  const handleUpdateWarehouse = () => {
    if (!editingWarehouse) return;
    if (!editingWarehouse.code || !editingWarehouse.name) {
      alert("창고코드와 창고명은 필수 입력 항목입니다.");
      return;
    }
    updateWarehouse(editingWarehouse.id, editingWarehouse);
    setShowEditModal(false);
    setEditingWarehouse(null);
    setSelectedWarehouse(editingWarehouse);
  };

  const handleDeleteWarehouse = () => {
    if (!selectedWarehouse) {
      alert("삭제할 창고를 선택해주세요.");
      return;
    }
    if (confirm(`${selectedWarehouse.name} 창고를 삭제하시겠습니까?`)) {
      deleteWarehouse(selectedWarehouse.id);
      setSelectedWarehouse(null);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredWarehouses.map(warehouse => ({
      "창고코드": warehouse.code,
      "창고명": warehouse.name,
      "창고유형": warehouse.type,
      "위치": warehouse.location,
      "보관용량(㎡)": warehouse.capacity,
      "담당자": warehouse.manager,
      "설명": warehouse.description,
      "사용유무": warehouse.status === "active" ? "사용" : "미사용",
      "생성일": warehouse.createdAt,
      "수정일": warehouse.modifiedAt || "-"
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "창고정보");
    XLSX.writeFile(workbook, "창고정보.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">창고정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">
              창고 정보를 관리합니다. (총 {filteredWarehouses.length}건)
            </p>
          </div>
          {hasEditPermission() && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32"
              >
                ➕ 추가
              </button>
              <button
                onClick={() => {
                  if (selectedWarehouse) {
                    setEditingWarehouse(selectedWarehouse);
                    setShowEditModal(true);
                  } else {
                    alert("수정할 창고를 선택해주세요.");
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 w-32"
                disabled={!selectedWarehouse}
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteWarehouse}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 w-32"
                disabled={!selectedWarehouse}
              >
                🗑️ 삭제
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

      {/* 검색 및 필터 */}
    <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="창고명, 코드, 위치, 담당자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 유형</option>
            <option value="원자재창고">원자재창고</option>
            <option value="제품창고">제품창고</option>
            <option value="자재창고">자재창고</option>
            <option value="공정창고">공정창고</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="active">사용</option>
            <option value="inactive">미사용</option>
          </select>
        </div>
      </div>

      {/* 메인 그리드 및 세부 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 창고 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">창고코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">창고명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">창고유형</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">위치</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">보관용량(㎡)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      등록된 창고가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      onClick={() => setSelectedWarehouse(warehouse)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedWarehouse?.id === warehouse.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{warehouse.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{warehouse.name}</td>
                      <td className="px-4 py-3 text-sm">{warehouse.type}</td>
                      <td className="px-4 py-3 text-sm">{warehouse.location}</td>
                      <td className="px-4 py-3 text-sm text-right">{warehouse.capacity ? warehouse.capacity.toLocaleString() : '0'}</td>
                      <td className="px-4 py-3 text-sm">{warehouse.manager}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            warehouse.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {warehouse.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 창고 세부 정보 */}
        <div className="bg-white rounded-lg border border-black/10 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <h2 className="text-lg font-semibold mb-4">창고 세부사항</h2>
          {selectedWarehouse ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">창고코드</label>
                <p className="text-sm mt-1">{selectedWarehouse.code}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">창고명</label>
                <p className="text-sm mt-1">{selectedWarehouse.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">창고유형</label>
                <p className="text-sm mt-1">{selectedWarehouse.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">사용유무</label>
                <p className="text-sm mt-1">
                  {selectedWarehouse.status === "active" ? "사용" : "미사용"}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">위치</label>
                <p className="text-sm mt-1">{selectedWarehouse.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">보관용량(㎡)</label>
                <p className="text-sm mt-1">{selectedWarehouse.capacity ? selectedWarehouse.capacity.toLocaleString() : '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">담당자</label>
                <p className="text-sm mt-1">{selectedWarehouse.manager}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">설명</label>
                <p className="text-sm mt-1">{selectedWarehouse.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">생성일</label>
                <p className="text-sm mt-1">{selectedWarehouse.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수정일</label>
                <p className="text-sm mt-1">{selectedWarehouse.modifiedAt || "-"}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              창고를 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 창고 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">창고코드 *</label>
                  <input
                    type="text"
                    value={newWarehouse.code}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: WH001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">창고명 *</label>
                  <input
                    type="text"
                    value={newWarehouse.name}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 원자재 1창고"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">창고유형</label>
                  <select
                    value={newWarehouse.type}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, type: e.target.value as Warehouse["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="원자재창고">원자재창고</option>
                    <option value="제품창고">제품창고</option>
                    <option value="자재창고">자재창고</option>
                    <option value="공정창고">공정창고</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    value={newWarehouse.location}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 1공장 A동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">보관용량(㎡)</label>
                  <input
                    type="number"
                    value={newWarehouse.capacity}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={newWarehouse.manager}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김영수"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newWarehouse.description}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="창고 설명을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddWarehouse}
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

      {/* 수정 모달 */}
      {showEditModal && editingWarehouse && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">창고 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">창고코드 *</label>
                  <input
                    type="text"
                    value={editingWarehouse.code}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">창고명 *</label>
                  <input
                    type="text"
                    value={editingWarehouse.name}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">창고유형</label>
                  <select
                    value={editingWarehouse.type}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, type: e.target.value as Warehouse["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="원자재창고">원자재창고</option>
                    <option value="제품창고">제품창고</option>
                    <option value="자재창고">자재창고</option>
                    <option value="공정창고">공정창고</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    value={editingWarehouse.location}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">보관용량(㎡)</label>
                  <input
                    type="number"
                    value={editingWarehouse.capacity}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={editingWarehouse.manager}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingWarehouse.description}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                  <select
                    value={editingWarehouse.status}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, status: e.target.value as Warehouse["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">사용</option>
                    <option value="inactive">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateWarehouse}
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

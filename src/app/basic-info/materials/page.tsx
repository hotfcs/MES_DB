"use client";

import { useState } from "react";
import { useMaterialsStore, type Material, useCustomersStore } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function MaterialsPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterialsStore();
  const { customers } = useCustomersStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  // 공급업체만 필터링
  const suppliers = customers.filter(c => c.type === "공급업체" && c.status === "active");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "원자재" | "부자재">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [newMaterial, setNewMaterial] = useState<{
    code: string;
    name: string;
    category: Material["category"];
    specification: string;
    unit: string;
    purchasePrice: number;
    supplier: string;
    description: string;
    image: string;
  }>({
    code: "",
    name: "",
    category: "원자재",
    specification: "",
    unit: "KG",
    purchasePrice: 0,
    supplier: "",
    description: "",
    image: ""
  });

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("MATERIALS_EDIT");
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || material.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddMaterial = () => {
    addMaterial(newMaterial);
    setShowAddModal(false);
    setNewMaterial({
      code: "",
      name: "",
      category: "원자재",
      specification: "",
      unit: "KG",
      purchasePrice: 0,
      supplier: "",
      description: "",
      image: ""
    });
  };

  const handleUpdateMaterial = () => {
    if (!editingMaterial) return;
    updateMaterial(editingMaterial.id, () => editingMaterial);
    setShowEditModal(false);
    setEditingMaterial(null);
    if (selectedMaterial?.id === editingMaterial.id) {
      setSelectedMaterial(editingMaterial);
    }
  };

  const handleDeleteMaterial = () => {
    if (!selectedMaterial) return;
    if (confirm(`"${selectedMaterial.name}" 자재를 삭제하시겠습니까?`)) {
      deleteMaterial(selectedMaterial.id);
      setSelectedMaterial(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["자재코드", "자재명", "품목구분", "규격", "단위", "구매단가", "공급업체", "설명", "사용유무", "생성일"],
      ...filteredMaterials.map(material => [
        material.code,
        material.name,
        material.category,
        material.specification,
        material.unit,
        material.purchasePrice,
        material.supplier,
        material.description,
        material.status === "active" ? "사용" : "미사용",
        material.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "자재정보");
    XLSX.writeFile(workbook, `자재정보_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">자재정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">자재 정보를 관리합니다.</p>
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
                  if (!selectedMaterial) {
                    alert("수정할 자재를 선택해주세요.");
                    return;
                  }
                  setEditingMaterial({ ...selectedMaterial });
                  setShowEditModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteMaterial}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-32"
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
            placeholder="자재명, 코드, 규격, 공급업체로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 품목구분</option>
            <option value="원자재">원자재</option>
            <option value="부자재">부자재</option>
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

      {/* 메인 그리드와 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 자재 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">자재코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">자재명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">품목구분</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">규격</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">단위</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">공급업체</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">구매단가</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      등록된 자재가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((material) => (
                    <tr
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMaterial?.id === material.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{material.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{material.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          material.category === "원자재" ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {material.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{material.specification}</td>
                      <td className="px-4 py-3 text-sm">{material.unit}</td>
                      <td className="px-4 py-3 text-sm">{material.supplier}</td>
                      <td className="px-4 py-3 text-sm text-right">{material.purchasePrice ? material.purchasePrice.toLocaleString() : '0'}원</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            material.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {material.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 자재 세부정보 */}
        <div className="bg-white rounded-lg border border-black/10 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <h2 className="text-lg font-semibold mb-4">자재 세부사항</h2>
          {selectedMaterial ? (
            <div className="space-y-4">
              {/* 자재 이미지 */}
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {selectedMaterial.image ? (
                  <img
                    src={selectedMaterial.image}
                    alt={selectedMaterial.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">이미지 로드 실패</text></svg>';
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm">이미지 없음</div>
                )}
              </div>
              
              {/* 자재 정보 2열 */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">자재코드</label>
                  <p className="text-sm mt-1">{selectedMaterial.code}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">자재명</label>
                  <p className="text-sm mt-1">{selectedMaterial.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">품목구분</label>
                  <p className="text-sm mt-1">{selectedMaterial.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">단위</label>
                  <p className="text-sm mt-1">{selectedMaterial.unit}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">규격</label>
                  <p className="text-sm mt-1">{selectedMaterial.specification}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">구매단가</label>
                  <p className="text-sm mt-1">{selectedMaterial.purchasePrice ? selectedMaterial.purchasePrice.toLocaleString() : '0'}원</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">공급업체</label>
                  <p className="text-sm mt-1">{selectedMaterial.supplier}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">설명</label>
                  <p className="text-sm mt-1">{selectedMaterial.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">사용유무</label>
                  <p className="text-sm mt-1">
                    {selectedMaterial.status === "active" ? "사용" : "미사용"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">생성일</label>
                  <p className="text-sm mt-1">{selectedMaterial.createdAt}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">수정일</label>
                  <p className="text-sm mt-1">{selectedMaterial.modifiedAt || "-"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              자재를 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 자재 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자재코드 *</label>
                  <input
                    type="text"
                    value={newMaterial.code}
                    onChange={(e) => setNewMaterial({ ...newMaterial, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: MAT001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자재명 *</label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 알루미늄 판재"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품목구분</label>
                  <select
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as Material["category"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="원자재">원자재</option>
                    <option value="부자재">부자재</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">규격</label>
                  <input
                    type="text"
                    value={newMaterial.specification}
                    onChange={(e) => setNewMaterial({ ...newMaterial, specification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 1000x500x2mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                  <input
                    type="text"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: KG, EA, M"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">구매단가</label>
                  <input
                    type="number"
                    value={newMaterial.purchasePrice}
                    onChange={(e) => setNewMaterial({ ...newMaterial, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 8500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공급업체</label>
                  <select
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">공급업체 선택</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="자재 설명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자재 이미지</label>
                  {newMaterial.image && (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img
                          src={newMaterial.image}
                          alt="자재 이미지"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setNewMaterial({ ...newMaterial, image: "" })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="이미지 삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewMaterial({ ...newMaterial, image: event.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddMaterial}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">자재 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자재코드 *</label>
                  <input
                    type="text"
                    value={editingMaterial.code}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자재명 *</label>
                  <input
                    type="text"
                    value={editingMaterial.name}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품목구분</label>
                  <select
                    value={editingMaterial.category}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value as Material["category"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="원자재">원자재</option>
                    <option value="부자재">부자재</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">규격</label>
                  <input
                    type="text"
                    value={editingMaterial.specification}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, specification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                  <input
                    type="text"
                    value={editingMaterial.unit}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">구매단가</label>
                  <input
                    type="number"
                    value={editingMaterial.purchasePrice}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공급업체</label>
                  <select
                    value={editingMaterial.supplier}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">공급업체 선택</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingMaterial.description}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자재 이미지</label>
                  {editingMaterial.image && (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img
                          src={editingMaterial.image}
                          alt="자재 이미지"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingMaterial({ ...editingMaterial, image: "" })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="이미지 삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setEditingMaterial({ ...editingMaterial, image: event.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                  <select
                    value={editingMaterial.status}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, status: e.target.value as Material["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">사용</option>
                    <option value="inactive">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateMaterial}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMaterial(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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

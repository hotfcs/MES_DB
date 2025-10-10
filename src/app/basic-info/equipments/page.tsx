"use client";

import { useState } from "react";
import { useEquipmentsStore, type Equipment, useLinesStore } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function EquipmentsPage() {
  const { equipments, addEquipment, updateEquipment, deleteEquipment } = useEquipmentsStore();
  const { lines } = useLinesStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  // 사용 중인 라인만 필터링
  const activeLines = lines.filter(l => l.status === "active");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [newEquipment, setNewEquipment] = useState({
    code: "",
    name: "",
    type: "",
    manufacturer: "",
    model: "",
    purchaseDate: "",
    line: "",
    manager: "",
    description: "",
    status: "active" as const
  });

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("EQUIPMENTS_EDIT");
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.line.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || equipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddEquipment = () => {
    addEquipment(newEquipment);
    setShowAddModal(false);
    setNewEquipment({
      code: "",
      name: "",
      type: "",
      manufacturer: "",
      model: "",
      purchaseDate: "",
      line: "",
      manager: "",
      description: "",
      status: "active" as const
    });
  };

  const handleUpdateEquipment = () => {
    if (!editingEquipment) return;
    updateEquipment(editingEquipment.id, editingEquipment);
    setShowEditModal(false);
    setEditingEquipment(null);
    if (selectedEquipment?.id === editingEquipment.id) {
      setSelectedEquipment(editingEquipment);
    }
  };

  const handleDeleteEquipment = () => {
    if (!selectedEquipment) return;
    if (confirm(`"${selectedEquipment.name}" 설비를 삭제하시겠습니까?`)) {
      deleteEquipment(selectedEquipment.id);
      setSelectedEquipment(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["설비코드", "설비명", "설비유형", "제조사", "모델명", "구매일", "소속라인", "담당자", "설명", "사용유무", "생성일"],
      ...filteredEquipments.map(equipment => [
        equipment.code,
        equipment.name,
        equipment.type,
        equipment.manufacturer,
        equipment.model,
        equipment.purchaseDate,
        equipment.line,
        equipment.manager,
        equipment.description,
        equipment.status === "active" ? "사용" : "미사용",
        equipment.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "설비정보");
    XLSX.writeFile(workbook, `설비정보_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">설비정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">생산 설비 정보를 관리합니다.</p>
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
                  if (!selectedEquipment) {
                    alert("수정할 설비를 선택해주세요.");
                    return;
                  }
                  setEditingEquipment({ ...selectedEquipment });
                  setShowEditModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteEquipment}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="설비명, 코드, 설비유형, 제조사, 모델명, 소속라인으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
        {/* 설비 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">설비코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">설비명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">설비유형</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제조사</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">모델명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">소속라인</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      등록된 설비가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((equipment) => (
                    <tr
                      key={equipment.id}
                      onClick={() => setSelectedEquipment(equipment)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedEquipment?.id === equipment.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{equipment.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{equipment.name}</td>
                      <td className="px-4 py-3 text-sm">{equipment.type}</td>
                      <td className="px-4 py-3 text-sm">{equipment.manufacturer}</td>
                      <td className="px-4 py-3 text-sm">{equipment.model}</td>
                      <td className="px-4 py-3 text-sm">{equipment.line}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            equipment.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {equipment.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 설비 세부정보 */}
    <div className="bg-white rounded-lg border border-black/10 p-4">
          <h2 className="text-lg font-semibold mb-4">설비 세부사항</h2>
          {selectedEquipment ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">설비코드</label>
                <p className="text-sm mt-1">{selectedEquipment.code}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">설비명</label>
                <p className="text-sm mt-1">{selectedEquipment.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">설비유형</label>
                <p className="text-sm mt-1">{selectedEquipment.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">제조사</label>
                <p className="text-sm mt-1">{selectedEquipment.manufacturer}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">모델명</label>
                <p className="text-sm mt-1">{selectedEquipment.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">구매일</label>
                <p className="text-sm mt-1">{selectedEquipment.purchaseDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">소속라인</label>
                <p className="text-sm mt-1">{selectedEquipment.line}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">담당자</label>
                <p className="text-sm mt-1">{selectedEquipment.manager}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">설명</label>
                <p className="text-sm mt-1">{selectedEquipment.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">사용유무</label>
                <p className="text-sm mt-1">
                  {selectedEquipment.status === "active" ? "사용" : "미사용"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">생성일</label>
                <p className="text-sm mt-1">{selectedEquipment.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수정일</label>
                <p className="text-sm mt-1">{selectedEquipment.modifiedAt || "-"}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              설비를 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 설비 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설비코드 *</label>
                  <input
                    type="text"
                    value={newEquipment.code}
                    onChange={(e) => setNewEquipment({ ...newEquipment, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: EQ001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설비명 *</label>
                  <input
                    type="text"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: CNC 가공기"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설비유형</label>
                  <input
                    type="text"
                    value={newEquipment.type}
                    onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 가공설비, 성형설비, 검사설비"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
                  <input
                    type="text"
                    value={newEquipment.manufacturer}
                    onChange={(e) => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 두산공작기계"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
                  <input
                    type="text"
                    value={newEquipment.model}
                    onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: DNM-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">구매일</label>
                  <input
                    type="date"
                    value={newEquipment.purchaseDate}
                    onChange={(e) => setNewEquipment({ ...newEquipment, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소속라인</label>
                  <select
                    value={newEquipment.line}
                    onChange={(e) => setNewEquipment({ ...newEquipment, line: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">라인 선택</option>
                    {activeLines.map(line => (
                      <option key={line.id} value={line.name}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={newEquipment.manager}
                    onChange={(e) => setNewEquipment({ ...newEquipment, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김철수"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newEquipment.description}
                    onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="설비 설명을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddEquipment}
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
      {showEditModal && editingEquipment && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">설비 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설비코드 *</label>
                  <input
                    type="text"
                    value={editingEquipment.code}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설비명 *</label>
                  <input
                    type="text"
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설비유형</label>
                  <input
                    type="text"
                    value={editingEquipment.type}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
                  <input
                    type="text"
                    value={editingEquipment.manufacturer}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
                  <input
                    type="text"
                    value={editingEquipment.model}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">구매일</label>
                  <input
                    type="date"
                    value={editingEquipment.purchaseDate}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소속라인</label>
                  <select
                    value={editingEquipment.line}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, line: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">라인 선택</option>
                    {activeLines.map(line => (
                      <option key={line.id} value={line.name}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={editingEquipment.manager}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingEquipment.description}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                  <select
                    value={editingEquipment.status}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, status: e.target.value as Equipment["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">사용</option>
                    <option value="inactive">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateEquipment}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEquipment(null);
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

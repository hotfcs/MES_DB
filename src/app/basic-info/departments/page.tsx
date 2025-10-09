"use client";

import { useState } from "react";
import * as XLSX from 'xlsx';
import { useDepartmentsStore, useRolesStore, Department } from "@/store/dataStore";
import { useAuth } from "@/store/authStore";

export default function DepartmentsPage() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useDepartmentsStore();
  const { roles } = useRolesStore();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    code: "",
    manager: "",
    description: "",
    status: "active" as "active" | "inactive"
  });

  // Check user permissions
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(role => role.name === currentUser.role);
    return userRole ? userRole.permissions : [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("DEPARTMENTS_EDIT");
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || dept.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddDepartment = () => {
    if (newDepartment.name && newDepartment.code) {
      addDepartment({
        name: newDepartment.name,
        code: newDepartment.code,
        manager: newDepartment.manager,
        description: newDepartment.description,
        status: newDepartment.status
      });
      setNewDepartment({ 
        name: "", 
        code: "", 
        manager: "",
        description: "", 
        status: "active" as "active" | "inactive" 
      });
      setShowAddModal(false);
    }
  };

  const handleEditDepartment = () => {
    if (editingDepartment) {
      updateDepartment(editingDepartment.id, (prev) => ({
        ...prev,
        name: editingDepartment.name,
        code: editingDepartment.code,
        manager: editingDepartment.manager,
        description: editingDepartment.description,
        status: editingDepartment.status
      }));
      setEditingDepartment(null);
      setShowEditModal(false);
      setSelectedDepartment(editingDepartment);
    }
  };

  const handleDeleteDepartment = () => {
    if (selectedDepartment) {
      deleteDepartment(selectedDepartment.id);
      setSelectedDepartment(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["부서코드", "부서명", "담당자", "설명", "사용유무", "생성일"],
      ...filteredDepartments.map(dept => [
        dept.code,
        dept.name,
        dept.manager,
        dept.description,
        dept.status === "active" ? "사용" : "미사용",
        dept.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "부서목록");
    XLSX.writeFile(workbook, "부서목록.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">부서정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">조직의 부서 정보를 관리합니다.</p>
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
                  if (selectedDepartment) {
                    setEditingDepartment(selectedDepartment);
                    setShowEditModal(true);
                  }
                }}
                disabled={!selectedDepartment}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteDepartment}
                disabled={!selectedDepartment}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-32"
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
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="부서명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="active">사용</option>
              <option value="inactive">미사용</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            총 {filteredDepartments.length}개 부서
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 부서 목록 (좌측) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">부서코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">부서명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">설명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDepartments.map((dept) => (
                  <tr 
                    key={dept.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedDepartment?.id === dept.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{dept.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{dept.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{dept.manager}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{dept.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {dept.status === "active" ? "사용" : "미사용"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 부서 세부사항 (우측) */}
        <div className="lg:col-span-1">
          {selectedDepartment ? (
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <h3 className="text-lg font-bold mb-4">부서 세부사항</h3>
              
              {/* 부서 정보 */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">부서코드</label>
                  <div className="text-sm text-gray-900">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{selectedDepartment.code}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">부서명</label>
                  <div className="text-sm text-gray-900">{selectedDepartment.name}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">담당자</label>
                  <div className="text-sm text-gray-900">{selectedDepartment.manager}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">설명</label>
                  <div className="text-sm text-gray-900">{selectedDepartment.description}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사용유무</label>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedDepartment.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedDepartment.status === "active" ? "사용" : "미사용"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">생성일</label>
                  <div className="text-sm text-gray-900">{selectedDepartment.createdAt}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">수정일</label>
                  <div className="text-sm text-gray-900">{selectedDepartment.modifiedAt || "수정 이력 없음"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-center text-gray-500 py-8">
                부서를 선택하면 세부사항이 표시됩니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 부서 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 부서 추가</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서코드 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: IT, PRD, QA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <input
                  type="text"
                  value={newDepartment.manager}
                  onChange={(e) => setNewDepartment({...newDepartment, manager: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                <select
                  value={newDepartment.status}
                  onChange={(e) => setNewDepartment({...newDepartment, status: e.target.value as "active" | "inactive"})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">사용</option>
                  <option value="inactive">미사용</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddDepartment}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 부서 수정 모달 */}
      {showEditModal && editingDepartment && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">부서 수정</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서코드 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingDepartment.code}
                  onChange={(e) => setEditingDepartment({...editingDepartment, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <input
                  type="text"
                  value={editingDepartment.manager}
                  onChange={(e) => setEditingDepartment({...editingDepartment, manager: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={editingDepartment.description}
                  onChange={(e) => setEditingDepartment({...editingDepartment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                <select
                  value={editingDepartment.status}
                  onChange={(e) => setEditingDepartment({...editingDepartment, status: e.target.value as "active" | "inactive"})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">사용</option>
                  <option value="inactive">미사용</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleEditDepartment}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDepartment(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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
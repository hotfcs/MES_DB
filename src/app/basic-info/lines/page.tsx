"use client";

import { useState } from "react";
import { useLinesStore, type Line, useProcessesStore, useEquipmentsStore } from "@/store/dataStore";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore";
import * as XLSX from "xlsx";

export default function LinesPage() {
  const { lines, addLine, updateLine, deleteLine } = useLinesStore();
  const { processes } = useProcessesStore();
  const { equipments } = useEquipmentsStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [newLine, setNewLine] = useState({
    code: "",
    name: "",
    location: "",
    capacity: 0,
    manager: "",
    description: ""
  });

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("LINES_EDIT");
  };

  const filteredLines = lines.filter(line => {
    const matchesSearch = 
      line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || line.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddLine = () => {
    addLine(newLine);
    setShowAddModal(false);
    setNewLine({
      code: "",
      name: "",
      location: "",
      capacity: 0,
      manager: "",
      description: ""
    });
  };

  const handleUpdateLine = () => {
    if (!editingLine) return;
    updateLine(editingLine.id, () => editingLine);
    setShowEditModal(false);
    setEditingLine(null);
    if (selectedLine?.id === editingLine.id) {
      setSelectedLine(editingLine);
    }
  };

  const handleDeleteLine = () => {
    if (!selectedLine) return;
    if (confirm(`"${selectedLine.name}" 라인을 삭제하시겠습니까?`)) {
      deleteLine(selectedLine.id);
      setSelectedLine(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["라인코드", "라인명", "위치", "생산능력(개/일)", "담당자", "설명", "사용유무", "생성일"],
      ...filteredLines.map(line => [
        line.code,
        line.name,
        line.location,
        line.capacity,
        line.manager,
        line.description,
        line.status === "active" ? "사용" : "미사용",
        line.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "라인정보");
    XLSX.writeFile(workbook, `라인정보_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">라인정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">생산 라인 정보를 관리합니다.</p>
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
                  if (!selectedLine) {
                    alert("수정할 라인을 선택해주세요.");
                    return;
                  }
                  setEditingLine({ ...selectedLine });
                  setShowEditModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteLine}
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
            placeholder="라인명, 코드, 위치, 담당자로 검색..."
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
        {/* 라인 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">라인코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">라인명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">위치</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">생산능력(개/일)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      등록된 라인이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLines.map((line) => (
                    <tr
                      key={line.id}
                      onClick={() => setSelectedLine(line)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedLine?.id === line.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{line.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{line.name}</td>
                      <td className="px-4 py-3 text-sm">{line.location}</td>
                      <td className="px-4 py-3 text-sm text-right">{line.capacity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{line.manager}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            line.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {line.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 공정세부사항 및 설비세부사항 */}
        <div className="bg-white rounded-lg border border-black/10 p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          {selectedLine ? (
            <>
              {/* 공정세부사항 */}
              <div>
                <h2 className="text-base font-semibold mb-3 pb-2 border-b">공정 세부사항</h2>
                <div className="space-y-2">
                  {processes.filter(p => p.line === selectedLine.name).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">이 라인에 소속된 공정이 없습니다.</p>
                  ) : (
                    processes
                      .filter(p => p.line === selectedLine.name)
                      .map((process) => (
                        <div key={process.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium">{process.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              process.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {process.status === "active" ? "사용" : "미사용"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>코드: {process.code}</div>
                            <div>유형: {process.type}</div>
                            <div>표준시간: {process.standardTime}분</div>
                            <div>설명: {process.description}</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* 설비세부사항 */}
              <div>
                <h2 className="text-base font-semibold mb-3 pb-2 border-b">설비 세부사항</h2>
                <div className="space-y-2">
                  {equipments.filter(e => e.line === selectedLine.name).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">이 라인에 소속된 설비가 없습니다.</p>
                  ) : (
                    equipments
                      .filter(e => e.line === selectedLine.name)
                      .map((equipment) => (
                        <div key={equipment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium">{equipment.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              equipment.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {equipment.status === "active" ? "사용" : "미사용"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>코드: {equipment.code}</div>
                            <div>유형: {equipment.type}</div>
                            <div>제조사: {equipment.manufacturer}</div>
                            <div>모델: {equipment.model}</div>
                            <div>담당자: {equipment.manager}</div>
                            <div>설명: {equipment.description}</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              라인을 선택하면 공정 및 설비 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 라인 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라인코드 *</label>
                  <input
                    type="text"
                    value={newLine.code}
                    onChange={(e) => setNewLine({ ...newLine, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: LINE001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라인명 *</label>
                  <input
                    type="text"
                    value={newLine.name}
                    onChange={(e) => setNewLine({ ...newLine, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 조립라인 A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    value={newLine.location}
                    onChange={(e) => setNewLine({ ...newLine, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 1공장 1층"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생산능력(개/일)</label>
                  <input
                    type="number"
                    value={newLine.capacity}
                    onChange={(e) => setNewLine({ ...newLine, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={newLine.manager}
                    onChange={(e) => setNewLine({ ...newLine, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김철수"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newLine.description}
                    onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="라인 설명을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddLine}
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
      {showEditModal && editingLine && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">라인 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라인코드 *</label>
                  <input
                    type="text"
                    value={editingLine.code}
                    onChange={(e) => setEditingLine({ ...editingLine, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라인명 *</label>
                  <input
                    type="text"
                    value={editingLine.name}
                    onChange={(e) => setEditingLine({ ...editingLine, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    value={editingLine.location}
                    onChange={(e) => setEditingLine({ ...editingLine, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생산능력(개/일)</label>
                  <input
                    type="number"
                    value={editingLine.capacity}
                    onChange={(e) => setEditingLine({ ...editingLine, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={editingLine.manager}
                    onChange={(e) => setEditingLine({ ...editingLine, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingLine.description}
                    onChange={(e) => setEditingLine({ ...editingLine, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                  <select
                    value={editingLine.status}
                    onChange={(e) => setEditingLine({ ...editingLine, status: e.target.value as Line["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">사용</option>
                    <option value="inactive">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateLine}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLine(null);
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

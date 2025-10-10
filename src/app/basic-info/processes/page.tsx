"use client";

import { useState } from "react";
import { useProcessesStore, type Process, useLinesStore, useWarehousesStore } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function ProcessesPage() {
  const { processes, addProcess, updateProcess, deleteProcess } = useProcessesStore();
  const { lines } = useLinesStore();
  const { warehouses } = useWarehousesStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  // 사용 중인 라인과 공정창고만 필터링
  const activeLines = lines.filter(l => l.status === "active");
  const processWarehouses = warehouses.filter(w => w.status === "active" && w.type === "공정창고");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [newProcess, setNewProcess] = useState({
    code: "",
    name: "",
    type: "",
    standardTime: 0,
    line: "",
    warehouse: "",
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
    return permissions.includes("PROCESSES_EDIT");
  };

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = 
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.line.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || process.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProcess = () => {
    addProcess(newProcess);
    setShowAddModal(false);
    setNewProcess({
      code: "",
      name: "",
      type: "",
      standardTime: 0,
      line: "",
      warehouse: "",
      description: "",
      status: "active" as const
    });
  };

  const handleUpdateProcess = () => {
    if (!editingProcess) return;
    updateProcess(editingProcess.id, editingProcess);
    setShowEditModal(false);
    setEditingProcess(null);
    if (selectedProcess?.id === editingProcess.id) {
      setSelectedProcess(editingProcess);
    }
  };

  const handleDeleteProcess = () => {
    if (!selectedProcess) return;
    if (confirm(`"${selectedProcess.name}" 공정을 삭제하시겠습니까?`)) {
      deleteProcess(selectedProcess.id);
      setSelectedProcess(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["공정코드", "공정명", "공정유형", "표준시간(분)", "소속라인", "공정창고", "설명", "사용유무", "생성일"],
      ...filteredProcesses.map(process => [
        process.code,
        process.name,
        process.type,
        process.standardTime,
        process.line,
        process.warehouse,
        process.description,
        process.status === "active" ? "사용" : "미사용",
        process.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "공정정보");
    XLSX.writeFile(workbook, `공정정보_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">공정정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">생산 공정 정보를 관리합니다.</p>
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
                  if (!selectedProcess) {
                    alert("수정할 공정을 선택해주세요.");
                    return;
                  }
                  setEditingProcess({ ...selectedProcess });
                  setShowEditModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteProcess}
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
            placeholder="공정명, 코드, 공정유형, 소속라인, 공정창고로 검색..."
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
        {/* 공정 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">공정코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">공정명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">공정유형</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">표준시간(분)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">소속라인</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">공정창고</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProcesses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      등록된 공정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredProcesses.map((process) => (
                    <tr
                      key={process.id}
                      onClick={() => setSelectedProcess(process)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedProcess?.id === process.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{process.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{process.name}</td>
                      <td className="px-4 py-3 text-sm">{process.type}</td>
                      <td className="px-4 py-3 text-sm text-right">{process.standardTime}</td>
                      <td className="px-4 py-3 text-sm">{process.line}</td>
                      <td className="px-4 py-3 text-sm">{process.warehouse}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            process.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {process.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 공정 세부정보 */}
    <div className="bg-white rounded-lg border border-black/10 p-4">
          <h2 className="text-lg font-semibold mb-4">공정 세부사항</h2>
          {selectedProcess ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">공정코드</label>
                <p className="text-sm mt-1">{selectedProcess.code}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">공정명</label>
                <p className="text-sm mt-1">{selectedProcess.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">공정유형</label>
                <p className="text-sm mt-1">{selectedProcess.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">표준시간(분)</label>
                <p className="text-sm mt-1">{selectedProcess.standardTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">소속라인</label>
                <p className="text-sm mt-1">{selectedProcess.line || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">공정창고</label>
                <p className="text-sm mt-1">{selectedProcess.warehouse || "-"}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">설명</label>
                <p className="text-sm mt-1">{selectedProcess.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">사용유무</label>
                <p className="text-sm mt-1">
                  {selectedProcess.status === "active" ? "사용" : "미사용"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">생성일</label>
                <p className="text-sm mt-1">{selectedProcess.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수정일</label>
                <p className="text-sm mt-1">{selectedProcess.modifiedAt || "-"}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              공정을 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 공정 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정코드 *</label>
                  <input
                    type="text"
                    value={newProcess.code}
                    onChange={(e) => setNewProcess({ ...newProcess, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: PROC001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정명 *</label>
                  <input
                    type="text"
                    value={newProcess.name}
                    onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 외관 가공"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정유형</label>
                  <input
                    type="text"
                    value={newProcess.type}
                    onChange={(e) => setNewProcess({ ...newProcess, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 가공, 성형, 검사, 포장"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">표준시간(분)</label>
                  <input
                    type="number"
                    value={newProcess.standardTime}
                    onChange={(e) => setNewProcess({ ...newProcess, standardTime: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소속라인</label>
                  <select
                    value={newProcess.line}
                    onChange={(e) => setNewProcess({ ...newProcess, line: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정창고</label>
                  <select
                    value={newProcess.warehouse}
                    onChange={(e) => setNewProcess({ ...newProcess, warehouse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">창고 선택</option>
                    {processWarehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newProcess.description}
                    onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="공정 설명을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddProcess}
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
      {showEditModal && editingProcess && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">공정 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정코드 *</label>
                  <input
                    type="text"
                    value={editingProcess.code}
                    onChange={(e) => setEditingProcess({ ...editingProcess, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정명 *</label>
                  <input
                    type="text"
                    value={editingProcess.name}
                    onChange={(e) => setEditingProcess({ ...editingProcess, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정유형</label>
                  <input
                    type="text"
                    value={editingProcess.type}
                    onChange={(e) => setEditingProcess({ ...editingProcess, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">표준시간(분)</label>
                  <input
                    type="number"
                    value={editingProcess.standardTime}
                    onChange={(e) => setEditingProcess({ ...editingProcess, standardTime: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소속라인</label>
                  <select
                    value={editingProcess.line}
                    onChange={(e) => setEditingProcess({ ...editingProcess, line: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">공정창고</label>
                  <select
                    value={editingProcess.warehouse}
                    onChange={(e) => setEditingProcess({ ...editingProcess, warehouse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">창고 선택</option>
                    {processWarehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingProcess.description}
                    onChange={(e) => setEditingProcess({ ...editingProcess, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                  <select
                    value={editingProcess.status}
                    onChange={(e) => setEditingProcess({ ...editingProcess, status: e.target.value as Process["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">사용</option>
                    <option value="inactive">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateProcess}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProcess(null);
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

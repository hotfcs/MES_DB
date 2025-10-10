"use client";

import { useState, useEffect } from "react";
import { useRoutingsStore, type Routing, type RoutingStep, useLinesStore, useProcessesStore, useEquipmentsStore } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function RoutingsPage() {
  const { routings, routingSteps, addRouting, updateRouting, deleteRouting, saveRoutingSteps, getRoutingStepsByRoutingId } = useRoutingsStore();
  const { lines } = useLinesStore();
  const { processes } = useProcessesStore();
  const { equipments } = useEquipmentsStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRouting, setSelectedRouting] = useState<Routing | null>(null);
  const [editingSteps, setEditingSteps] = useState<RoutingStep[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [newRouting, setNewRouting] = useState({
    code: "",
    name: ""
  });

  // Get active options
  const activeLines = lines.filter(l => l.status === "active");
  const activeProcesses = processes.filter(p => p.status === "active");
  const activeEquipments = equipments.filter(e => e.status === "active");

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("ROUTINGS_EDIT");
  };

  // Load routing steps when routing is selected
  useEffect(() => {
    if (selectedRouting) {
      const steps = getRoutingStepsByRoutingId(selectedRouting.id);
      setEditingSteps(steps.map(s => ({...s})));
    } else {
      setEditingSteps([]);
    }
  }, [selectedRouting, routingSteps]);

  const filteredRoutings = routings.filter(routing => {
    const matchesSearch = 
      routing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routing.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddRouting = () => {
    if (!newRouting.code || !newRouting.name) {
      alert("라우팅코드와 라우팅명은 필수 입력 항목입니다.");
      return;
    }
    addRouting(newRouting);
    setNewRouting({ code: "", name: "" });
    setShowAddModal(false);
  };


  const handleDeleteRouting = () => {
    if (!selectedRouting) {
      alert("삭제할 라우팅을 선택해주세요.");
      return;
    }
    if (confirm(`${selectedRouting.name} 라우팅을 삭제하시겠습니까?\n연관된 모든 공정 단계도 함께 삭제됩니다.`)) {
      deleteRouting(selectedRouting.id);
      setSelectedRouting(null);
    }
  };

  const handleAddStep = () => {
    if (!selectedRouting) return;
    
    const firstLine = activeLines[0]?.name || "";
    const lineProcesses = activeProcesses.filter(p => p.line === firstLine);
    const lineEquipments = activeEquipments.filter(e => e.line === firstLine);
    
    // Calculate sequence (auto-increment 1, 2, 3, 4...)
    const newSequence = editingSteps.length + 1;
    const lastStep = editingSteps.length > 0 ? editingSteps[editingSteps.length - 1] : null;
    
    const newStep: RoutingStep = {
      id: Date.now(), // Temporary ID
      routingId: selectedRouting.id,
      sequence: newSequence,
      line: firstLine,
      process: lineProcesses[0]?.name || "",
      mainEquipment: lineEquipments[0]?.name || "",
      standardManHours: 0,
      previousProcess: lastStep ? lastStep.process : "-",
      nextProcess: "-"
    };
    
    // Update last step's nextProcess
    if (lastStep) {
      setEditingSteps([
        ...editingSteps.slice(0, -1),
        { ...lastStep, nextProcess: newStep.process },
        newStep
      ]);
    } else {
      setEditingSteps([newStep]);
    }
  };

  const handleDeleteStep = (stepId: number) => {
    const filteredSteps = editingSteps.filter(s => s.id !== stepId);
    // Re-number sequences after deletion
    const reNumberedSteps = filteredSteps.map((step, index) => ({
      ...step,
      sequence: index + 1
    }));
    setEditingSteps(reNumberedSteps);
  };

  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...editingSteps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    // Re-number sequences
    const reNumberedSteps = newSteps.map((step, idx) => ({
      ...step,
      sequence: idx + 1
    }));
    setEditingSteps(reNumberedSteps);
  };

  const handleMoveStepDown = (index: number) => {
    if (index === editingSteps.length - 1) return;
    const newSteps = [...editingSteps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    // Re-number sequences
    const reNumberedSteps = newSteps.map((step, idx) => ({
      ...step,
      sequence: idx + 1
    }));
    setEditingSteps(reNumberedSteps);
  };

  const handleStepChange = (stepId: number, field: keyof RoutingStep, value: string | number) => {
    setEditingSteps(editingSteps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const handleSave = () => {
    if (!selectedRouting) return;
    
    try {
      // Validate steps
      for (const step of editingSteps) {
        if (!step.line || !step.process || !step.mainEquipment) {
          throw new Error("모든 공정 단계의 라인, 공정, 주설비를 입력해주세요.");
        }
      }

      // Generate new IDs for new steps
      let maxId = routingSteps.length > 0 ? Math.max(...routingSteps.map(s => s.id)) : 0;
      const stepsToSave = editingSteps.map(step => {
        if (step.id > 1000000000) { // Temporary ID
          return { ...step, id: ++maxId };
        }
        return step;
      });

      saveRoutingSteps(selectedRouting.id, stepsToSave);
      
      setNotification({ type: 'success', message: '저장완료.' });
      setTimeout(() => setNotification(null), 500);
    } catch (err: unknown) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.' });
    }
  };

  const handleExportExcel = () => {
    const exportData: Record<string, string | number>[] = [];
    
    filteredRoutings.forEach(routing => {
      const steps = getRoutingStepsByRoutingId(routing.id);
      steps.forEach(step => {
        exportData.push({
          "라우팅코드": routing.code,
          "라우팅명": routing.name,
          "공정순서": step.sequence,
          "라인": step.line,
          "공정": step.process,
          "주설비": step.mainEquipment,
          "표준공수": step.standardManHours,
          "이전공정": step.previousProcess,
          "다음공정": step.nextProcess
        });
      });
    });
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "라우팅정보");
    XLSX.writeFile(workbook, "라우팅정보.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">라우팅정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">제품별 생산 공정 흐름을 관리합니다.</p>
          </div>
          {hasEditPermission() && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-36"
              >
                ➕ 라우팅추가
              </button>
              <button
                onClick={handleDeleteRouting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 w-36"
                disabled={!selectedRouting}
              >
                🗑️ 라우팅삭제
              </button>
              <button
                onClick={handleSave}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 w-32"
                disabled={!selectedRouting}
              >
                💾 저장
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors w-32"
              >
                📊 엑셀출력
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
    <div className="bg-white rounded-lg border border-black/10 p-4">
        <input
          type="text"
          placeholder="라우팅명, 코드로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main Grid and Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Routing List (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">라우팅 목록</h2>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">라우팅코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">라우팅명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoutings.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                      등록된 라우팅이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRoutings.map((routing) => (
                    <tr
                      key={routing.id}
                      onClick={() => setSelectedRouting(routing)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRouting?.id === routing.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{routing.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{routing.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Routing Steps Detail Grid (3 columns) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">
              {selectedRouting ? `${selectedRouting.name} - 공정 상세` : "라우팅을 선택하세요"}
            </h2>
            {selectedRouting && hasEditPermission() && (
              <button
                onClick={handleAddStep}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32"
              >
                ➕ 공정 추가
              </button>
            )}
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">공정순서</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">라인</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">공정</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">주설비</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">표준공수</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">이전공정</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">다음공정</th>
                  {hasEditPermission() && (
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">순서변경</th>
                  )}
                  {hasEditPermission() && (
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">삭제</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!selectedRouting ? (
                  <tr>
                    <td colSpan={hasEditPermission() ? 9 : 7} className="px-4 py-8 text-center text-gray-500 text-sm">
                      좌측에서 라우팅을 선택하면 공정 상세가 표시됩니다.
                    </td>
                  </tr>
                ) : editingSteps.length === 0 ? (
                  <tr>
                    <td colSpan={hasEditPermission() ? 9 : 7} className="px-4 py-8 text-center text-gray-500 text-sm">
                      등록된 공정이 없습니다. 공정을 추가해주세요.
                    </td>
                  </tr>
                ) : (
                  editingSteps.map((step, index) => {
                    // Filter processes and equipments by selected line
                    const lineProcesses = activeProcesses.filter(p => p.line === step.line);
                    const lineEquipments = activeEquipments.filter(e => e.line === step.line);
                    
                    return (
                      <tr key={step.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <div className="text-xs text-gray-700 text-center font-semibold">{step.sequence}</div>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={step.line}
                            onChange={(e) => {
                              const newLine = e.target.value;
                              const newLineProcesses = activeProcesses.filter(p => p.line === newLine);
                              const newLineEquipments = activeEquipments.filter(e => e.line === newLine);
                              
                              // Update all changes at once
                              setEditingSteps(editingSteps.map(s => {
                                if (s.id === step.id) {
                                  const updates: Partial<RoutingStep> = { line: newLine };
                                  
                                  // Reset process if it doesn't belong to the new line
                                  if (newLineProcesses.length > 0 && !newLineProcesses.find(p => p.name === s.process)) {
                                    updates.process = newLineProcesses[0].name;
                                  }
                                  
                                  // Reset equipment if it doesn't belong to the new line
                                  if (newLineEquipments.length > 0 && !newLineEquipments.find(e => e.name === s.mainEquipment)) {
                                    updates.mainEquipment = newLineEquipments[0].name;
                                  }
                                  
                                  return { ...s, ...updates };
                                }
                                return s;
                              }));
                            }}
                            className="w-full px-2 py-1 border rounded text-xs"
                            disabled={!hasEditPermission()}
                          >
                            {activeLines.map(line => (
                              <option key={line.id} value={line.name}>{line.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={step.process}
                            onChange={(e) => handleStepChange(step.id, 'process', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                            disabled={!hasEditPermission()}
                          >
                            {lineProcesses.length > 0 ? (
                              lineProcesses.map(process => (
                                <option key={process.id} value={process.name}>{process.name}</option>
                              ))
                            ) : (
                              <option value="">공정 없음</option>
                            )}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={step.mainEquipment}
                            onChange={(e) => handleStepChange(step.id, 'mainEquipment', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                            disabled={!hasEditPermission()}
                          >
                            {lineEquipments.length > 0 ? (
                              lineEquipments.map(equipment => (
                                <option key={equipment.id} value={equipment.name}>{equipment.name}</option>
                              ))
                            ) : (
                              <option value="">설비 없음</option>
                            )}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={step.standardManHours}
                            onChange={(e) => handleStepChange(step.id, 'standardManHours', Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded text-xs"
                            disabled={!hasEditPermission()}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-xs text-gray-700">{step.previousProcess}</div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-xs text-gray-700">{step.nextProcess}</div>
                        </td>
                        {hasEditPermission() && (
                          <td className="px-2 py-2 text-center">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveStepUp(index)}
                                disabled={index === 0}
                                className={`text-xs px-2 py-1 rounded ${
                                  index === 0 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => handleMoveStepDown(index)}
                                disabled={index === editingSteps.length - 1}
                                className={`text-xs px-2 py-1 rounded ${
                                  index === editingSteps.length - 1
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                ▼
                              </button>
                            </div>
                          </td>
                        )}
                        {hasEditPermission() && (
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => handleDeleteStep(step.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              삭제
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 라우팅 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라우팅코드 *</label>
                  <input
                    type="text"
                    value={newRouting.code}
                    onChange={(e) => setNewRouting({ ...newRouting, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: RT001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라우팅명 *</label>
                  <input
                    type="text"
                    value={newRouting.name}
                    onChange={(e) => setNewRouting({ ...newRouting, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 스마트폰 케이스 라우팅"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddRouting}
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

      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg shadow-lg text-white z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
          onClick={() => notification.type === 'error' && setNotification(null)}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

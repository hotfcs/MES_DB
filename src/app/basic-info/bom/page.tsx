"use client";

import { useState, useEffect } from "react";
import { useBOMsStore, type BOM, type BOMItem, useProductsStore, useMaterialsStore, useRoutingsStore } from "@/store/dataStore";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore";
import * as XLSX from "xlsx";

export default function BOMPage() {
  const { boms, bomItems, addBOM, updateBOM, deleteBOM, saveBOMItems, getBOMItemsByBOMId } = useBOMsStore();
  const { products } = useProductsStore();
  const { materials } = useMaterialsStore();
  const { routings, routingSteps, getRoutingStepsByRoutingId } = useRoutingsStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "제품" | "반제품" | "상품">("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [selectedProcessSequence, setSelectedProcessSequence] = useState<number | null>(null);
  const [editingItems, setEditingItems] = useState<BOMItem[]>([]);
  const [showAddBOMModal, setShowAddBOMModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [newBOM, setNewBOM] = useState({
    productCode: "",
    productName: "",
    routingId: 0,
    routingName: "",
    revision: "Rev.01"
  });

  // Get active options
  const activeProducts = products.filter(p => p.status === "active");
  const activeMaterials = materials.filter(m => m.status === "active");

  // Permission check
  const getUserPermissions = () => {
    if (!currentUser) return [];
    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.permissions || [];
  };

  const hasEditPermission = () => {
    const permissions = getUserPermissions();
    return permissions.includes("BOM_EDIT");
  };

  // Get unique customers
  const uniqueCustomers = Array.from(new Set(activeProducts.map(p => p.customer))).filter(c => c);

  // Get products with BOM status
  const productsWithBOMStatus = activeProducts.map(product => {
    const hasBOM = boms.some(b => b.productCode === product.code);
    return {
      ...product,
      hasBOM
    };
  });

  // Filter products
  const filteredProducts = productsWithBOMStatus.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesCustomer = customerFilter === "all" || product.customer === customerFilter;
    return matchesSearch && matchesCategory && matchesCustomer;
  });

  // Get BOMs for selected product
  const productBOMs = selectedProductCode 
    ? boms.filter(b => b.productCode === selectedProductCode)
    : [];

  // Load BOM items when BOM is selected
  useEffect(() => {
    if (selectedBOM) {
      const items = getBOMItemsByBOMId(selectedBOM.id);
      setEditingItems(items.map(i => ({...i})));
      setSelectedProcessSequence(null); // Reset selected process
    } else {
      setEditingItems([]);
      setSelectedProcessSequence(null);
    }
  }, [selectedBOM, bomItems]);

  // Get routing info for selected BOM
  const getRoutingInfo = () => {
    if (!selectedBOM) return [];
    
    const steps = getRoutingStepsByRoutingId(selectedBOM.routingId);
    return steps.sort((a, b) => a.sequence - b.sequence);
  };

  const handleAddBOM = () => {
    if (!newBOM.productCode || !newBOM.productName || !newBOM.routingId) {
      alert("제품과 라우팅을 선택해주세요.");
      return;
    }
    
    // Auto-generate revision number
    const productBOMs = boms.filter(b => b.productCode === newBOM.productCode);
    let maxRevNum = 0;
    productBOMs.forEach(b => {
      const match = b.revision.match(/Rev\.(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxRevNum) maxRevNum = num;
      }
    });
    const autoRevision = `Rev.${String(maxRevNum + 1).padStart(2, '0')}`;
    
    const newBOMData = addBOM({
      ...newBOM,
      revision: autoRevision
    });
    
    setNewBOM({ productCode: "", productName: "", routingId: 0, routingName: "", revision: "Rev.01" });
    setShowAddBOMModal(false);
    setSelectedProductCode(newBOM.productCode);
    setSelectedBOM(newBOMData);
  };

  const handleDeleteBOM = () => {
    if (!selectedBOM) {
      alert("삭제할 BOM을 선택해주세요.");
      return;
    }
    if (confirm(`${selectedBOM.productName} (${selectedBOM.revision}) BOM을 삭제하시겠습니까?\n연관된 모든 자재 정보도 함께 삭제됩니다.`)) {
      deleteBOM(selectedBOM.id);
      setSelectedBOM(null);
    }
  };

  const handleAddItem = () => {
    if (!selectedBOM) {
      alert("BOM을 먼저 선택해주세요.");
      return;
    }
    
    if (selectedProcessSequence === null) {
      alert("공정 라우팅 리스트에서 공정을 먼저 선택해주세요.");
      return;
    }
    
    const routingInfo = getRoutingInfo();
    const selectedProcess = routingInfo.find(r => r.sequence === selectedProcessSequence);
    
    if (!selectedProcess) {
      alert("선택된 공정을 찾을 수 없습니다.");
      return;
    }
    
    const newItem: BOMItem = {
      id: Date.now(), // Temporary ID
      bomId: selectedBOM.id,
      processSequence: selectedProcess.sequence,
      processName: selectedProcess.process,
      materialCode: activeMaterials[0]?.code || "",
      materialName: activeMaterials[0]?.name || "",
      quantity: 0,
      unit: activeMaterials[0]?.unit || "EA",
      lossRate: 0,
      alternateMaterial: ""
    };
    setEditingItems([...editingItems, newItem]);
  };

  const handleDeleteItem = (itemId: number) => {
    setEditingItems(editingItems.filter(i => i.id !== itemId));
  };

  const handleItemChange = (itemId: number, field: keyof BOMItem, value: string | number) => {
    setEditingItems(editingItems.map(item => {
      if (item.id === itemId) {
        if (field === 'materialCode') {
          // If material changed, update all related fields at once
          const material = activeMaterials.find(m => m.code === String(value));
          if (material) {
            return {
              ...item,
              materialCode: String(value),
              materialName: material.name,
              unit: material.unit
            };
          }
        }
        return { ...item, [field]: value } as BOMItem;
      }
      return item;
    }));
  };

  const handleSave = () => {
    if (!selectedBOM) return;
    
    try {
      // Validate items
      for (const item of editingItems) {
        if (!item.materialCode || !item.materialName || item.quantity <= 0) {
          throw new Error("모든 자재 항목의 자재코드, 자재명, 수량을 입력해주세요.");
        }
      }

      // Generate new IDs for new items
      let maxId = bomItems.length > 0 ? Math.max(...bomItems.map(i => i.id)) : 0;
      const itemsToSave = editingItems.map(item => {
        if (item.id > 1000000000) { // Temporary ID
          return { ...item, id: ++maxId };
        }
        return item;
      });

      saveBOMItems(selectedBOM.id, itemsToSave);
      
      setNotification({ type: 'success', message: '저장완료.' });
      setTimeout(() => setNotification(null), 500);
    } catch (err: unknown) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.' });
    }
  };

  const handleExportExcel = () => {
    const exportData: Record<string, string | number>[] = [];
    
    boms.forEach(bom => {
      const items = getBOMItemsByBOMId(bom.id);
      items.forEach(item => {
        exportData.push({
          "제품코드": bom.productCode,
          "제품명": bom.productName,
          "라우팅명": bom.routingName,
          "리비전": bom.revision,
          "공정순서": item.processSequence,
          "공정명": item.processName,
          "자재코드": item.materialCode,
          "자재명": item.materialName,
          "소요량": item.quantity,
          "단위": item.unit,
          "손실율(%)": item.lossRate,
          "대체자재": item.alternateMaterial || "-"
        });
      });
    });
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOM정보");
    XLSX.writeFile(workbook, "BOM정보.xlsx");
  };

  const handleProductSelectForBOM = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productCode = e.target.value;
    const product = activeProducts.find(p => p.code === productCode);
    if (product) {
      setNewBOM({
        ...newBOM,
        productCode: product.code,
        productName: product.name,
        routingId: 0,
        routingName: ""
      });
    }
  };

  const handleRoutingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routingId = Number(e.target.value);
    const routing = routings.find(r => r.id === routingId);
    if (routing) {
      setNewBOM({
        ...newBOM,
        routingId: routing.id,
        routingName: routing.name
      });
    }
  };

  // Get routings for selected product in modal
  const getProductRoutings = () => {
    // Show all active routings for selection
    return routings.filter(r => r.status === "active");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">BOM정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">제품별 자재 소요량을 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 w-32"
              disabled={!selectedBOM || !hasEditPermission()}
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
        </div>
      </div>

      {/* Search and Filter */}
    <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="제품명, 제품코드로 검색..."
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
            <option value="제품">제품</option>
            <option value="반제품">반제품</option>
            <option value="상품">상품</option>
          </select>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 거래처</option>
            {uniqueCustomers.map((customer, index) => (
              <option key={index} value={customer}>{customer}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid and Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Section (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product List */}
          <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">모제품 리스트</h2>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(50vh - 150px)' }}>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제품명</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">품목구분</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">거래처</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">BOM유무</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        등록된 제품이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => {
                          setSelectedProductCode(product.code);
                          setSelectedBOM(null);
                        }}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProductCode === product.code ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-sm">{product.category}</td>
                        <td className="px-4 py-3 text-sm">{product.customer}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.hasBOM 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {product.hasBOM ? "O" : "X"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOM List for Selected Product */}
          <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700">BOM 리스트</h2>
              {selectedProductCode && hasEditPermission() && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const product = activeProducts.find(p => p.code === selectedProductCode);
                      if (product) {
                        setNewBOM({
                          productCode: product.code,
                          productName: product.name,
                          routingId: 0,
                          routingName: "",
                          revision: "Rev.01"
                        });
                        setShowAddBOMModal(true);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32"
                  >
                    ➕ BOM추가
                  </button>
                  <button
                    onClick={handleDeleteBOM}
                    disabled={!selectedBOM}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 w-32"
                  >
                    🗑️ BOM삭제
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(50vh - 150px)' }}>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">리비전</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">라우팅명</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">생성일</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">수정일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!selectedProductCode ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                        좌측에서 모제품을 선택하세요.
                      </td>
                    </tr>
                  ) : productBOMs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                        등록된 BOM이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    productBOMs.map((bom) => (
                      <tr
                        key={bom.id}
                        onClick={() => setSelectedBOM(bom)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedBOM?.id === bom.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                            {bom.revision}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{bom.routingName}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{bom.createdAt}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{bom.modifiedAt || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top: Routing Process List */}
          <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedBOM ? `공정 라우팅 리스트 - ${selectedBOM.routingName} (${selectedBOM.revision})` : "BOM을 선택하세요"}
              </h2>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(50vh - 150px)' }}>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!selectedBOM ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                        좌측에서 BOM을 선택하면 공정 라우팅 리스트가 표시됩니다.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const routingInfo = getRoutingInfo();
                      
                      if (routingInfo.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                              선택된 라우팅에 등록된 공정이 없습니다.
                            </td>
                          </tr>
                        );
                      }
                      
                      return routingInfo.map((step) => (
                        <tr 
                          key={step.id} 
                          onClick={() => setSelectedProcessSequence(step.sequence)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedProcessSequence === step.sequence ? "bg-green-50" : ""
                          }`}
                        >
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700 text-center font-semibold">{step.sequence}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{step.line}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{step.process}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{step.mainEquipment}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{step.standardManHours}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{step.previousProcess}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{step.nextProcess}</div>
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom: Process Material List */}
          <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700">
                공정별 자재 리스트
                {selectedProcessSequence !== null && (
                  <span className="ml-2 text-xs text-blue-600">
                    (공정 {selectedProcessSequence} 선택됨)
                  </span>
                )}
              </h2>
            {selectedBOM && hasEditPermission() && (
              <button
                onClick={handleAddItem}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32"
              >
                ➕ 자재 추가
              </button>
            )}
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(50vh - 150px)' }}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">공정순서</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">공정명</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">소요자재</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">소요량</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">단위</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">손실율(%)</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">대체자재</th>
                    {hasEditPermission() && (
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">삭제</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!selectedBOM ? (
                    <tr>
                      <td colSpan={hasEditPermission() ? 9 : 8} className="px-4 py-8 text-center text-gray-500 text-sm">
                        좌측에서 BOM을 선택하면 공정별 자재 리스트가 표시됩니다.
                      </td>
                    </tr>
                  ) : editingItems.length === 0 ? (
                    <tr>
                      <td colSpan={hasEditPermission() ? 8 : 7} className="px-4 py-8 text-center text-gray-500 text-sm">
                        등록된 자재가 없습니다. 공정을 선택하고 자재를 추가해주세요.
                      </td>
                    </tr>
                  ) : (
                    editingItems.map((item) => {
                      const routingInfo = getRoutingInfo();
                      const selectedMaterial = activeMaterials.find(m => m.code === item.materialCode);
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700 text-center font-semibold">{item.processSequence}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{item.processName}</div>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.materialCode}
                              onChange={(e) => handleItemChange(item.id, 'materialCode', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              disabled={!hasEditPermission()}
                            >
                              <option value="">자재 선택</option>
                              {activeMaterials.map(material => (
                                <option key={material.id} value={material.code}>
                                  {material.code} - {material.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                              className="w-20 px-2 py-1 border rounded text-xs"
                              disabled={!hasEditPermission()}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-700">{item.unit}</div>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.lossRate}
                              onChange={(e) => handleItemChange(item.id, 'lossRate', Number(e.target.value))}
                              className="w-16 px-2 py-1 border rounded text-xs"
                              disabled={!hasEditPermission()}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.alternateMaterial}
                              onChange={(e) => handleItemChange(item.id, 'alternateMaterial', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              disabled={!hasEditPermission()}
                            >
                              <option value="">없음</option>
                              {activeMaterials.map(material => (
                                <option key={material.id} value={material.code}>
                                  {material.code} - {material.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          {hasEditPermission() && (
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
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
      </div>

      {/* Add BOM Modal */}
      {showAddBOMModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 BOM 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">모제품 *</label>
                  <input
                    type="text"
                    value={newBOM.productName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품코드 *</label>
                  <input
                    type="text"
                    value={newBOM.productCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">라우팅 선택 *</label>
                  <select
                    value={newBOM.routingId}
                    onChange={handleRoutingSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>라우팅 선택</option>
                    {getProductRoutings().map(routing => (
                      <option key={routing.id} value={routing.id}>
                        {routing.code} - {routing.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">리비전</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700">
                    자동 채번됩니다
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddBOM}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddBOMModal(false)}
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

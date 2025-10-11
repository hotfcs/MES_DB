"use client";

import { useState } from "react";
import { useProductsStore, type Product, useCustomersStore, type Customer } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProductsStore();
  const { customers } = useCustomersStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  
  // 고객사만 필터링
  const customerList = customers.filter((c: Customer) => c.type === "고객사" && c.status === "active");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "제품" | "반제품" | "상품">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // 실시간 검증 에러 상태
  const [validationErrors, setValidationErrors] = useState<{code?: string; name?: string; category?: string}>({});
  const [editValidationErrors, setEditValidationErrors] = useState<{code?: string; name?: string; category?: string}>({});
  
  // 실시간 검증 함수
  const validateNewProduct = (field: string, value: any) => {
    const errors = { ...validationErrors };
    if (field === 'code') {
      if (!value?.trim()) errors.code = '제품 코드는 필수입니다.';
      else if (products.some(p => p.code === value)) errors.code = '이미 존재하는 코드입니다.';
      else delete errors.code;
    }
    if (field === 'name') {
      if (!value?.trim()) errors.name = '제품명은 필수입니다.';
      else delete errors.name;
    }
    if (field === 'category') {
      if (!value) errors.category = '품목구분은 필수입니다.';
      else delete errors.category;
    }
    setValidationErrors(errors);
  };
  
  const validateEditProduct = (field: string, value: any, currentId: number) => {
    const errors = { ...editValidationErrors };
    if (field === 'code') {
      if (!value?.trim()) errors.code = '제품 코드는 필수입니다.';
      else if (products.some(p => p.code === value && p.id !== currentId)) errors.code = '이미 존재하는 코드입니다.';
      else delete errors.code;
    }
    if (field === 'name') {
      if (!value?.trim()) errors.name = '제품명은 필수입니다.';
      else delete errors.name;
    }
    if (field === 'category') {
      if (!value) errors.category = '품목구분은 필수입니다.';
      else delete errors.category;
    }
    setEditValidationErrors(errors);
  };
  
  const isNewProductValid = () => {
    return newProduct.code && newProduct.name && newProduct.category && Object.keys(validationErrors).length === 0;
  };
  
  const isEditProductValid = () => {
    return editingProduct?.code && editingProduct?.name && editingProduct?.category && Object.keys(editValidationErrors).length === 0;
  };
  
  const [newProduct, setNewProduct] = useState<{
    code: string;
    name: string;
    category: Product["category"];
    specification: string;
    unit: string;
    standardCost: number;
    sellingPrice: number;
    customer: string;
    description: string;
    image: string;
    status: Product["status"];
  }>({
    code: "",
    name: "",
    category: "제품",
    specification: "",
    unit: "EA",
    standardCost: 0,
    sellingPrice: 0,
    customer: "",
    description: "",
    image: "",
    status: "active"
  });

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
    return permissions.includes("PRODUCTS_EDIT") || permissions.includes('ALL');
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddProduct = async () => {
    // 필수 항목 검증
    if (!newProduct.code || !newProduct.code.trim()) {
      setNotification({ type: 'error', message: '제품 코드는 필수입니다.' });
      return;
    }
    if (!newProduct.name || !newProduct.name.trim()) {
      setNotification({ type: 'error', message: '제품명은 필수입니다.' });
      return;
    }
    if (!newProduct.category) {
      setNotification({ type: 'error', message: '품목구분은 필수입니다.' });
      return;
    }
    
    // 코드 중복 검증
    if (products.some(p => p.code === newProduct.code)) {
      setNotification({ type: 'error', message: '이미 존재하는 제품 코드입니다. 다른 코드를 사용해주세요.' });
      return;
    }
    
    try {
      let imageUrl = newProduct.image;
      
      // Base64 이미지인 경우 Azure Blob Storage에 업로드
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageUrl,
            fileName: `product-${newProduct.code}${Date.now()}.jpg`,
          }),
        });
        
        const result = await uploadResponse.json();
        if (result.success) {
          imageUrl = result.data.url;
        } else {
          setNotification({ type: 'error', message: '이미지 업로드 실패: ' + result.message });
          return;
        }
      }
      
      addProduct({ ...newProduct, image: imageUrl });
    setShowAddModal(false);
      setValidationErrors({});
    setNewProduct({
      code: "",
      name: "",
      category: "제품",
      specification: "",
      unit: "EA",
      standardCost: 0,
      sellingPrice: 0,
      customer: "",
      description: "",
      image: "",
      status: "active"
    });
      setNotification({ type: 'success', message: '제품이 추가되었습니다.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('제품 추가 오류:', error);
      setNotification({ type: 'error', message: error.message || '제품 추가에 실패했습니다.' });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    // 필수 항목 검증
    if (!editingProduct.code || !editingProduct.code.trim()) {
      setNotification({ type: 'error', message: '제품 코드는 필수입니다.' });
      return;
    }
    if (!editingProduct.name || !editingProduct.name.trim()) {
      setNotification({ type: 'error', message: '제품명은 필수입니다.' });
      return;
    }
    if (!editingProduct.category) {
      setNotification({ type: 'error', message: '품목구분은 필수입니다.' });
      return;
    }
    
    // 코드 중복 검증 (자신 제외)
    if (products.some(p => p.code === editingProduct.code && p.id !== editingProduct.id)) {
      setNotification({ type: 'error', message: '이미 존재하는 제품 코드입니다. 다른 코드를 사용해주세요.' });
      return;
    }
    
    try {
      let imageUrl = editingProduct.image;
      
      // Base64 이미지인 경우 Azure Blob Storage에 업로드
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageUrl,
            fileName: `product-${editingProduct.code}${Date.now()}.jpg`,
          }),
        });
        
        const result = await uploadResponse.json();
        if (result.success) {
          imageUrl = result.data.url;
        } else {
          setNotification({ type: 'error', message: '이미지 업로드 실패: ' + result.message });
          return;
        }
      }
      
      const updatedProduct = { ...editingProduct, image: imageUrl };
      updateProduct(updatedProduct.id, updatedProduct);
    setShowEditModal(false);
    setEditingProduct(null);
      setEditValidationErrors({});
      if (selectedProduct?.id === updatedProduct.id) {
        setSelectedProduct(updatedProduct);
      }
      setNotification({ type: 'success', message: '제품 정보가 수정되었습니다.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('제품 수정 오류:', error);
      setNotification({ type: 'error', message: error.message || '제품 수정에 실패했습니다.' });
    }
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    if (confirm(`"${selectedProduct.name}" 제품을 삭제하시겠습니까?`)) {
      deleteProduct(selectedProduct.id);
      setSelectedProduct(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["제품코드", "제품명", "품목구분", "규격", "단위", "표준원가", "판매단가", "고객사", "설명", "사용유무", "생성일시"],
      ...filteredProducts.map((product: Product) => [
        product.code,
        product.name,
        product.category,
        product.specification,
        product.unit,
        product.standardCost,
        product.sellingPrice,
        product.customer,
        product.description,
        product.status === "active" ? "사용" : "미사용",
        product.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "제품정보");
    XLSX.writeFile(workbook, `제품정보_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">제품정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">제품 정보를 관리합니다.</p>
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
                  if (!selectedProduct) {
                    alert("수정할 제품을 선택해주세요.");
                    return;
                  }
                  setEditingProduct({ ...selectedProduct });
                  setEditValidationErrors({});
                  setShowEditModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteProduct}
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
            placeholder="제품명, 코드, 규격, 고객사로 검색..."
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
        {/* 제품 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">제품코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">제품명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">품목구분</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">규격</th>
                  <th className="hidden 2xl:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">단위</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">고객사</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap">판매단가</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      등록된 제품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product: Product) => (
                    <tr
                      key={product.id}
                      onClick={() => {
                        console.log('🔵 제품 클릭됨:', product.code, product.name);
                        console.log('📸 이미지 URL:', product.image);
                        console.log('📏 URL 길이:', product.image?.length || 0);
                        console.log('🆔 제품 ID:', product.id);
                        setSelectedProduct(product);
                      }}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedProduct?.id === product.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{product.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.category === "제품" ? "bg-blue-100 text-blue-700" :
                          product.category === "반제품" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="hidden xl:table-cell px-4 py-3 text-sm">{product.specification}</td>
                      <td className="hidden 2xl:table-cell px-4 py-3 text-sm">{product.unit}</td>
                      <td className="px-4 py-3 text-sm">{product.customer}</td>
                      <td className="px-4 py-3 text-sm text-right">{product.sellingPrice ? product.sellingPrice.toLocaleString() : '0'}원</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            product.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 제품 세부정보 */}
        <div className="bg-white rounded-lg border border-black/10 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <h2 className="text-lg font-semibold mb-4">제품 세부사항</h2>
          {selectedProduct ? (
            <div className="space-y-4">
              {/* 제품 이미지 */}
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {(() => {
                  console.log('🖼️ 이미지 렌더링 시작');
                  console.log('📍 selectedProduct.id:', selectedProduct.id);
                  console.log('📍 selectedProduct.image:', selectedProduct.image);
                  console.log('📍 image 존재 여부:', !!selectedProduct.image);
                  return null;
                })()}
                {selectedProduct.image ? (
                  <img
                    key={selectedProduct.id}
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log('✅ 이미지 로드 성공:', selectedProduct.image);
                    }}
                    onError={(e) => {
                      console.error('❌ 이미지 로드 실패:', selectedProduct.image);
                      console.error('❌ 에러 이벤트:', e);
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">이미지 로드 실패</text></svg>';
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm">이미지 없음</div>
                )}
              </div>
              
              {/* 제품 정보 2열 */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">제품코드</label>
                  <p className="text-sm mt-1">{selectedProduct.code}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">제품명</label>
                  <p className="text-sm mt-1">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">품목구분</label>
                  <p className="text-sm mt-1">{selectedProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">단위</label>
                  <p className="text-sm mt-1">{selectedProduct.unit}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">규격</label>
                  <p className="text-sm mt-1">{selectedProduct.specification}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">표준원가</label>
                  <p className="text-sm mt-1">{selectedProduct.standardCost ? selectedProduct.standardCost.toLocaleString() : '0'}원</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">판매단가</label>
                  <p className="text-sm mt-1">{selectedProduct.sellingPrice ? selectedProduct.sellingPrice.toLocaleString() : '0'}원</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">고객사</label>
                  <p className="text-sm mt-1">{selectedProduct.customer || "-"}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">설명</label>
                  <p className="text-sm mt-1">{selectedProduct.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">사용유무</label>
                  <p className="text-sm mt-1">
                    {selectedProduct.status === "active" ? "사용" : "미사용"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">생성일시</label>
                  <p className="text-sm mt-1">{selectedProduct.createdAt}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">수정일시</label>
                  <p className="text-sm mt-1">{selectedProduct.modifiedAt || "-"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              제품을 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 제품 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품코드 *</label>
                  <input
                    type="text"
                    value={newProduct.code}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, code: e.target.value });
                      validateNewProduct('code', e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="예: PROD001"
                  />
                  {validationErrors.code && <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명 *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, name: e.target.value });
                      validateNewProduct('name', e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="예: 스마트폰 케이스"
                  />
                  {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품목구분</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as Product["category"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="제품">제품</option>
                    <option value="반제품">반제품</option>
                    <option value="상품">상품</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">규격</label>
                  <input
                    type="text"
                    value={newProduct.specification}
                    onChange={(e) => setNewProduct({ ...newProduct, specification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 150x75x10mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: EA, SET, KG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">표준원가</label>
                  <input
                    type="number"
                    value={newProduct.standardCost}
                    onChange={(e) => setNewProduct({ ...newProduct, standardCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">판매단가</label>
                  <input
                    type="number"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
                  <select
                    value={newProduct.customer}
                    onChange={(e) => setNewProduct({ ...newProduct, customer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">고객사 선택</option>
                    {customerList.map((customer: Customer) => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="제품 설명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 이미지</label>
                  {newProduct.image && (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img
                          src={newProduct.image}
                          alt="제품 이미지"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, image: "" })}
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
                          setNewProduct({ ...newProduct, image: event.target?.result as string });
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
                  onClick={handleAddProduct}
                  disabled={!isNewProductValid()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setValidationErrors({});
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

      {/* 수정 모달 */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">제품 수정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품코드 *</label>
                  <input
                    type="text"
                    value={editingProduct.code}
                    onChange={(e) => {
                      setEditingProduct({ ...editingProduct, code: e.target.value });
                      validateEditProduct('code', e.target.value, editingProduct.id);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      editValidationErrors.code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {editValidationErrors.code && <p className="mt-1 text-sm text-red-600">{editValidationErrors.code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명 *</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => {
                      setEditingProduct({ ...editingProduct, name: e.target.value });
                      validateEditProduct('name', e.target.value, editingProduct.id);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      editValidationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {editValidationErrors.name && <p className="mt-1 text-sm text-red-600">{editValidationErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품목구분</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as Product["category"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="제품">제품</option>
                    <option value="반제품">반제품</option>
                    <option value="상품">상품</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">규격</label>
                  <input
                    type="text"
                    value={editingProduct.specification}
                    onChange={(e) => setEditingProduct({ ...editingProduct, specification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">표준원가</label>
                  <input
                    type="number"
                    value={editingProduct.standardCost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, standardCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">판매단가</label>
                  <input
                    type="number"
                    value={editingProduct.sellingPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
                  <select
                    value={editingProduct.customer}
                    onChange={(e) => setEditingProduct({ ...editingProduct, customer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">고객사 선택</option>
                    {customerList.map((customer: Customer) => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 이미지</label>
                  {editingProduct.image && (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img
                          src={editingProduct.image}
                          alt="제품 이미지"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image: "" })}
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
                          setEditingProduct({ ...editingProduct, image: event.target?.result as string });
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
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as Product["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">사용</option>
                    <option value="inactive">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateProduct}
                  disabled={!isEditProductValid()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    setEditValidationErrors({});
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

      {/* Notification */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`px-6 py-4 rounded-lg shadow-xl pointer-events-auto ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium">{notification.message}</span>
              {notification.type === 'error' && (
                <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-white hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

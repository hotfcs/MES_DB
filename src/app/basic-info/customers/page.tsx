"use client";

import { useState } from "react";
import { useCustomersStore, type Customer } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore-optimized";
import * as XLSX from "xlsx";

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomersStore();
  const { user: currentUser } = useAuth();
  const { roles } = useRolesStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "공급업체" | "고객사" | "협력업체">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // 실시간 검증 에러 상태
  const [validationErrors, setValidationErrors] = useState<{
    code?: string;
    name?: string;
    type?: string;
  }>({});
  
  const [editValidationErrors, setEditValidationErrors] = useState<{
    code?: string;
    name?: string;
    type?: string;
  }>({});
  
  const [newCustomer, setNewCustomer] = useState<{
    code: string;
    name: string;
    type: Customer["type"];
    representative: string;
    businessNumber: string;
    phone: string;
    email: string;
    address: string;
    manager: string;
    managerPhone: string;
    status: Customer["status"];
  }>({
    code: "",
    name: "",
    type: "고객사",
    representative: "",
    businessNumber: "",
    phone: "",
    email: "",
    address: "",
    manager: "",
    managerPhone: "",
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
    return permissions.includes("CUSTOMERS_EDIT") || permissions.includes('ALL');
  };

  // 실시간 검증 함수
  const validateNewCustomer = (field: string, value: any) => {
    const errors: typeof validationErrors = { ...validationErrors };
    
    if (field === 'code') {
      if (!value || value.trim() === '') {
        errors.code = '거래처 코드는 필수입니다.';
      } else if (customers.some(c => c.code === value)) {
        errors.code = '이미 존재하는 코드입니다.';
      } else {
        delete errors.code;
      }
    }
    
    if (field === 'name') {
      if (!value || value.trim() === '') {
        errors.name = '거래처명은 필수입니다.';
      } else {
        delete errors.name;
      }
    }
    
    if (field === 'type') {
      if (!value) {
        errors.type = '거래처 구분은 필수입니다.';
      } else {
        delete errors.type;
      }
    }
    
    setValidationErrors(errors);
  };
  
  const validateEditCustomer = (field: string, value: any, currentId: number) => {
    const errors: typeof editValidationErrors = { ...editValidationErrors };
    
    if (field === 'code') {
      if (!value || value.trim() === '') {
        errors.code = '거래처 코드는 필수입니다.';
      } else if (customers.some(c => c.code === value && c.id !== currentId)) {
        errors.code = '이미 존재하는 코드입니다.';
      } else {
        delete errors.code;
      }
    }
    
    if (field === 'name') {
      if (!value || value.trim() === '') {
        errors.name = '거래처명은 필수입니다.';
      } else {
        delete errors.name;
      }
    }
    
    if (field === 'type') {
      if (!value) {
        errors.type = '거래처 구분은 필수입니다.';
      } else {
        delete errors.type;
      }
    }
    
    setEditValidationErrors(errors);
  };
  
  const isNewCustomerValid = () => {
    return newCustomer.code && newCustomer.name && newCustomer.type && 
           Object.keys(validationErrors).length === 0;
  };
  
  const isEditCustomerValid = () => {
    return editingCustomer?.code && editingCustomer?.name && editingCustomer?.type && 
           Object.keys(editValidationErrors).length === 0;
  };

  const filteredCustomers = customers.filter((customer: Customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.representative.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || customer.type === typeFilter;
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddCustomer = async () => {
    // 필수 항목 검증
    if (!newCustomer.code || !newCustomer.code.trim()) {
      setNotification({ type: 'error', message: '거래처 코드는 필수입니다.' });
      return;
    }
    if (!newCustomer.name || !newCustomer.name.trim()) {
      setNotification({ type: 'error', message: '거래처명은 필수입니다.' });
      return;
    }
    if (!newCustomer.type) {
      setNotification({ type: 'error', message: '거래처 구분은 필수입니다.' });
      return;
    }
    
    // 코드 중복 검증
    if (customers.some(c => c.code === newCustomer.code)) {
      setNotification({ type: 'error', message: '이미 존재하는 거래처 코드입니다. 다른 코드를 사용해주세요.' });
      return;
    }
    
    try {
      await addCustomer(newCustomer);
      setShowAddModal(false);
      setValidationErrors({});
      setNewCustomer({
        code: "",
        name: "",
        type: "고객사",
        representative: "",
        businessNumber: "",
        phone: "",
        email: "",
        address: "",
        manager: "",
        managerPhone: "",
        status: "active"
      });
      setNotification({ type: 'success', message: '거래처가 추가되었습니다.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || '거래처 추가에 실패했습니다.' });
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    
    // 필수 항목 검증
    if (!editingCustomer.code || !editingCustomer.code.trim()) {
      setNotification({ type: 'error', message: '거래처 코드는 필수입니다.' });
      return;
    }
    if (!editingCustomer.name || !editingCustomer.name.trim()) {
      setNotification({ type: 'error', message: '거래처명은 필수입니다.' });
      return;
    }
    if (!editingCustomer.type) {
      setNotification({ type: 'error', message: '거래처 구분은 필수입니다.' });
      return;
    }
    
    // 코드 중복 검증 (자신 제외)
    if (customers.some(c => c.code === editingCustomer.code && c.id !== editingCustomer.id)) {
      setNotification({ type: 'error', message: '이미 존재하는 거래처 코드입니다. 다른 코드를 사용해주세요.' });
      return;
    }
    
    try {
      await updateCustomer(editingCustomer.id, editingCustomer);
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditValidationErrors({});
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(editingCustomer);
      }
      setNotification({ type: 'success', message: '거래처 정보가 수정되었습니다.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || '거래처 수정에 실패했습니다.' });
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    if (confirm(`"${selectedCustomer.name}" 거래처를 삭제하시겠습니까?`)) {
      deleteCustomer(selectedCustomer.id);
      setSelectedCustomer(null);
    }
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["거래처코드", "거래처명", "거래처구분", "대표자명", "사업자번호", "전화번호", "이메일", "주소", "담당자", "담당자연락처", "사용유무", "생성일시"],
      ...filteredCustomers.map((customer: Customer) => [
        customer.code,
        customer.name,
        customer.type,
        customer.representative,
        customer.businessNumber,
        customer.phone,
        customer.email,
        customer.address,
        customer.manager,
        customer.managerPhone,
        customer.status === "active" ? "사용" : "미사용",
        customer.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "거래처정보");
    XLSX.writeFile(workbook, `거래처정보_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">거래처정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">거래처 정보를 관리합니다.</p>
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
                  if (!selectedCustomer) {
                    alert("수정할 거래처를 선택해주세요.");
                    return;
                  }
                  setEditingCustomer({ ...selectedCustomer });
                  setEditValidationErrors({});
                  setShowEditModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteCustomer}
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
            placeholder="거래처명, 코드, 대표자, 담당자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 거래처구분</option>
            <option value="공급업체">공급업체</option>
            <option value="고객사">고객사</option>
            <option value="협력업체">협력업체</option>
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
        {/* 거래처 목록 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">거래처코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">거래처명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">거래처구분</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">대표자명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">연락처</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      등록된 거래처가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer: Customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedCustomer?.id === customer.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{customer.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{customer.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          customer.type === "공급업체" ? "bg-blue-100 text-blue-700" :
                          customer.type === "고객사" ? "bg-green-100 text-green-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {customer.type}
                        </span>
                      </td>
                      <td className="hidden xl:table-cell px-4 py-3 text-sm">{customer.representative}</td>
                      <td className="px-4 py-3 text-sm">{customer.manager}</td>
                      <td className="px-4 py-3 text-sm">{customer.phone}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            customer.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {customer.status === "active" ? "사용" : "미사용"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 거래처 세부정보 */}
    <div className="bg-white rounded-lg border border-black/10 p-4">
          <h2 className="text-lg font-semibold mb-4">거래처 세부사항</h2>
          {selectedCustomer ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">거래처코드</label>
                <p className="text-sm mt-1">{selectedCustomer.code}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">거래처명</label>
                <p className="text-sm mt-1">{selectedCustomer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">거래처구분</label>
                <p className="text-sm mt-1">{selectedCustomer.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">대표자명</label>
                <p className="text-sm mt-1">{selectedCustomer.representative}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">사업자번호</label>
                <p className="text-sm mt-1">{selectedCustomer.businessNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">전화번호</label>
                <p className="text-sm mt-1">{selectedCustomer.phone}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">이메일</label>
                <p className="text-sm mt-1">{selectedCustomer.email}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">주소</label>
                <p className="text-sm mt-1">{selectedCustomer.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">담당자</label>
                <p className="text-sm mt-1">{selectedCustomer.manager}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">담당자연락처</label>
                <p className="text-sm mt-1">{selectedCustomer.managerPhone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">사용유무</label>
                <p className="text-sm mt-1">
                  {selectedCustomer.status === "active" ? "사용" : "미사용"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">생성일시</label>
                <p className="text-sm mt-1">{selectedCustomer.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">수정일시</label>
                <p className="text-sm mt-1">{selectedCustomer.modifiedAt || "-"}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              거래처를 선택하면 상세 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 거래처 추가</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래처코드 *</label>
                <input
                  type="text"
                  value={newCustomer.code}
                  onChange={(e) => {
                    setNewCustomer({ ...newCustomer, code: e.target.value });
                    validateNewCustomer('code', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.code 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="예: CUST001"
                />
                {validationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래처명 *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => {
                    setNewCustomer({ ...newCustomer, name: e.target.value });
                    validateNewCustomer('name', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="예: (주)삼성전자"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래처구분 *</label>
                <select
                  value={newCustomer.type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value as Customer["type"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="공급업체">공급업체</option>
                  <option value="고객사">고객사</option>
                  <option value="협력업체">협력업체</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                <input
                  type="text"
                  value={newCustomer.representative}
                  onChange={(e) => setNewCustomer({ ...newCustomer, representative: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 김대표"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
                <input
                  type="text"
                  value={newCustomer.businessNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, businessNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 123-45-67890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 02-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: contact@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울시 강남구 테헤란로 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <input
                  type="text"
                  value={newCustomer.manager}
                  onChange={(e) => setNewCustomer({ ...newCustomer, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 박담당"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자연락처</label>
                <input
                  type="text"
                  value={newCustomer.managerPhone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, managerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 010-1234-5678"
                />
              </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddCustomer}
                  disabled={!isNewCustomerValid()}
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
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">거래처 수정</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래처코드 *</label>
                <input
                  type="text"
                  value={editingCustomer.code}
                  onChange={(e) => {
                    setEditingCustomer({ ...editingCustomer, code: e.target.value });
                    validateEditCustomer('code', e.target.value, editingCustomer.id);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    editValidationErrors.code 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {editValidationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{editValidationErrors.code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래처명 *</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => {
                    setEditingCustomer({ ...editingCustomer, name: e.target.value });
                    validateEditCustomer('name', e.target.value, editingCustomer.id);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    editValidationErrors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {editValidationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{editValidationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래처구분 *</label>
                <select
                  value={editingCustomer.type}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, type: e.target.value as Customer["type"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="공급업체">공급업체</option>
                  <option value="고객사">고객사</option>
                  <option value="협력업체">협력업체</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                <input
                  type="text"
                  value={editingCustomer.representative}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, representative: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
                <input
                  type="text"
                  value={editingCustomer.businessNumber}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, businessNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <input
                  type="text"
                  value={editingCustomer.manager}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자연락처</label>
                <input
                  type="text"
                  value={editingCustomer.managerPhone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, managerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                <select
                  value={editingCustomer.status}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as Customer["status"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">사용</option>
                  <option value="inactive">미사용</option>
                </select>
              </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateCustomer}
                  disabled={!isEditCustomerValid()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
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

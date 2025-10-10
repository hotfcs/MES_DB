"use client";

import { useState } from "react";
import * as XLSX from 'xlsx';
import { useRolesStore, Role } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";

export default function RolesPage() {
  const { roles, addRole, updateRole, deleteRole } = useRolesStore();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState({
    code: "",
    name: "",
    permissions: [] as string[]
  });

  const menuList = [
    { id: 1, name: "기본정보", code: "BASIC_INFO", parentId: null, level: 1 },
    { id: 2, name: "사용자정보", code: "USERS", parentId: 1, level: 2 },
    { id: 3, name: "사용자권한", code: "ROLES", parentId: 1, level: 2 },
    { id: 4, name: "부서정보", code: "DEPARTMENTS", parentId: 1, level: 2 },
    { id: 5, name: "로그인이력", code: "LOGIN_HISTORY", parentId: 1, level: 2 },
    { id: 6, name: "거래처정보", code: "CUSTOMERS", parentId: 1, level: 2 },
    { id: 7, name: "제품정보", code: "PRODUCTS", parentId: 1, level: 2 },
    { id: 8, name: "자재정보", code: "MATERIALS", parentId: 1, level: 2 },
    { id: 9, name: "라인정보", code: "LINES", parentId: 1, level: 2 },
    { id: 10, name: "설비정보", code: "EQUIPMENTS", parentId: 1, level: 2 },
    { id: 11, name: "공정정보", code: "PROCESSES", parentId: 1, level: 2 },
    { id: 12, name: "창고정보", code: "WAREHOUSES", parentId: 1, level: 2 },
    { id: 13, name: "라우팅정보", code: "ROUTINGS", parentId: 1, level: 2 },
    { id: 14, name: "BOM정보", code: "BOM", parentId: 1, level: 2 },
    { id: 15, name: "생산관리", code: "PRODUCTION", parentId: null, level: 1 },
    { id: 16, name: "생산계획", code: "PRODUCTION_PLAN", parentId: 15, level: 2 },
    { id: 17, name: "작업지시", code: "WORK_ORDER", parentId: 15, level: 2 }
  ];

  const [menuPermissions, setMenuPermissions] = useState<{[key: number]: {view: boolean, edit: boolean}}>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Check user permissions
  const getUserPermissions = () => {
    if (!currentUser) return [];
    if (currentUser.role === '시스템관리자' || currentUser.role === '관리자' || currentUser.role === 'admin') {
      return ['ALL'];
    }
    const userRole = roles.find(role => role.name === currentUser.role);
    return userRole ? userRole.permissions : [];
  };

  const hasEditPermission = () => {
    if (!currentUser) return false;
    if (currentUser.role === '시스템관리자' || currentUser.role === '관리자' || currentUser.role === 'admin') {
      return true;
    }
    const permissions = getUserPermissions();
    return permissions.includes("ROLES_EDIT") || permissions.includes('ALL');
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddRole = () => {
    if (newRole.code && newRole.name) {
      addRole({
        code: newRole.code,
        name: newRole.name,
        description: "",
        permissions: newRole.permissions,
        status: "active"
      });
      setNewRole({ 
        code: "", 
        name: "", 
        permissions: []
      });
      setShowAddModal(false);
    }
  };

  const handleDeleteRole = () => {
    if (selectedRole) {
      deleteRole(selectedRole.id);
      setSelectedRole(null);
      setMenuPermissions({});
    }
  };

  const handleSaveMenuPermissions = () => {
    if (selectedRole) {
      try {
        // 메뉴 권한을 permissions 배열에 저장
        const newPermissions: string[] = [];
        Object.entries(menuPermissions).forEach(([menuId, perms]) => {
          const menu = menuList.find(m => m.id === parseInt(menuId));
          if (menu) {
            if (perms.view) {
              newPermissions.push(`${menu.code}_VIEW`);
            }
            if (perms.edit) {
              newPermissions.push(`${menu.code}_EDIT`);
            }
          }
        });

        updateRole(selectedRole.id, {
          ...selectedRole,
          permissions: newPermissions
        });

        // 성공 알림 표시
        setNotification({
          type: 'success',
          message: '저장완료.'
        });

        // 0.5초 후 알림 자동 제거
        setTimeout(() => {
          setNotification(null);
        }, 500);

      } catch (error) {
        // 실패 알림 표시
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setNotification({
          type: 'error',
          message: errorMessage
        });

        // 실패 시 자동 닫기 없음 (수동으로만 닫기 가능)
      }
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    // 기존 권한을 메뉴 권한으로 변환
    const newMenuPermissions: {[key: number]: {view: boolean, edit: boolean}} = {};
    menuList.forEach(menu => {
      newMenuPermissions[menu.id] = {
        view: role.permissions.includes(`${menu.code}_VIEW`),
        edit: role.permissions.includes(`${menu.code}_EDIT`)
      };
    });
    setMenuPermissions(newMenuPermissions);
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["권한코드", "권한명", "설명", "사용유무", "생성일"],
      ...filteredRoles.map(role => [
        role.code,
        role.name,
        role.description,
        role.status === "active" ? "사용" : "미사용",
        role.createdAt
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "권한목록");
    XLSX.writeFile(workbook, "권한목록.xlsx");
  };

  const toggleMenuPermission = (menuId: number, type: 'view' | 'edit') => {
    const menu = menuList.find(m => m.id === menuId);
    if (!menu) return;

    const newValue = !menuPermissions[menuId]?.[type];
    
    setMenuPermissions(prev => {
      const newPermissions = { ...prev };
      
      // 현재 메뉴의 권한 업데이트
      newPermissions[menuId] = {
        ...newPermissions[menuId],
        [type]: newValue
      };

      // 대메뉴인 경우 하위 소메뉴들도 함께 업데이트
      if (menu.level === 1) {
        const subMenus = menuList.filter(m => m.parentId === menuId);
        subMenus.forEach(subMenu => {
          newPermissions[subMenu.id] = {
            ...newPermissions[subMenu.id],
            [type]: newValue
          };
        });
      }

      return newPermissions;
    });
  };

  return (
    <div className="space-y-4">
      {/* 알림 메시지 */}
      {notification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-sm mx-4 ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">사용자권한 관리</h1>
            <p className="text-sm text-gray-600 mt-1">시스템 사용자 권한을 관리합니다.</p>
          </div>
          {hasEditPermission() && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-32"
              >
                ➕ 권한추가
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={!selectedRole}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-32"
              >
                🗑️ 권한삭제
              </button>
              <button
                onClick={handleSaveMenuPermissions}
                disabled={!selectedRole}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-32"
              >
                💾 저장
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

      {/* 검색 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="권한명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            총 {filteredRoles.length}개 권한
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 권한 목록 (좌측) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">권한코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">권한명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoles.map((role) => (
                  <tr 
                    key={role.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedRole?.id === role.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{role.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{role.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 메뉴 권한 관리 (우측) */}
        <div className="lg:col-span-1">
          {selectedRole ? (
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <h3 className="text-lg font-bold mb-4">메뉴 권한 관리</h3>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  <strong>{selectedRole.name}</strong> 권한의 메뉴 접근 권한을 설정합니다.
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">메뉴명</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">조회</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">편집</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {menuList.map((menu) => (
                        <tr key={menu.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-gray-900">
                            <div className={`${menu.level === 1 ? 'font-semibold text-gray-800' : 'text-gray-600'} ${menu.level === 2 ? 'pl-4' : ''}`}>
                              {menu.level === 2 && '└ '}
                              {menu.name}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={menu.level === 1 
                                ? menuList.filter(m => m.parentId === menu.id).every(subMenu => menuPermissions[subMenu.id]?.view)
                                : (menuPermissions[menu.id]?.view || false)
                              }
                              onChange={() => toggleMenuPermission(menu.id, 'view')}
                              className="rounded"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={menu.level === 1 
                                ? menuList.filter(m => m.parentId === menu.id).every(subMenu => menuPermissions[subMenu.id]?.edit)
                                : (menuPermissions[menu.id]?.edit || false)
                              }
                              onChange={() => toggleMenuPermission(menu.id, 'edit')}
                              className="rounded"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-center text-gray-500 py-8">
                권한을 선택하면 메뉴 권한을 설정할 수 있습니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 권한 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 권한 추가</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한코드 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newRole.code}
                  onChange={(e) => setNewRole({...newRole, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: ADMIN, USER"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddRole}
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

    </div>
  );
}



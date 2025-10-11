"use client";

import { useState } from "react";
import Image from "next/image";
import * as XLSX from 'xlsx';
import { useUsersStore, useDepartmentsStore, useRolesStore, User } from "@/store/dataStore-optimized";
import { useAuth } from "@/store/authStore";

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useUsersStore();
  const { departments } = useDepartmentsStore();
  const { roles } = useRolesStore();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const isNewUserValid = () => {
    return newUser.account && newUser.password && newUser.name && newUser.role && newUser.department;
  };
  
  const isEditUserValid = () => {
    return editingUser?.account && editingUser?.password && editingUser?.name && editingUser?.role && editingUser?.department;
  };
  
  const [newUser, setNewUser] = useState({
    account: "",
    password: "",
    name: "",
    role: "일반사용자",
    department: "",
    position: "",
    phone: "",
    email: "",
    status: "active" as "active" | "inactive",
    image: "",
    joinDate: "",
    resignDate: ""
  });

  // Check user permissions
  const getUserPermissions = () => {
    if (!currentUser) return [];
    // 시스템관리자는 모든 권한
    if (currentUser.role === '시스템관리자' || currentUser.role === '관리자' || currentUser.role === 'admin') {
      return ['ALL'];
    }
    const userRole = roles.find(role => role.name === currentUser.role);
    return userRole ? userRole.permissions : [];
  };

  const hasEditPermission = () => {
    if (!currentUser) return false;
    // 시스템관리자는 모든 권한
    if (currentUser.role === '시스템관리자' || currentUser.role === '관리자' || currentUser.role === 'admin') {
      return true;
    }
    const permissions = getUserPermissions();
    return permissions.includes("USERS_EDIT") || permissions.includes('ALL');
  };

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddUser = async () => {
    // 필수 항목 검증
    if (!newUser.account || !newUser.account.trim()) {
      setNotification({ type: 'error', message: '사용자 계정은 필수입니다.' });
      return;
    }
    if (!newUser.password || !newUser.password.trim()) {
      setNotification({ type: 'error', message: '비밀번호는 필수입니다.' });
      return;
    }
    if (!newUser.name || !newUser.name.trim()) {
      setNotification({ type: 'error', message: '사용자명은 필수입니다.' });
      return;
    }
    if (!newUser.role) {
      setNotification({ type: 'error', message: '사용자권한은 필수입니다.' });
      return;
    }
    if (!newUser.department || !newUser.department.trim()) {
      setNotification({ type: 'error', message: '부서는 필수입니다.' });
      return;
    }
    
    // 계정 중복 검증
    if (users.some((u: User) => u.account === newUser.account)) {
      setNotification({ type: 'error', message: '이미 존재하는 사용자 계정입니다. 다른 계정명을 사용해주세요.' });
      return;
    }
    
    try {
      let imageUrl = newUser.image;
      
      // Base64 이미지인 경우 Azure Blob Storage에 업로드
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageUrl,
            fileName: `user-${newUser.account}${Date.now()}.jpg`,
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
      
      addUser({
        account: newUser.account,
        password: newUser.password || "",
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        position: newUser.position,
        phone: newUser.phone,
        email: newUser.email || "",
        status: newUser.status,
        image: imageUrl,
        lastLogin: "신규",
        joinDate: newUser.joinDate || new Date().toISOString().split('T')[0],
        resignDate: newUser.resignDate
      });
      setNewUser({ 
        account: "", 
        password: "", 
        name: "",
        role: "일반사용자", 
        department: "", 
        position: "", 
        phone: "", 
        email: "", 
        status: "active" as "active" | "inactive", 
        image: "",
        joinDate: "",
        resignDate: ""
      });
      setShowAddModal(false);
      setNotification({ type: 'success', message: '사용자가 추가되었습니다.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: unknown) {
      console.error('사용자 추가 오류:', error);
      setNotification({ type: 'error', message: (error as Error).message || '사용자 추가에 실패했습니다.' });
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    // 필수 항목 검증
    if (!editingUser.account || !editingUser.account.trim()) {
      setNotification({ type: 'error', message: '사용자 계정은 필수입니다.' });
      return;
    }
    if (!editingUser.password || !editingUser.password.trim()) {
      setNotification({ type: 'error', message: '비밀번호는 필수입니다.' });
      return;
    }
    if (!editingUser.name || !editingUser.name.trim()) {
      setNotification({ type: 'error', message: '사용자명은 필수입니다.' });
      return;
    }
    if (!editingUser.role) {
      setNotification({ type: 'error', message: '사용자권한은 필수입니다.' });
      return;
    }
    if (!editingUser.department || !editingUser.department.trim()) {
      setNotification({ type: 'error', message: '부서는 필수입니다.' });
      return;
    }
    
    // 계정 중복 검증 (자신 제외)
    if (users.some((u: User) => u.account === editingUser.account && u.id !== editingUser.id)) {
      setNotification({ type: 'error', message: '이미 존재하는 사용자 계정입니다. 다른 계정명을 사용해주세요.' });
      return;
    }
    
    try {
      let imageUrl = editingUser.image;
      
      // Base64 이미지인 경우 Azure Blob Storage에 업로드
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageUrl,
            fileName: `user-${editingUser.account}${Date.now()}.jpg`,
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
        
        const updatedUser = { ...editingUser, image: imageUrl };
        updateUser(updatedUser.id, updatedUser);
      setEditingUser(null);
      setShowEditModal(false);
        setSelectedUser(updatedUser);
        setNotification({ type: 'success', message: '사용자 정보가 수정되었습니다.' });
        setTimeout(() => setNotification(null), 3000);
      } catch (error: unknown) {
        console.error('사용자 수정 오류:', error);
        setNotification({ type: 'error', message: (error as Error).message || '사용자 수정에 실패했습니다.' });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id);
      setSelectedUser(null);
    }
  };

  const handleExportExcel = () => {
    // XLSX 형식으로 엑셀 출력 (필터링된 데이터만)
    const worksheetData = [
      ["사용자계정", "사용자명", "사용자권한", "부서", "직급", "전화번호", "이메일", "사용유무", "마지막 로그인", "입사일", "퇴사일"],
      ...filteredUsers.map((user: User) => [
        user.account,
        user.name,
        user.role,
        user.department,
        user.position,
        user.phone,
        user.email,
        user.status === "active" ? "사용" : "미사용",
        user.lastLogin,
        user.joinDate || "",
        user.resignDate || ""
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "사용자목록");
    
    // XLSX 파일로 다운로드
    XLSX.writeFile(workbook, "사용자목록.xlsx");
  };

  const getInitials = (name: string) => {
    return name.split('').slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">사용자정보 관리</h1>
            <p className="text-sm text-gray-600 mt-1">시스템 사용자 계정을 관리합니다.</p>
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
                  if (selectedUser) {
                    setEditingUser(selectedUser);
                    setShowEditModal(true);
                  }
                }}
                disabled={!selectedUser}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-32"
              >
                ✏️ 수정
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={!selectedUser}
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
              placeholder="이름, 부서로 검색..."
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
            총 {filteredUsers.length}명
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 사용자 목록 (좌측) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">사용자계정</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">사용자명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">사용자권한</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">부서</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">직급</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">전화번호</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">이메일</th>
                  <th className="hidden 2xl:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">입사일</th>
                  <th className="hidden 2xl:table-cell px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">퇴사일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">사용유무</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user: User) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedUser?.id === user.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.account}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.department}</td>
                    <td className="hidden xl:table-cell px-4 py-3 text-sm text-gray-600">{user.position}</td>
                    <td className="hidden px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                    <td className="hidden px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="hidden 2xl:table-cell px-4 py-3 text-sm text-gray-600">{user.joinDate || "-"}</td>
                    <td className="hidden 2xl:table-cell px-4 py-3 text-sm text-gray-600">{user.resignDate || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {user.status === "active" ? "사용" : "미사용"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용자 세부사항 (우측) */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <h3 className="text-lg font-bold mb-4">사용자 세부사항</h3>
              
              {/* 사용자 이미지 */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-600 relative overflow-hidden">
                  {selectedUser.image ? (
                    <Image 
                      key={selectedUser.id}
                      src={selectedUser.image} 
                      alt={selectedUser.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span 
                      className="absolute inset-0 flex items-center justify-center text-center"
                      style={{ lineHeight: '1' }}
                    >
                      {selectedUser.name.length <= 3 ? selectedUser.name : getInitials(selectedUser.name)}
                    </span>
                  )}
                </div>
              </div>

              {/* 사용자 정보 */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">사용자계정</label>
                  <div className="text-sm text-gray-900">{selectedUser.account}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사용자비번</label>
                  <div className="text-sm text-gray-900">••••••••</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사용자명</label>
                  <div className="text-sm text-gray-900">{selectedUser.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사용자권한</label>
                  <div className="text-sm text-gray-900">{selectedUser.role}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">부서</label>
                  <div className="text-sm text-gray-900">{selectedUser.department}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">직급</label>
                  <div className="text-sm text-gray-900">{selectedUser.position}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">전화번호</label>
                  <div className="text-sm text-gray-900">{selectedUser.phone}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">이메일</label>
                  <div className="text-sm text-gray-900">{selectedUser.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사용유무</label>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedUser.status === "active" ? "사용" : "미사용"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사진</label>
                  <div className="text-sm text-gray-900">{selectedUser.image ? '등록됨' : '미등록'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">입사일</label>
                  <div className="text-sm text-gray-900">{selectedUser.joinDate || "정보 없음"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">퇴사일</label>
                  <div className="text-sm text-gray-900">{selectedUser.resignDate || "정보 없음"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">생성일시</label>
                  <div className="text-sm text-gray-900">{selectedUser.createdAt || "정보 없음"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">수정일시</label>
                  <div className="text-sm text-gray-900">{selectedUser.modifiedAt || "수정 이력 없음"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-black/10 p-4">
              <div className="text-center text-gray-500 py-8">
                사용자를 선택하면 세부사항이 표시됩니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">새 사용자 추가</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자계정 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newUser.account}
                  onChange={(e) => setNewUser({...newUser, account: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자비번 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자권한 <span className="text-red-500">*</span></label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.filter(role => role.status === "active").map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서 <span className="text-red-500">*</span></label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">부서를 선택하세요</option>
                  {departments.filter(dept => dept.status === "active").map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                <input
                  type="text"
                  value={newUser.position}
                  onChange={(e) => setNewUser({...newUser, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                <input
                  type="date"
                  value={newUser.joinDate}
                  onChange={(e) => setNewUser({...newUser, joinDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">퇴사일</label>
                <input
                  type="date"
                  value={newUser.resignDate}
                  onChange={(e) => setNewUser({...newUser, resignDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value as "active" | "inactive"})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">사용</option>
                  <option value="inactive">미사용</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사진</label>
                {newUser.image && (
                  <div className="mb-3">
                    <div className="relative inline-block w-32 h-32">
                      <Image
                        src={newUser.image}
                        alt="사용자 사진"
                        fill
                        className="rounded-lg object-cover border-2 border-gray-300 bg-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">이미지 로드 실패</text></svg>';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, image: "" })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="사진 삭제"
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
                        setNewUser({ ...newUser, image: event.target?.result as string });
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
                  onClick={handleAddUser}
                  disabled={!isNewUserValid()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
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

      {/* 사용자 수정 모달 */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">사용자 수정</h2>
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자계정 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingUser.account}
                  onChange={(e) => setEditingUser({...editingUser, account: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자비번 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자권한 <span className="text-red-500">*</span></label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.filter(role => role.status === "active").map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서 <span className="text-red-500">*</span></label>
                <select
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">부서를 선택하세요</option>
                  {departments.filter(dept => dept.status === "active").map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                <input
                  type="text"
                  value={editingUser.position}
                  onChange={(e) => setEditingUser({...editingUser, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                <input
                  type="date"
                  value={editingUser.joinDate || ""}
                  onChange={(e) => setEditingUser({...editingUser, joinDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">퇴사일</label>
                <input
                  type="date"
                  value={editingUser.resignDate || ""}
                  onChange={(e) => setEditingUser({...editingUser, resignDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용유무</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({...editingUser, status: e.target.value as "active" | "inactive"})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">사용</option>
                  <option value="inactive">미사용</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사진</label>
                {editingUser.image && (
                  <div className="mb-3">
                    <div className="relative inline-block w-32 h-32">
                      <Image
                        src={editingUser.image}
                        alt="사용자 사진"
                        fill
                        className="rounded-lg object-cover border-2 border-gray-300 bg-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">이미지 로드 실패</text></svg>';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, image: "" })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="사진 삭제"
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
                        setEditingUser({ ...editingUser, image: event.target?.result as string });
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
                  onClick={handleEditUser}
                  disabled={!isEditUserValid()}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
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



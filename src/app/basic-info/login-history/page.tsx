"use client";

import { useState } from "react";
import * as XLSX from 'xlsx';
import { useLoginHistoryStore, useUsersStore } from "@/store/dataStore-optimized";

export default function LoginHistoryPage() {
  const { loginHistory } = useLoginHistoryStore();
  const { users } = useUsersStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | "login" | "logout">("all");
  const [dateFilter, setDateFilter] = useState("");

  // 사용자별 부서 정보 가져오기
  const getUserDepartment = (account: string) => {
    const user = users.find(u => u.account === account);
    return user?.department || "-";
  };

  const filteredHistory = (() => {
    // 먼저 모든 필터 적용
    let filtered = loginHistory.filter(record => {
      const userDept = getUserDepartment(record.account);
      const matchesSearch = 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userDept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.ipAddress && record.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.hostName && record.hostName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAction = actionFilter === "all" || record.action === actionFilter;
      
      const matchesDate = !dateFilter || record.timestamp.startsWith(dateFilter);
      
      return matchesSearch && matchesAction && matchesDate;
    });

    // 날짜 필터가 없으면 최신 1000건만 반환
    if (!dateFilter) {
      filtered = filtered.slice(0, 1000);
    }

    return filtered;
  })();

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\. /g, '-').replace('.', '');
  };

  const handleExportExcel = () => {
    const worksheetData = [
      ["사용자명", "계정", "부서", "동작", "시간", "IP 주소", "Host명"],
      ...filteredHistory.map(record => [
        record.name,
        record.account,
        getUserDepartment(record.account),
        record.action === "login" ? "로그인" : "로그아웃",
        formatTimestamp(record.timestamp),
        record.ipAddress || "-",
        record.hostName || "-"
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "로그인이력");
    XLSX.writeFile(workbook, "로그인이력.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">로그인이력 관리</h1>
            <p className="text-sm text-gray-600 mt-1">시스템 사용자의 로그인/로그아웃 이력을 조회합니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {dateFilter 
                ? `총 ${filteredHistory.length}건` 
                : `최신 ${Math.min(filteredHistory.length, 1000)}건 (전체: ${loginHistory.length}건)`
              }
            </div>
            <button
              onClick={handleExportExcel}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-32"
            >
              📊 엑셀출력
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg border border-black/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="사용자명, 부서, IP, Host명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as "all" | "login" | "logout")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="login">로그인</option>
              <option value="logout">로그아웃</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="날짜를 선택하지 않으면 최신 1000건만 표시됩니다"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="날짜 필터 초기화"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {!dateFilter && (
          <div className="mt-2 text-xs text-blue-600">
            ℹ️ 날짜를 선택하지 않았습니다. 최신 1000건만 표시됩니다.
          </div>
        )}
      </div>

      {/* 로그인이력 목록 */}
      <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사용자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">부서</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">동작</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">시간</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP 주소</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Host명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    기록된 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-xs text-gray-500">{record.account}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getUserDepartment(record.account)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.action === "login"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {record.action === "login" ? "로그인" : "로그아웃"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{formatTimestamp(record.timestamp)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{record.ipAddress || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.hostName || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-black/10 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-600">총 로그인</div>
              <div className="text-lg font-bold text-green-600">
                {loginHistory.filter(r => r.action === "login").length}건
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-black/10 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-gray-600 text-lg">⏻</span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-600">총 로그아웃</div>
              <div className="text-lg font-bold text-gray-600">
                {loginHistory.filter(r => r.action === "logout").length}건
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-black/10 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-lg">📊</span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-600">전체 기록</div>
              <div className="text-lg font-bold text-blue-600">
                {loginHistory.length}건
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


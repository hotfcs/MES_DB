"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/store/authStore";
import { useRolesStore } from "@/store/dataStore";

type MenuItem = {
  label: string;
  href: string;
  permissionCode: string;
};

type MenuGroup = {
  label: string;
  icon: string;
  items: MenuItem[];
};

const MENU: MenuGroup[] = [
  {
    label: "기초정보관리",
    icon: "📋",
    items: [
      { label: "사용자정보", href: "/basic-info/users", permissionCode: "USERS" },
      { label: "사용자권한", href: "/basic-info/roles", permissionCode: "ROLES" },
      { label: "부서정보", href: "/basic-info/departments", permissionCode: "DEPARTMENTS" },
      { label: "로그인이력", href: "/basic-info/login-history", permissionCode: "LOGIN_HISTORY" },
      { label: "거래처정보", href: "/basic-info/customers", permissionCode: "CUSTOMERS" },
      { label: "제품정보", href: "/basic-info/products", permissionCode: "PRODUCTS" },
      { label: "자재정보", href: "/basic-info/materials", permissionCode: "MATERIALS" },
      { label: "라인정보", href: "/basic-info/lines", permissionCode: "LINES" },
      { label: "설비정보", href: "/basic-info/equipments", permissionCode: "EQUIPMENTS" },
      { label: "공정정보", href: "/basic-info/processes", permissionCode: "PROCESSES" },
      { label: "창고정보", href: "/basic-info/warehouses", permissionCode: "WAREHOUSES" },
      { label: "라우팅정보", href: "/basic-info/routings", permissionCode: "ROUTINGS" },
      { label: "BOM정보", href: "/basic-info/bom", permissionCode: "BOM" },
    ],
  },
  { 
    label: "생산관리", 
    icon: "🏭", 
    items: [
      { label: "생산계획", href: "/production/plan", permissionCode: "PRODUCTION_PLAN" },
      { label: "작업지시", href: "/production/work-order", permissionCode: "WORK_ORDER" },
    ] 
  },
];

interface SidebarProps {
  isVisible: boolean;
}

export default function Sidebar({ isVisible }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["기초정보관리", "생산관리"]);
  const { user } = useAuth();
  const { roles } = useRolesStore();

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupLabel)
        ? prev.filter((label) => label !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  // Get user's role permissions
  const getUserPermissions = () => {
    if (!user) return [];
    const userRole = roles.find(role => role.name === user.role);
    return userRole ? userRole.permissions : [];
  };

  // Check if user has permission for a menu item
  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    
    // 관리자 또는 시스템관리자는 모든 권한 허용
    if (user.role === '시스템관리자' || user.role === '관리자' || user.role === 'admin') {
      return true;
    }
    
    const permissions = getUserPermissions();
    
    // roles가 비어있으면 (DB에서 아직 로드 안됨) 모든 권한 허용
    if (roles.length === 0) {
      return true;
    }
    
    return permissions.includes(`${permissionCode}_VIEW`) || permissions.includes(`${permissionCode}_EDIT`);
  };

  // Filter menu items based on permissions
  const getFilteredMenu = () => {
    return MENU.map(group => ({
      ...group,
      items: group.items.filter(item => hasPermission(item.permissionCode))
    })).filter(group => group.items.length > 0); // Only show groups that have visible items
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="h-screen w-[260px] bg-[#1f2430] text-white flex flex-col">
      <div className="h-[64px] flex items-center justify-center px-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          방장손 포트폴리오
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {getFilteredMenu().map((group) => {
          const isExpanded = expandedGroups.includes(group.label);
          return (
            <div key={group.label} className="mb-2">
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-2">{group.icon}</span>
                  <span>{group.label}</span>
                </div>
                <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {isExpanded && (
                <ul className="space-y-0.5 ml-4">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={
                            "block px-4 py-2 text-sm rounded-r-full transition-colors " +
                            (active
                              ? "bg-white text-[#1f2430] font-semibold"
                              : "hover:bg-white/10 text-white/90")
                          }
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}



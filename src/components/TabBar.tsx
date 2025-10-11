"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = { label: string; href: string };

// URL 경로를 한글 메뉴명으로 매핑
const getMenuLabel = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    "/": "메인화면",
    "/basic-info/users": "사용자정보",
    "/basic-info/roles": "사용자권한",
    "/basic-info/departments": "부서정보",
    "/basic-info/login-history": "로그인이력",
    "/basic-info/customers": "거래처정보",
    "/basic-info/products": "제품정보",
    "/basic-info/materials": "자재정보",
    "/basic-info/lines": "라인정보",
    "/basic-info/equipments": "설비정보",
    "/basic-info/processes": "공정정보",
    "/basic-info/warehouses": "창고정보",
    "/basic-info/routings": "라우팅정보",
    "/basic-info/bom": "BOM정보",
    "/production/plan": "생산계획",
    "/production/work-order": "작업지시",
  };
  
  return pathMap[pathname] || pathname.split("/").filter(Boolean).slice(-1)[0] || "메인화면";
};

export default function TabBar() {
  const pathname = usePathname();
  const [tabs, setTabs] = useState<Tab[]>([{ label: "메인화면", href: "/" }]);

  useEffect(() => {
    setTabs((prev) => {
      if (!prev.find((t) => t.href === pathname)) {
        const label = getMenuLabel(pathname);
        return [...prev, { label, href: pathname }];
      }
      return prev;
    });
  }, [pathname]);

  function closeTab(href: string) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.href !== href);
      if (href === pathname) {
        // navigate to the last tab if current was closed
        const fallback = next[next.length - 1]?.href || "/";
        window.location.href = fallback;
      }
      return next.length ? next : [{ label: "메인화면", href: "/" }];
    });
  }

  function closeAllTabs() {
    setTabs([{ label: "메인화면", href: "/" }]);
    if (pathname !== "/") {
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-[40px] border-b border-black/10 bg-white/80 px-2 py-1 flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <div
            key={tab.href}
            className={
              "flex items-center gap-2 h-8 px-3 rounded-full text-sm border whitespace-nowrap " +
              (active
                ? "bg-black text-white border-black"
                : "bg-white border-black/10 text-black")
            }
          >
            <Link href={tab.href}>{tab.label}</Link>
            {tab.href !== "/" && (
              <button
                onClick={() => closeTab(tab.href)}
                className={active ? "text-white/90" : "text-black/60"}
                aria-label="close tab"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
      {tabs.length > 1 && (
        <button
          onClick={closeAllTabs}
          className="h-8 px-3 rounded-full text-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
          aria-label="close all tabs"
        >
          모든 탭 닫기
        </button>
      )}
    </div>
  );
}



"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import TabBar from "@/components/TabBar";

interface LayoutClientProps {
  children: React.ReactNode;
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { user, updateActivity } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const isLoginPage = pathname === "/login";

  // Only redirect on client side to avoid hydration mismatch
  useEffect(() => {
    if (isClient && !user && !isLoginPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
    }
  }, [isClient, user, isLoginPage, pathname, router]);

  // Track user activity for session management
  useEffect(() => {
    if (!user || !isClient) return;

    let lastActivityUpdate = Date.now();
    const throttleInterval = 10000; // 10초마다 한 번만 업데이트

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdate >= throttleInterval) {
        updateActivity();
        lastActivityUpdate = now;
      }
    };

    // Update activity on these events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial activity update
    updateActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, isClient, updateActivity]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar isVisible={!!user && sidebarVisible} />
      <div className="flex-1 min-h-screen bg-[#f5f6fa] transition-all duration-300">
        {!isLoginPage && <Topbar onToggleSidebar={toggleSidebar} />}
        {!isLoginPage && <TabBar />}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

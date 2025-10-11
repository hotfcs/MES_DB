"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/store/authStore";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout, getRemainingTime } = useAuth();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!user) {
      setRemainingTime(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
    };

    // 초기 실행
    updateTimer();
    
    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [user, getRemainingTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  return (
    <header className="h-[56px] border-b border-black/10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="메뉴 토글"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-600"
          >
            <path 
              d="M3 12H21M3 6H21M3 18H21" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="text-lg font-bold">MES 시스템</div>
      </div>
      <div className="flex items-center gap-3 text-sm text-black/70">
        {user ? (
          <>
            <div className={`px-3 py-1 rounded-md font-mono text-sm ${
              remainingTime < 60000 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              남은시간: {formatTime(remainingTime)}
            </div>
            <span>안녕하세요, {user.name}</span>
            <button
              onClick={() => logout()}
              className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50"
            >
              로그아웃
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">${user.name.charAt(0)}</div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/login" className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}



"use client";

import { useSyncExternalStore } from "react";

export type AuthUser = {
  id: number;
  account: string;
  name: string;
  role: string;
  department: string;
  position?: string;
  phone?: string;
  email?: string;
  image?: string;
};

type AuthState = {
  user: AuthUser | null;
  lastActivity?: number;
};

// 서버 스냅샷 캐시 (무한 루프 방지)
const SERVER_SNAPSHOT: AuthState = { user: null };

class AuthStore {
  private state: AuthState = { user: null };
  private listeners = new Set<() => void>();
  private initialized = false;
  private sessionTimeout = 30 * 60 * 1000; // 30분
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    // 클라이언트에서만 초기화
  }

  private initialize() {
    if (this.initialized || typeof window === "undefined") return;
    
    const raw = window.localStorage.getItem("auth:state");
    if (raw) {
      try {
        const savedState = JSON.parse(raw);
        if (savedState.user && savedState.lastActivity) {
          const elapsed = Date.now() - savedState.lastActivity;
          if (elapsed > this.sessionTimeout) {
            this.state = { user: null };
            window.localStorage.removeItem("auth:state");
          } else {
            this.state = savedState;
            this.startSessionTimer();
          }
        } else {
          this.state = savedState;
        }
      } catch {
        this.state = { user: null };
      }
    }
    this.initialized = true;
  }

  private emit() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth:state", JSON.stringify(this.state));
    }
    this.listeners.forEach((listener) => listener());
  }

  private startSessionTimer() {
    this.clearSessionTimer();
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, this.sessionTimeout);
  }

  private clearSessionTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.state;
  }

  getServerSnapshot() {
    return SERVER_SNAPSHOT;
  }

  getState() {
    this.initialize();
    return this.state;
  }

  // SQL Server 기반 로그인
  login = async (account: string, password: string) => {
    try {
      const response = await fetch('/api/mes/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account, password }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "로그인에 실패했습니다.");
      }

      this.state = {
        user: result.data.user,
        lastActivity: Date.now(),
      };
      
      this.emit();
      this.startSessionTimer();
    } catch (error) {
      throw error;
    }
  };

  // SQL Server 기반 로그아웃
  logout = async () => {
    if (this.state.user) {
      try {
        await fetch('/api/mes/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: this.state.user.id,
            account: this.state.user.account,
            name: this.state.user.name,
          }),
        });
      } catch (error) {
        console.error('로그아웃 이력 저장 실패:', error);
      }
    }

    this.clearSessionTimer();
    this.state = { user: null };
    this.emit();
    
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth:state");
    }
  };

  updateActivity = () => {
    if (!this.state.user) return;
    
    this.state = {
      ...this.state,
      lastActivity: Date.now(),
    };
    this.emit();
    this.startSessionTimer();
  };

  getRemainingTime = () => {
    if (!this.state.user || !this.state.lastActivity) return 0;
    
    const elapsed = Date.now() - this.state.lastActivity;
    const remaining = this.sessionTimeout - elapsed;
    
    return remaining > 0 ? remaining : 0;
  };
}

const authStore = new AuthStore();

export function useAuth() {
  const state = useSyncExternalStore(
    authStore.subscribe.bind(authStore),
    authStore.getSnapshot.bind(authStore),
    authStore.getServerSnapshot.bind(authStore)
  );

  return {
    user: state.user,
    login: authStore.login,
    logout: authStore.logout,
    updateActivity: authStore.updateActivity,
    getRemainingTime: authStore.getRemainingTime,
  };
}

export default authStore;

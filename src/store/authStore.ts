"use client";

import { useSyncExternalStore, useCallback } from "react";
import { dataStore, type User } from "@/store/dataStore";

export type AuthUser = {
  id: number;
  account: string;
  name: string;
  role: string;
  department: string;
  image?: string;
};

type AuthState = {
  user: AuthUser | null;
  lastActivity?: number;
};

class AuthStore {
  private state: AuthState = { user: null };
  private listeners = new Set<() => void>();
  private initialized = false;
  private sessionTimeout = 30 * 60 * 1000; // 30분 (밀리초)
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    // Don't initialize from localStorage in constructor to avoid hydration mismatch
  }

  private async getClientInfo() {
    if (typeof window === "undefined") {
      return { ipAddress: "Unknown", hostName: "Unknown" };
    }

    try {
      // RTCPeerConnection을 사용하여 로컬 IP 주소 가져오기
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      return new Promise<{ ipAddress: string; hostName: string }>((resolve) => {
        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            return;
          }

          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const match = ipRegex.exec(ice.candidate.candidate);
          
          if (match) {
            pc.close();
            resolve({
              ipAddress: match[1],
              hostName: window.location.hostname || "localhost"
            });
          }
        };

        // 타임아웃 설정 (2초 후 기본값 반환)
        setTimeout(() => {
          pc.close();
          resolve({
            ipAddress: "127.0.0.1",
            hostName: window.location.hostname || "localhost"
          });
        }, 2000);
      });
    } catch {
      return {
        ipAddress: "127.0.0.1",
        hostName: window.location.hostname || "localhost"
      };
    }
  }

  private initialize() {
    if (this.initialized || typeof window === "undefined") return;
    
    const raw = window.localStorage.getItem("auth:state");
    if (raw) {
      try {
        const savedState = JSON.parse(raw);
        // Check if session is expired
        if (savedState.user && savedState.lastActivity) {
          const elapsed = Date.now() - savedState.lastActivity;
          if (elapsed > this.sessionTimeout) {
            // Session expired, logout
            this.state = { user: null };
            window.localStorage.removeItem("auth:state");
          } else {
            // Session valid
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
    this.listeners.forEach((l) => l());
  }

  private startSessionTimer() {
    this.clearSessionTimer();
    if (typeof window !== "undefined") {
      this.timeoutId = setTimeout(() => {
        this.logout();
      }, this.sessionTimeout);
    }
  }

  private clearSessionTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  updateActivity() {
    if (this.state.user) {
      this.state.lastActivity = Date.now();
      this.emit();
      this.startSessionTimer();
    }
  }

  getRemainingTime() {
    if (!this.state.user || !this.state.lastActivity) {
      return 0;
    }
    const elapsed = Date.now() - this.state.lastActivity;
    const remaining = this.sessionTimeout - elapsed;
    return Math.max(0, remaining);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState() {
    this.initialize();
    return this.state;
  }

  login = async (account: string, password: string, users: User[]) => {
    const matched = users.find(
      (u) => u.account === account && u.password === password && u.status === "active"
    );
    if (!matched) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않거나 비활성 사용자입니다.");
    }
    this.state = {
      user: {
        id: matched.id,
        account: matched.account,
        name: matched.name,
        role: matched.role,
        department: matched.department,
        image: matched.image,
      },
      lastActivity: Date.now(),
    };
    this.emit();
    this.startSessionTimer();

    // 로그인 이력 기록
    const clientInfo = await this.getClientInfo();
    
    dataStore.addLoginHistory({
      userId: matched.id,
      account: matched.account,
      name: matched.name,
      action: "login",
      timestamp: new Date().toISOString(),
      ipAddress: clientInfo.ipAddress,
      hostName: clientInfo.hostName,
    });
  };

  logout = async () => {
    // 로그아웃 이력 기록 (상태 초기화 전에)
    if (this.state.user) {
      const clientInfo = await this.getClientInfo();
      
      dataStore.addLoginHistory({
        userId: this.state.user.id,
        account: this.state.user.account,
        name: this.state.user.name,
        action: "logout",
        timestamp: new Date().toISOString(),
        ipAddress: clientInfo.ipAddress,
        hostName: clientInfo.hostName,
      });
    }

    this.clearSessionTimer();
    this.state = { user: null };
    this.emit();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth:state");
    }
  };
}

const authStore = new AuthStore();

export function useAuth() {
  const state = useSyncExternalStore(
    (cb) => authStore.subscribe(cb),
    () => authStore.getState(),
    () => authStore.getState()
  );
  
  const updateActivity = useCallback(() => {
    authStore.updateActivity();
  }, []);
  
  const getRemainingTime = useCallback(() => {
    return authStore.getRemainingTime();
  }, []);
  
  return {
    user: state.user,
    login: authStore.login,
    logout: authStore.logout,
    updateActivity,
    getRemainingTime,
  };
}



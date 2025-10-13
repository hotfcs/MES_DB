"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, login } = useAuth();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user) {
      router.replace("/");
    }
  }, [isClient, user, router]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] px-4">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setConnectionStatus("");
    setRetryCount(0);
    
    const maxRetries = 5;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        setConnectionStatus(`데이터베이스 연결 중... (${attempt}/${maxRetries})`);
        
        await login(account.trim(), password);
        
        setConnectionStatus("로그인 성공!");
        const redirectTo = params.get("redirect") || "/";
        router.replace(redirectTo);
        return;
      } catch (err: unknown) {
        const error = err as Error & { message?: string };
        
        // 연결 관련 오류인지 확인
        const isConnectionError = 
          error.message?.includes('ETIMEOUT') ||
          error.message?.includes('Failed to connect') ||
          error.message?.includes('Connection') ||
          error.message?.includes('timeout');
        
        if (isConnectionError && attempt < maxRetries) {
          // 연결 오류이고 재시도 가능한 경우
          const waitTime = attempt * 1000; // 1초, 2초, 3초...
          setConnectionStatus(`연결 실패. ${waitTime / 1000}초 후 재시도... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt === maxRetries) {
          // 마지막 시도 실패
          setConnectionStatus("");
          setError(
            isConnectionError 
              ? `데이터베이스 연결 실패 (${maxRetries}번 시도). 네트워크를 확인하세요.`
              : (error.message || "로그인에 실패했습니다.")
          );
          break;
        } else {
          // 연결 오류가 아닌 경우 (비밀번호 오류 등)
          setConnectionStatus("");
          setError(error.message || "로그인에 실패했습니다.");
          break;
        }
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] px-4">
      <div className="w-full max-w-sm bg-white shadow rounded-xl p-6 border border-black/10">
        <h1 className="text-xl font-bold mb-4">로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">아이디</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="admin123"
            />
          </div>
          {connectionStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-blue-600 text-sm flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">{connectionStatus}</span>
              </div>
              {retryCount > 1 && (
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(retryCount / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? `로그인 중... ${retryCount > 0 ? `(${retryCount}/5)` : ''}` : '로그인'}
          </button>
          <div className="text-xs text-black/60">
            데모 계정: admin / admin123
          </div>
        </form>
      </div>
    </div>
  );
}



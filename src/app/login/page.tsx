"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/store/authStore";
import { useUsersStore } from "@/store/dataStore";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, login } = useAuth();
  const { users } = useUsersStore();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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
    try {
      await login(account.trim(), password, users);
      const redirectTo = params.get("redirect") || "/";
      router.replace(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    }
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
              placeholder="예: kimcs"
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
              placeholder="비밀번호"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
          >
            로그인
          </button>
          <div className="text-xs text-black/60">
            데모 계정: admin / admin123
          </div>
        </form>
      </div>
    </div>
  );
}



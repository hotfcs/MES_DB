"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 60 * 1000, // 30분간 데이터를 fresh로 간주 (5분 → 30분)
            gcTime: 60 * 60 * 1000, // 60분간 캐시 유지 (10분 → 60분)
            refetchOnWindowFocus: false, // 윈도우 포커스시 자동 refetch 비활성화
            refetchOnMount: false, // 마운트시 자동 refetch 비활성화
            retry: 1, // 실패시 1회만 재시도
            networkMode: 'online', // 온라인일 때만 fetch
          },
          mutations: {
            retry: 1,
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}


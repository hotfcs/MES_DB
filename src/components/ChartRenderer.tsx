'use client';

import React from 'react';
import dynamic from 'next/dynamic';

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title?: string;
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
}

interface ChartRendererProps {
  chartData: ChartData;
}

// ChartRendererCore를 동적으로 로드 (SSR 비활성화)
const ChartRendererCore = dynamic(() => import('./ChartRendererCore'), {
  ssr: false,
  loading: () => (
    <div className="my-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded">
        <span className="text-gray-500 text-sm">차트 로딩 중...</span>
      </div>
    </div>
  ),
});

const ChartRenderer = ({ chartData }: ChartRendererProps) => {
  return <ChartRendererCore chartData={chartData} />;
};

export default ChartRenderer;

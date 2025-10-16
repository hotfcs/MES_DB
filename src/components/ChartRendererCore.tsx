'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title?: string;
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
}

interface ChartRendererCoreProps {
  chartData: ChartData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ChartRendererCore = ({ chartData }: ChartRendererCoreProps) => {
  const { type, title, data, xKey = 'name', yKey = 'value' } = chartData;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
        차트 데이터가 없습니다.
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="my-4 p-4 bg-white rounded-lg border border-gray-200">
        {title && (
          <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
        )}
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded">
          <span className="text-gray-500 text-sm">차트 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 bg-white rounded-lg border border-gray-200">
      {title && (
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      )}
      <div style={{ width: '100%', height: '300px' }}>
        {type === 'bar' && (
          <BarChart width={400} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#3b82f6" />
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart width={400} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart width={400} height={300}>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>
    </div>
  );
};

export default ChartRendererCore;


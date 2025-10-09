"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    
    const monthNames = ["일월", "이월", "삼월", "사월", "오월", "육월", "칠월", "팔월", "구월", "십월", "십일월", "십이월"];
    
    setSelectedDate(`${year}년 ${month}월 ${date}일`);
    setSelectedMonth(monthNames[month - 1]);
  }, []);

  // 샘플 데이터
  const productData = [
    { name: "제품A", value: 30, color: "#ff6b6b" },
    { name: "제품B", value: 20, color: "#ffd93d" },
    { name: "제품C", value: 16, color: "#6bcf7f" },
    { name: "제품D", value: 10, color: "#4d79ff" },
    { name: "제품E", value: 16, color: "#ff9ff3" },
    { name: "제품F", value: 8, color: "#54a0ff" },
  ];

  const rangeData = [
    { category: "범위1", value: 35 },
    { category: "범위2", value: 55 },
    { category: "범위3", value: 30 },
    { category: "범위4", value: 95 },
    { category: "범위5", value: 65 },
    { category: "범위6", value: 50 },
  ];

  const dailyPerformance = {
    today: "91만 8천",
    yesterday: "1,027,000",
    lastWeek: "7,839,000",
  };

  const unitProduction = {
    thisMonth: "4,327",
    lastMonth: "17,943",
    yearToDate: "169,645",
  };

  const groupedData1 = [
    { category: "그룹1", value1: 200, value2: 150 },
    { category: "그룹2", value1: 300, value2: 250 },
    { category: "그룹3", value1: 320, value2: 280 },
    { category: "그룹4", value1: 400, value2: 350 },
    { category: "그룹5", value1: 280, value2: 200 },
    { category: "그룹6", value1: 350, value2: 300 },
  ];

  const productSalesData = [
    { name: "High Charing Me Movement", value1: 5500, value2: 4800 },
    { name: "Dan Bridan", value1: 4200, value2: 3800 },
    { name: "Elin Dicc", value1: 3800, value2: 4500 },
    { name: "Ton Cruico", value1: 3200, value2: 2800 },
    { name: "Ono Scalo", value1: 2800, value2: 2200 },
  ];

  return (
    <div className="p-4 bg-white h-[calc(100vh-112px)] overflow-hidden">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* 제품별 매출 도넛 차트 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <h3 className="text-base font-semibold mb-3">제품별 매출</h3>
          <div className="flex items-center justify-between h-3/4">
            <div className="relative w-64 h-64 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {productData.map((item, index) => {
                  const startAngle = productData.slice(0, index).reduce((sum, d) => sum + (d.value * 3.6), 0);
                  const endAngle = startAngle + (item.value * 3.6);
                  const largeArcFlag = item.value > 50 ? 1 : 0;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                  
                  const pathData = [
                    `M 50 50 L ${x1} ${y1}`,
                    `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    "Z"
                  ].join(" ");
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  );
                })}
                <circle cx="50" cy="50" r="20" fill="white" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-gray-600">총 매출</div>
                </div>
              </div>
            </div>
            <div className="flex-1 ml-4 h-full">
              <div className="grid grid-cols-2 gap-1 text-xs h-full content-start">
                {productData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2025 범위별 제품 판매 바 차트 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <h3 className="text-base font-semibold mb-3">2025 범위별 제품 판매</h3>
          <div className="h-3/4 flex items-end justify-between space-x-1">
            {rangeData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-600 rounded-t"
                  style={{ height: `${(item.value / 100) * 120}px` }}
                ></div>
                <div className="text-xs mt-1 text-center">
                  {item.value}억원
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>0억</span>
            <span>20억</span>
            <span>40억</span>
            <span>60억</span>
            <span>80억</span>
            <span>100억</span>
          </div>
          <div className="mt-1 flex justify-end">
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-blue-600 rounded mr-1"></div>
              <span>Product</span>
            </div>
          </div>
        </div>

        {/* 일일 판매 실적 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold">일일 판매 실적</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <span>←</span>
              <span>{selectedDate}</span>
            </div>
          </div>
          <div className="space-y-2 h-3/4 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-sm">오늘</span>
              <span className="font-semibold text-sm">{dailyPerformance.today} 원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">어제</span>
              <span className="font-semibold text-sm">{dailyPerformance.yesterday} 원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">지난주</span>
              <span className="font-semibold text-sm">{dailyPerformance.lastWeek} 원</span>
            </div>
          </div>
        </div>

        {/* 제품별 단위 판매량 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold">제품별 단위 판매량</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <span>←</span>
              <span>{selectedMonth}</span>
            </div>
          </div>
          <div className="space-y-2 h-3/4 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-sm">이번 달</span>
              <span className="font-semibold text-sm">{unitProduction.thisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">전달</span>
              <span className="font-semibold text-sm">{unitProduction.lastMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">현재까지</span>
              <span className="font-semibold text-sm">{unitProduction.yearToDate}</span>
            </div>
          </div>
        </div>

        {/* 첫 번째 그룹 바 차트 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <h3 className="text-base font-semibold mb-3">판매 범위별 실적</h3>
          <div className="h-3/4 flex items-end justify-between space-x-1">
            {groupedData1.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1 space-y-1">
                <div 
                  className="w-full bg-blue-600 rounded-t"
                  style={{ height: `${(item.value1 / 600) * 80}px` }}
                ></div>
                <div 
                  className="w-full bg-pink-500 rounded-t"
                  style={{ height: `${(item.value2 / 600) * 80}px` }}
                ></div>
                <div className="text-xs mt-1 text-center">
                  {item.value1}만원
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>0만</span>
            <span>200만</span>
            <span>400만</span>
            <span>600만</span>
          </div>
        </div>

        {/* 두 번째 그룹 바 차트 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
          <h3 className="text-base font-semibold mb-3">제품별 판매량</h3>
          <div className="h-3/4 flex items-end justify-between space-x-1">
            {productSalesData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1 space-y-1">
                <div 
                  className="w-full bg-blue-600 rounded-t"
                  style={{ height: `${(item.value1 / 6000) * 80}px` }}
                ></div>
                <div 
                  className="w-full bg-pink-500 rounded-t"
                  style={{ height: `${(item.value2 / 6000) * 80}px` }}
                ></div>
                <div className="text-xs mt-1 text-center leading-tight">
                  {item.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>0천</span>
            <span>2천</span>
            <span>4천</span>
            <span>6천</span>
          </div>
        </div>
      </div>
    </div>
  );
}
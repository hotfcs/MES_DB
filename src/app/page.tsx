"use client";

import { useState, useEffect } from "react";
import { useLinesStore, useEquipmentsStore, useProcessesStore } from "@/store/dataStore";

export default function DigitalTwinDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  
  // 실시간 알람 (모든 Hook을 최상단에 배치)
  const [alarms] = useState([
    { time: "14:23:15", level: "info", message: "시스템 정상 가동 중" },
    { time: "14:23:15", level: "warning", message: "일부 라인 온도 주의" },
    { time: "14:18:42", level: "info", message: "정기 점검 완료" },
  ]);

  // 실제 데이터 가져오기
  const { lines, loading: linesLoading } = useLinesStore();
  const { equipments, loading: equipmentsLoading } = useEquipmentsStore();
  const { processes, loading: processesLoading } = useProcessesStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 로딩 중일 때
  if (linesLoading || equipmentsLoading || processesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">데이터 로딩 중...</div>
      </div>
    );
  }

  // 라인별 설비 그룹핑
  const getEquipmentsByLine = (lineName: string) => {
    return equipments.filter((eq) => eq.line === lineName && eq.status === "active");
  };

  // 라인별 공정 그룹핑
  const getProcessesByLine = (lineName: string) => {
    return processes.filter((proc) => proc.line === lineName && proc.status === "active");
  };

  // 활성 라인만 필터링
  const activeLines = lines.filter((line) => line.status === "active");

  // 라인 데이터를 3D 레이아웃용으로 변환
  const productionLines = activeLines.map((line, index) => {
    const lineEquipments = getEquipmentsByLine(line.name);
    const lineProcesses = getProcessesByLine(line.name);
    
    // 라인당 랜덤 생산 데이터 생성 (실제로는 DB에서 가져와야 함)
    const efficiency = Math.floor(Math.random() * 30) + 70; // 70-100%
    const temperature = (Math.random() * 6 + 21).toFixed(1); // 21-27°C
    const vibration = (Math.random() * 0.7 + 0.1).toFixed(1); // 0.1-0.8 mm/s
    const speed = efficiency; // 속도 = 가동률
    const target = 1000 + Math.floor(Math.random() * 500); // 1000-1500
    const output = Math.floor(target * (efficiency / 100));
    
    // 상태 결정
    let status = "운영중";
    let color = "#10b981"; // 녹색
    
    if (efficiency < 75) {
      status = "경고";
      color = "#ef4444"; // 빨간색
    } else if (efficiency < 85) {
      status = "주의";
      color = "#f59e0b"; // 노란색
    }

    // 라인 위치 계산 (2행 3열, 좌측 아래 배치)
    const cols = 3; // 3열로 배치
    const row = Math.floor(index / cols); // 0 또는 1
    const col = index % cols; // 0, 1, 2
    
    const xSpacing = 28; // X축 간격
    const ySpacing = 35; // Y축 간격 (상하 간격)
    
    // 좌측 아래 배치
    const xOffset = 12; // 좌측 여백 (좌측으로 이동)
    const yOffset = 27; // 상단 여백
    const bottomRowOffset = 5; // 하단 라인 추가 여백

    return {
      id: line.code,
      name: line.name,
      code: line.code,
      location: line.location,
      capacity: line.capacity,
      manager: line.manager,
      description: line.description,
      status,
      efficiency,
      temperature: parseFloat(temperature),
      vibration: parseFloat(vibration),
      speed,
      output,
      target,
      equipmentCount: lineEquipments.length,
      processCount: lineProcesses.length,
      equipments: lineEquipments,
      processes: lineProcesses,
      position: { 
        x: xOffset + (col * xSpacing), 
        y: yOffset + (row * ySpacing) + (row === 1 ? bottomRowOffset : 0)
      },
      color,
    };
  });

  // 전체 통계
  const totalOutput = productionLines.reduce((sum, line) => sum + line.output, 0);
  const totalTarget = productionLines.reduce((sum, line) => sum + line.target, 0);
  const avgEfficiency = productionLines.length > 0
    ? Math.round(
        productionLines.reduce((sum, line) => sum + line.efficiency, 0) / productionLines.length
      )
    : 0;
  const activeLineCount = productionLines.filter((line) => line.status === "운영중").length;
  const totalEquipments = equipments.filter((eq) => eq.status === "active").length;

  // 센서 데이터
  const sensorData = [
    { name: "온도", value: "24.3°C", status: "normal", icon: "🌡️" },
    { name: "습도", value: "45%", status: "normal", icon: "💧" },
    { name: "CO₂", value: "412ppm", status: "normal", icon: "🌫️" },
    { name: "소음", value: "68dB", status: "warning", icon: "🔊" },
    { name: "조도", value: "850lx", status: "normal", icon: "💡" },
    { name: "미세먼지", value: "23㎍/㎥", status: "good", icon: "🍃" },
  ];

  // 설비 가동 상태 (상위 6개)
  const topEquipments = equipments
    .filter((eq) => eq.status === "active")
    .slice(0, 6)
    .map((eq) => {
      const utilization = Math.floor(Math.random() * 30) + 70;
      let status = "정상";
      let color = "#10b981";
      
      if (utilization < 75) {
        status = "경고";
        color = "#ef4444";
      } else if (utilization < 85) {
        status = "점검";
        color = "#f59e0b";
      }
      
      return {
        name: eq.name,
        status,
        utilization,
        color,
      };
    });
                  
                  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              🏭 디지털 트윈 제조 시스템
            </h1>
            <p className="text-cyan-300 text-sm">실시간 공장 모니터링 및 제어 시스템</p>
                </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-white">
              {currentTime.toLocaleTimeString("ko-KR")}
            </div>
            <div className="text-sm text-cyan-300">
              {currentTime.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
              </div>
            </div>
          </div>
        </div>

      {/* 메인 대시보드 그리드 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 왼쪽: 3D 공장 레이아웃 */}
        <div className="col-span-8">
          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-4 shadow-2xl transform hover:scale-105 transition-transform border border-cyan-500/30">
              <div className="text-cyan-100 text-xs mb-1">총 생산량</div>
              <div className="text-white text-2xl font-bold">{totalOutput.toLocaleString()}</div>
              <div className="text-cyan-100 text-xs mt-1">/ {totalTarget.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 shadow-2xl transform hover:scale-105 transition-transform border border-emerald-500/30">
              <div className="text-emerald-100 text-xs mb-1">평균 가동률</div>
              <div className="text-white text-2xl font-bold">{avgEfficiency}%</div>
              <div className="text-emerald-100 text-xs mt-1">{productionLines.length}개 라인</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-2xl transform hover:scale-105 transition-transform border border-blue-500/30">
              <div className="text-blue-100 text-xs mb-1">가동 라인</div>
              <div className="text-white text-2xl font-bold">{activeLineCount}</div>
              <div className="text-blue-100 text-xs mt-1">/ {productionLines.length} 라인</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 shadow-2xl transform hover:scale-105 transition-transform border border-indigo-500/30">
              <div className="text-indigo-100 text-xs mb-1">총 설비</div>
              <div className="text-white text-2xl font-bold">{totalEquipments}</div>
              <div className="text-indigo-100 text-xs mt-1">대</div>
                </div>
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-4 shadow-2xl transform hover:scale-105 transition-transform border border-violet-500/30">
              <div className="text-violet-100 text-xs mb-1">달성률</div>
              <div className="text-white text-2xl font-bold">
                {totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0}%
              </div>
              <div className="text-violet-100 text-xs mt-1">목표 대비</div>
            </div>
          </div>

          {/* 3D 공장 레이아웃 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">3D 공장 레이아웃</h2>
              <div className="flex space-x-2">
                <span className="flex items-center text-xs text-cyan-300">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1 shadow-lg shadow-emerald-500/50"></div>
                  운영중
                </span>
                <span className="flex items-center text-xs text-cyan-300">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-1 shadow-lg shadow-amber-500/50"></div>
                  주의
                </span>
                <span className="flex items-center text-xs text-cyan-300">
                  <div className="w-3 h-3 rounded-full bg-rose-500 mr-1 shadow-lg shadow-rose-500/50"></div>
                  경고
                </span>
          </div>
            </div>

            {/* 3D 공장 맵 */}
            <div
              className="relative bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-8 border-2 border-cyan-500/20"
              style={{
                height: "600px",
                perspective: "1200px",
                boxShadow: "inset 0 0 50px rgba(6, 182, 212, 0.1)",
              }}
            >
              {/* 그리드 배경 */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              ></div>

              {/* 생산 라인들 */}
              {productionLines.map((line) => (
                <div
                  key={line.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${line.position.x}%`,
                    top: `${line.position.y}%`,
                    transform: selectedLine === line.id ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => setSelectedLine(selectedLine === line.id ? null : line.id)}
                >
                  {/* 3D 박스 */}
                  <div
                    className="relative"
                    style={{
                      width: "200px",
                      height: "120px",
                      transformStyle: "preserve-3d",
                      transform: "rotateX(45deg) rotateZ(-10deg)",
                    }}
                  >
                    {/* 전면 */}
                    <div
                      className="absolute inset-0 rounded-lg shadow-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${line.color} 0%, ${line.color}dd 100%)`,
                        border: `2px solid ${line.color}`,
                        transform: "translateZ(30px)",
                        boxShadow: `0 0 30px ${line.color}66`,
                      }}
                    >
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{line.name}</div>
                        <div className="text-white/80 text-xs">{line.code}</div>
                        <div className="text-white/70 text-xs mt-1">
                          설비 {line.equipmentCount}대 · 공정 {line.processCount}개
                        </div>
                      </div>
                    </div>

                    {/* 상단 */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${line.color}aa 0%, ${line.color}88 100%)`,
                        transform: "rotateX(90deg) translateZ(30px)",
                        transformOrigin: "top",
                      }}
                    ></div>

                    {/* 측면 */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${line.color}88 0%, ${line.color}66 100%)`,
                        transform: "rotateY(90deg) translateZ(170px)",
                        transformOrigin: "right",
                        width: "30px",
                      }}
                    ></div>
                  </div>

                  {/* 상태 인디케이터 */}
                  <div
                    className="absolute -top-2 -right-2"
                    style={{
                      transform: "translateZ(60px)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div className="relative">
                      <div
                        className="w-4 h-4 rounded-full animate-ping absolute"
                        style={{ backgroundColor: line.color, opacity: 0.6 }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: line.color }}
                      ></div>
          </div>
        </div>

                  {/* 호버 정보 */}
                  <div
                    className="absolute -bottom-32 left-0 bg-slate-800 text-white p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity border border-cyan-500/50 z-50"
                    style={{
                      width: "240px",
                      transform: "rotateX(0deg) rotateZ(0deg)",
                    }}
                  >
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between border-b border-cyan-500/30 pb-1 mb-1">
                        <span className="font-bold text-cyan-300">{line.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">위치:</span>
                        <span className="font-semibold">{line.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">관리자:</span>
                        <span className="font-semibold">{line.manager}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">가동률:</span>
                        <span className="font-semibold">{line.efficiency}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">생산량:</span>
                        <span className="font-semibold">
                          {line.output}/{line.target}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">온도:</span>
                        <span className="font-semibold">{line.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">설비:</span>
                        <span className="font-semibold">{line.equipmentCount}대</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 라인 상세 정보 */}
          {selectedLine && (
            <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-cyan-500/30 animate-fadeIn">
              {(() => {
                const line = productionLines.find((l) => l.id === selectedLine);
                if (!line) return null;
                return (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{line.name}</h3>
                        <p className="text-sm text-cyan-300">
                          {line.code} · {line.location} · 관리자: {line.manager}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedLine(null)}
                        className="text-cyan-300 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                        <div className="text-cyan-300 text-xs mb-1">현재 속도</div>
                        <div className="text-white text-xl font-bold">{line.speed}%</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                        <div className="text-cyan-300 text-xs mb-1">온도</div>
                        <div className="text-white text-xl font-bold">{line.temperature}°C</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                        <div className="text-cyan-300 text-xs mb-1">진동</div>
                        <div className="text-white text-xl font-bold">{line.vibration} mm/s</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                        <div className="text-cyan-300 text-xs mb-1">용량</div>
                        <div className="text-white text-xl font-bold">{line.capacity}</div>
                      </div>
            </div>

                    {/* 생산 진척도 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-cyan-300 mb-2">
                        <span>생산 진척도</span>
                        <span>
                          {line.output.toLocaleString()} / {line.target.toLocaleString()} (
                          {Math.round((line.output / line.target) * 100)}%)
                        </span>
            </div>
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${(line.output / line.target) * 100}%` }}
                        ></div>
            </div>
                    </div>

                    {/* 설비 목록 */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-white mb-2">
                        설비 목록 ({line.equipments.length}대)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {line.equipments.map((eq) => (
                          <div key={eq.id} className="bg-slate-700/30 rounded p-2 text-xs border border-slate-600/30">
                            <div className="text-white font-medium">{eq.name}</div>
                            <div className="text-cyan-300">{eq.type} · {eq.model}</div>
                          </div>
                        ))}
          </div>
        </div>

                    {/* 공정 목록 */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        공정 목록 ({line.processes.length}개)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {line.processes.map((proc) => (
                          <div key={proc.id} className="bg-slate-700/30 rounded p-2 text-xs border border-slate-600/30">
                            <div className="text-white font-medium">{proc.name}</div>
                            <div className="text-cyan-300">{proc.type} · {proc.standardTime}분</div>
                          </div>
                        ))}
            </div>
          </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* 오른쪽: 센서 데이터 & 설비 상태 */}
        <div className="col-span-4 space-y-6">
          {/* 환경 센서 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              환경 센서 데이터
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {sensorData.map((sensor, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3 border border-slate-600/50 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{sensor.icon}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        sensor.status === "normal"
                          ? "bg-emerald-500"
                          : sensor.status === "warning"
                          ? "bg-amber-500"
                          : "bg-cyan-400"
                      } animate-pulse`}
                    ></div>
            </div>
                  <div className="text-cyan-300 text-xs mb-1">{sensor.name}</div>
                  <div className="text-white text-lg font-bold">{sensor.value}</div>
            </div>
              ))}
          </div>
        </div>

          {/* 설비 가동 상태 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">⚙️</span>
              주요 설비 가동 상태
            </h2>
            <div className="space-y-3">
              {topEquipments.map((equipment, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-sm font-semibold">{equipment.name}</span>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${equipment.color}22`,
                        color: equipment.color,
                        border: `1px solid ${equipment.color}`,
                      }}
                    >
                      {equipment.status}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${equipment.utilization}%`,
                        backgroundColor: equipment.color,
                      }}
                ></div>
                  </div>
                  <div className="text-right text-xs text-cyan-300 mt-1">
                    {equipment.utilization}%
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* 실시간 알람 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🔔</span>
              실시간 알람
            </h2>
            <div className="space-y-2">
              {alarms.map((alarm, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    alarm.level === "error"
                      ? "bg-rose-900/20 border-rose-500/50"
                      : alarm.level === "warning"
                      ? "bg-amber-900/20 border-amber-500/50"
                      : "bg-cyan-900/20 border-cyan-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{alarm.message}</div>
                      <div className="text-cyan-300 text-xs mt-1">
                        {idx === 0 ? currentTime.toLocaleTimeString("ko-KR") : alarm.time}
                      </div>
                    </div>
                    <div
                      className={`text-lg ${
                        alarm.level === "error"
                          ? "text-rose-500"
                          : alarm.level === "warning"
                          ? "text-amber-500"
                          : "text-cyan-500"
                      }`}
                    >
                      {alarm.level === "error" ? "⚠️" : alarm.level === "warning" ? "⚡" : "ℹ️"}
                    </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

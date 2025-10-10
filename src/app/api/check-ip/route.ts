import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 다양한 헤더에서 IP 확인
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  const vercelProxiedFor = request.headers.get('x-vercel-proxied-for');
  
  // 모든 헤더 정보
  const allHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.startsWith('x-')) {
      allHeaders[key] = value;
    }
  });

  return NextResponse.json({
    success: true,
    ip: {
      forwardedFor: forwardedFor?.split(',')[0] || null,
      realIp: realIp || null,
      vercelForwardedFor: vercelForwardedFor || null,
      vercelProxiedFor: vercelProxiedFor || null,
    },
    allHeaders,
    timestamp: new Date().toISOString(),
  });
}


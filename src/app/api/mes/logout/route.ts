import { NextRequest, NextResponse } from 'next/server';
import { executeNonQuery } from '@/lib/db-queries';

// POST: 로그아웃
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, account, name } = body;

    if (!userId || !account || !name) {
      return NextResponse.json({
        success: false,
        message: '필수 정보가 누락되었습니다',
      }, { status: 400 });
    }

    // 로그아웃 이력 기록
    const clientInfo = getClientInfo(request);
    await executeNonQuery(`
      INSERT INTO login_history (user_id, account, name, action, timestamp, ip_address, host_name)
      VALUES (@userId, @account, @name, 'logout', GETDATE(), @ipAddress, @hostName)
    `, {
      userId,
      account,
      name,
      ipAddress: clientInfo.ipAddress,
      hostName: clientInfo.hostName
    });

    return NextResponse.json({
      success: true,
      message: '로그아웃 성공',
    });
  } catch (error: any) {
    console.error('로그아웃 에러:', error);
    return NextResponse.json({
      success: false,
      message: '로그아웃 처리 중 오류가 발생했습니다',
      error: error.message,
    }, { status: 500 });
  }
}

// 클라이언트 정보 추출
function getClientInfo(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  return {
    ipAddress: forwardedFor?.split(',')[0] || realIp || 'unknown',
    hostName: request.headers.get('host') || 'unknown'
  };
}


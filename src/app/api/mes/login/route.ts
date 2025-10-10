import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// POST: 로그인
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, password } = body;

    if (!account || !password) {
      return NextResponse.json({
        success: false,
        message: '계정과 비밀번호를 입력해주세요',
      }, { status: 400 });
    }

    // 사용자 조회
    const query = `
      SELECT id, account, name, role, department, position, 
             phone, email, status, image
      FROM users
      WHERE account = @account AND password = @password AND status = 'active'
    `;

    const users = await executeQuery(query, { account, password });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않거나 비활성 사용자입니다',
      }, { status: 401 });
    }

    const user = users[0];

    // 마지막 로그인 시간 업데이트
    await executeNonQuery(
      'UPDATE users SET last_login = GETDATE(), modified_at = GETDATE() WHERE id = @id',
      { id: user.id }
    );

    // 로그인 이력 기록
    const clientInfo = getClientInfo(request);
    await executeNonQuery(`
      INSERT INTO login_history (user_id, account, name, action, timestamp, ip_address, host_name)
      VALUES (@userId, @account, @name, 'login', GETDATE(), @ipAddress, @hostName)
    `, {
      userId: user.id,
      account: user.account,
      name: user.name,
      ipAddress: clientInfo.ipAddress,
      hostName: clientInfo.hostName
    });

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          id: user.id,
          account: user.account,
          name: user.name,
          role: user.role,
          department: user.department,
          position: user.position,
          phone: user.phone,
          email: user.email,
          image: user.image
        }
      }
    });
  } catch (error: any) {
    console.error('로그인 에러:', error);
    return NextResponse.json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다',
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


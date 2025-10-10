import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db-queries';

// GET: 로그인 이력 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '100';

    let query = `
      SELECT TOP (@limit)
        id, 
        user_id as userId, 
        account, 
        name, 
        action, 
        timestamp,
        ip_address as ipAddress, 
        host_name as hostName
      FROM login_history
      WHERE 1=1
    `;

    const params: Record<string, string | number | null> = { limit: parseInt(limit) };

    if (userId) {
      query += ` AND user_id = @userId`;
      params.userId = parseInt(userId);
    }

    if (action) {
      query += ` AND action = @action`;
      params.action = action;
    }

    if (startDate) {
      query += ` AND timestamp >= @startDate`;
      params.startDate = startDate;
    }

    if (endDate) {
      query += ` AND timestamp <= @endDate`;
      params.endDate = endDate;
    }

    query += ` ORDER BY timestamp DESC`;

    const history = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: unknown) {
    console.error('로그인 이력 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '로그인 이력 조회 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


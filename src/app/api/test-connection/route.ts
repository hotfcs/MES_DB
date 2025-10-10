import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/db';

// Azure SQL Server 연결 테스트 API
export async function GET() {
  try {
    const isConnected = await checkDbConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Azure SQL Server 연결 성공',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Azure SQL Server 연결 실패',
      }, { status: 500 });
    }
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      message: '연결 중 에러 발생',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


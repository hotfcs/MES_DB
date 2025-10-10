import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// 사용자 타입 정의
interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

// GET: 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';

    const query = `
      SELECT TOP (@limit) 
        id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
    `;

    const users = await executeQuery<User>(query, { limit: parseInt(limit) });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '사용자 조회 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: 사용자 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({
        success: false,
        message: 'name과 email은 필수입니다',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO users (name, email, created_at)
      VALUES (@name, @email, GETDATE())
    `;

    const rowsAffected = await executeNonQuery(query, { name, email });

    return NextResponse.json({
      success: true,
      message: '사용자 추가 성공',
      rowsAffected,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '사용자 추가 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE: 사용자 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'id는 필수입니다',
      }, { status: 400 });
    }

    const query = 'DELETE FROM users WHERE id = @id';
    const rowsAffected = await executeNonQuery(query, { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '사용자 삭제 성공',
      rowsAffected,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '사용자 삭제 실패',
      error: error.message,
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 부서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        id, name, code, manager, description, status, 
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt, 
        FORMAT(modified_at, 'yyyy-MM-dd HH:mm:ss') as modifiedAt
      FROM departments
      WHERE 1=1
    `;

    const params: Record<string, string | number | null> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    if (search) {
      query += ` AND (name LIKE '%' + @search + '%' OR code LIKE '%' + @search + '%')`;
      params.search = search;
    }

    query += ` ORDER BY created_at DESC`;

    const departments = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: departments,
      count: departments.length,
    });
  } catch (error: unknown) {
    console.error('부서 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '부서 조회 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST: 부서 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, manager, description, status = 'active' } = body;

    if (!code || !name) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요 (code, name)',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO departments (code, name, manager, description, status, created_at)
      VALUES (@code, @name, @manager, @description, @status, GETDATE())
    `;

    await executeNonQuery(query, {
      code,
      name,
      manager: manager || '',
      description: description || '',
      status
    });

    return NextResponse.json({
      success: true,
      message: '부서가 추가되었습니다',
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('부서 추가 에러:', error);
    return NextResponse.json({
      success: false,
      message: '부서 추가 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: 부서 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'id는 필수입니다',
      }, { status: 400 });
    }

    const allowedFields = ['name', 'manager', 'description', 'status'];
    const updateParts: string[] = [];
    const params: Record<string, string | number | null> = { id };

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = @${key}`);
        params[key] = value as string | number | null;
      }
    });

    if (updateParts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '수정할 항목이 없습니다',
      }, { status: 400 });
    }

    updateParts.push('modified_at = GETDATE()');

    const query = `
      UPDATE departments
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '부서 정보가 수정되었습니다',
    });
  } catch (error: unknown) {
    console.error('부서 수정 에러:', error);
    return NextResponse.json({
      success: false,
      message: '부서 수정 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: 부서 삭제
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

    await executeNonQuery('DELETE FROM departments WHERE id = @id', { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '부서가 삭제되었습니다',
    });
  } catch (error: unknown) {
    console.error('부서 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '부서 삭제 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 역할 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = `
      SELECT 
        id, code, name, description, permissions, status, 
        created_at as createdAt, 
        modified_at as modifiedAt
      FROM roles
      WHERE 1=1
    `;

    const params: Record<string, any> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    query += ` ORDER BY created_at DESC`;

    const roles = await executeQuery(query, params);

    // permissions JSON 파싱
    const parsedRoles = roles.map((role: any) => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));

    return NextResponse.json({
      success: true,
      data: parsedRoles,
      count: parsedRoles.length,
    });
  } catch (error: any) {
    console.error('역할 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '역할 조회 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: 역할 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, permissions, status = 'active' } = body;

    if (!code || !name) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요 (code, name)',
      }, { status: 400 });
    }

    const permissionsJson = JSON.stringify(permissions || []);

    const query = `
      INSERT INTO roles (code, name, description, permissions, status, created_at)
      VALUES (@code, @name, @description, @permissions, @status, GETDATE())
    `;

    await executeNonQuery(query, {
      code,
      name,
      description: description || '',
      permissions: permissionsJson,
      status
    });

    return NextResponse.json({
      success: true,
      message: '역할이 추가되었습니다',
    }, { status: 201 });
  } catch (error: any) {
    console.error('역할 추가 에러:', error);
    return NextResponse.json({
      success: false,
      message: '역할 추가 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: 역할 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, permissions, status } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'id는 필수입니다',
      }, { status: 400 });
    }

    const updateParts: string[] = [];
    const params: Record<string, any> = { id };

    if (name !== undefined) {
      updateParts.push('name = @name');
      params.name = name;
    }
    if (description !== undefined) {
      updateParts.push('description = @description');
      params.description = description;
    }
    if (permissions !== undefined) {
      updateParts.push('permissions = @permissions');
      params.permissions = JSON.stringify(permissions);
    }
    if (status !== undefined) {
      updateParts.push('status = @status');
      params.status = status;
    }

    if (updateParts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '수정할 항목이 없습니다',
      }, { status: 400 });
    }

    updateParts.push('modified_at = GETDATE()');

    const query = `
      UPDATE roles
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '역할 정보가 수정되었습니다',
    });
  } catch (error: any) {
    console.error('역할 수정 에러:', error);
    return NextResponse.json({
      success: false,
      message: '역할 수정 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE: 역할 삭제
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

    await executeNonQuery('DELETE FROM roles WHERE id = @id', { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '역할이 삭제되었습니다',
    });
  } catch (error: any) {
    console.error('역할 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '역할 삭제 실패',
      error: error.message,
    }, { status: 500 });
  }
}


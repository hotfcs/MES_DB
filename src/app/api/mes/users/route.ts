import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// 사용자 타입 정의
interface User {
  id: number;
  account: string;
  password: string;
  name: string;
  role: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  status: string;
  image?: string;
  last_login?: Date;
  join_date?: string;
  resign_date?: string;
  created_at: Date;
  modified_at?: Date;
}

// GET: 사용자 목록 조회 (최적화 버전)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, account, password, name, role, department, position, 
        phone, email, status, 
        CASE 
          WHEN LEN(image) > 100 THEN SUBSTRING(image, 1, 100) + '...' 
          ELSE image 
        END as image, 
        FORMAT(last_login, 'yyyy-MM-dd HH:mm:ss') as lastLogin, 
        FORMAT(join_date, 'yyyy-MM-dd') as joinDate, 
        FORMAT(resign_date, 'yyyy-MM-dd') as resignDate,
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt, 
        FORMAT(modified_at, 'yyyy-MM-dd HH:mm:ss') as modifiedAt
      FROM users WITH (NOLOCK)
      WHERE 1=1
    `;

    const params: Record<string, any> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    if (department) {
      query += ` AND department = @department`;
      params.department = department;
    }

    if (search) {
      query += ` AND (name LIKE @search + '%' OR account LIKE @search + '%')`;
      params.search = search;
    }

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM users WITH (NOLOCK) WHERE 1=1 ${
      status ? ' AND status = @status' : ''
    }${department ? ' AND department = @department' : ''}${
      search ? " AND (name LIKE @search + '%' OR account LIKE @search + '%')" : ''
    }`;

    const [countResult] = await executeQuery(countQuery, params);
    const total = countResult.total;

    query += ` ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;

    const users = await executeQuery<User>(query, params);

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('사용자 조회 에러:', error);
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
    const {
      account,
      password,
      name,
      role,
      department,
      position,
      phone,
      email,
      status = 'active',
      image,
      joinDate
    } = body;

    if (!account || !password || !name || !role || !department) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요 (account, password, name, role, department)',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO users (
        account, password, name, role, department, position,
        phone, email, status, image, join_date, created_at
      )
      VALUES (
        @account, @password, @name, @role, @department, @position,
        @phone, @email, @status, @image, @joinDate, GETDATE()
      )
    `;

    await executeNonQuery(query, {
      account,
      password,
      name,
      role,
      department,
      position: position || '',
      phone: phone || '',
      email: email || '',
      status,
      image: image || null,
      joinDate: joinDate || null
    });

    return NextResponse.json({
      success: true,
      message: '사용자가 추가되었습니다',
    }, { status: 201 });
  } catch (error: any) {
    console.error('사용자 추가 에러:', error);
    return NextResponse.json({
      success: false,
      message: '사용자 추가 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: 사용자 수정
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

    const allowedFields = [
      'password', 'name', 'role', 'department', 'position',
      'phone', 'email', 'status', 'image', 'join_date', 'resign_date'
    ];

    const updateParts: string[] = [];
    const params: Record<string, any> = { id };

    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updateParts.push(`${dbKey} = @${key}`);
        params[key] = value;
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
      UPDATE users
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    const rowsAffected = await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '사용자 정보가 수정되었습니다',
      rowsAffected,
    });
  } catch (error: any) {
    console.error('사용자 수정 에러:', error);
    return NextResponse.json({
      success: false,
      message: '사용자 수정 실패',
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
      message: '사용자가 삭제되었습니다',
      rowsAffected,
    });
  } catch (error: any) {
    console.error('사용자 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '사용자 삭제 실패',
      error: error.message,
    }, { status: 500 });
  }
}


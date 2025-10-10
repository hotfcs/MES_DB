import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 거래처 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        id, code, name, type, representative, 
        business_number as businessNumber, 
        phone, email, address, manager, 
        manager_phone as managerPhone, 
        status, 
        created_at as createdAt, 
        modified_at as modifiedAt
      FROM customers
      WHERE 1=1
    `;

    const params: Record<string, any> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    if (type) {
      query += ` AND type = @type`;
      params.type = type;
    }

    if (search) {
      query += ` AND (name LIKE '%' + @search + '%' OR code LIKE '%' + @search + '%')`;
      params.search = search;
    }

    query += ` ORDER BY created_at DESC`;

    const customers = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error: any) {
    console.error('거래처 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '거래처 조회 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: 거래처 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code, name, type, representative, businessNumber, phone, email,
      address, manager, managerPhone, status = 'active'
    } = body;

    if (!code || !name || !type) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요 (code, name, type)',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO customers (
        code, name, type, representative, business_number, phone, email,
        address, manager, manager_phone, status, created_at
      )
      VALUES (
        @code, @name, @type, @representative, @businessNumber, @phone, @email,
        @address, @manager, @managerPhone, @status, GETDATE()
      )
    `;

    await executeNonQuery(query, {
      code, name, type,
      representative: representative || '',
      businessNumber: businessNumber || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      manager: manager || '',
      managerPhone: managerPhone || '',
      status
    });

    return NextResponse.json({
      success: true,
      message: '거래처가 추가되었습니다',
    }, { status: 201 });
  } catch (error: any) {
    console.error('거래처 추가 에러:', error);
    return NextResponse.json({
      success: false,
      message: '거래처 추가 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: 거래처 수정
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

    const fieldMapping: Record<string, string> = {
      name: 'name',
      type: 'type',
      representative: 'representative',
      businessNumber: 'business_number',
      phone: 'phone',
      email: 'email',
      address: 'address',
      manager: 'manager',
      managerPhone: 'manager_phone',
      status: 'status'
    };

    const updateParts: string[] = [];
    const params: Record<string, any> = { id };

    Object.entries(updates).forEach(([key, value]) => {
      const dbField = fieldMapping[key];
      if (dbField) {
        updateParts.push(`${dbField} = @${key}`);
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
      UPDATE customers
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '거래처 정보가 수정되었습니다',
    });
  } catch (error: any) {
    console.error('거래처 수정 에러:', error);
    return NextResponse.json({
      success: false,
      message: '거래처 수정 실패',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE: 거래처 삭제
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

    await executeNonQuery('DELETE FROM customers WHERE id = @id', { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '거래처가 삭제되었습니다',
    });
  } catch (error: any) {
    console.error('거래처 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '거래처 삭제 실패',
      error: error.message,
    }, { status: 500 });
  }
}


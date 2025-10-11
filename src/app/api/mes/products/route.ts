import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 제품 목록 조회 (최적화 버전)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // 기본값 1000 (모든 데이터)
    const offset = (page - 1) * limit;

    // 필요한 컬럼만 선택 (네트워크 전송량 감소)
    let query = `
      SELECT 
        id, code, name, category, specification, unit,
        standard_cost as standardCost, 
        selling_price as sellingPrice, 
        customer, description, 
        image,
        status, 
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt, 
        FORMAT(modified_at, 'yyyy-MM-dd HH:mm:ss') as modifiedAt
      FROM products WITH (NOLOCK)
      WHERE 1=1
    `;

    const params: Record<string, string | number> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    if (category) {
      query += ` AND category = @category`;
      params.category = category;
    }

    if (search) {
      // 검색어가 있을 때만 LIKE 사용 (인덱스 활용)
      query += ` AND (name LIKE @search + '%' OR code LIKE @search + '%')`;
      params.search = search;
    }

    // 총 개수 조회 (페이지네이션용)
    const countQuery = `SELECT COUNT(*) as total FROM products WITH (NOLOCK) WHERE 1=1 ${
      status ? ' AND status = @status' : ''
    }${category ? ' AND category = @category' : ''}${
      search ? " AND (name LIKE @search + '%' OR code LIKE @search + '%')" : ''
    }`;

    const [countResult] = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult.total;

    // 정렬 및 페이지네이션
    query += ` ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;

    const products = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    console.error('제품 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '제품 조회 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST: 제품 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      category,
      specification,
      unit,
      standardCost,
      sellingPrice,
      customer,
      description,
      image,
      status = 'active'
    } = body;

    if (!code || !name || !category) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요 (code, name, category)',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO products (
        code, name, category, specification, unit,
        standard_cost, selling_price, customer, description,
        image, status, created_at
      )
      VALUES (
        @code, @name, @category, @specification, @unit,
        @standardCost, @sellingPrice, @customer, @description,
        @image, @status, GETDATE()
      )
    `;

    await executeNonQuery(query, {
      code,
      name,
      category,
      specification: specification || '',
      unit: unit || 'EA',
      standardCost: standardCost || 0,
      sellingPrice: sellingPrice || 0,
      customer: customer || '',
      description: description || '',
      image: image || null,
      status
    });

    return NextResponse.json({
      success: true,
      message: '제품이 추가되었습니다',
    }, { status: 201 });
  } catch (error: any) {
    console.error('제품 추가 에러:', error);
    
    // UNIQUE KEY 제약 조건 위반 (제품 코드 중복)
    if (error?.number === 2627) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 제품 코드입니다. 다른 코드를 사용해주세요.',
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: '제품 추가 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: 제품 수정
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
      'name', 'category', 'specification', 'unit',
      'standard_cost', 'selling_price', 'customer',
      'description', 'image', 'status'
    ];

    const updateParts: string[] = [];
    const params: Record<string, string | number | null> = { id };

    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updateParts.push(`${dbKey} = @${key}`);
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
      UPDATE products
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '제품 정보가 수정되었습니다',
    });
  } catch (error: any) {
    console.error('제품 수정 에러:', error);
    
    // UNIQUE KEY 제약 조건 위반 (제품 코드 중복)
    if (error?.number === 2627) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 제품 코드입니다. 다른 코드를 사용해주세요.',
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: '제품 수정 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: 제품 삭제
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

    await executeNonQuery('DELETE FROM products WHERE id = @id', { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '제품이 삭제되었습니다',
    });
  } catch (error: unknown) {
    console.error('제품 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '제품 삭제 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


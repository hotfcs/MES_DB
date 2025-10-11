import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 자재 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        id, code, name, category, specification, unit, 
        purchase_price as purchasePrice,
        supplier, description, image, status, 
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt, 
        FORMAT(modified_at, 'yyyy-MM-dd HH:mm:ss') as modifiedAt
      FROM materials
      WHERE 1=1
    `;

    const params: Record<string, string | number | null> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    if (category) {
      query += ` AND category = @category`;
      params.category = category;
    }

    if (search) {
      query += ` AND (name LIKE '%' + @search + '%' OR code LIKE '%' + @search + '%')`;
      params.search = search;
    }

    query += ` ORDER BY created_at DESC`;

    const materials = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: materials,
      count: materials.length,
    });
  } catch (error: unknown) {
    console.error('자재 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '자재 조회 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST, PUT, DELETE는 products와 유사하게 구현
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code, name, category, specification, unit, purchasePrice,
      supplier, description, image, status = 'active'
    } = body;

    if (!code || !name || !category) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요 (code, name, category)',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO materials (
        code, name, category, specification, unit, purchase_price,
        supplier, description, image, status, created_at
      )
      VALUES (
        @code, @name, @category, @specification, @unit, @purchasePrice,
        @supplier, @description, @image, @status, GETDATE()
      )
    `;

    await executeNonQuery(query, {
      code, name, category,
      specification: specification || '',
      unit: unit || 'EA',
      purchasePrice: purchasePrice || 0,
      supplier: supplier || '',
      description: description || '',
      image: image || null,
      status
    });

    return NextResponse.json({
      success: true,
      message: '자재가 추가되었습니다',
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('자재 추가 에러:', error);
    
    // UNIQUE KEY 제약 조건 위반 (자재 코드 중복)
    if ((error as { number?: number })?.number === 2627) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 자재 코드입니다. 다른 코드를 사용해주세요.',
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: '자재 추가 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

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
      category: 'category',
      specification: 'specification',
      unit: 'unit',
      purchasePrice: 'purchase_price',
      supplier: 'supplier',
      description: 'description',
      image: 'image',
      status: 'status'
    };

    const updateParts: string[] = [];
    const params: Record<string, string | number | null> = { id };

    Object.entries(updates).forEach(([key, value]) => {
      const dbField = fieldMapping[key as keyof typeof fieldMapping];
      if (dbField) {
        updateParts.push(`${dbField} = @${key}`);
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
      UPDATE materials
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '자재 정보가 수정되었습니다',
    });
  } catch (error: unknown) {
    console.error('자재 수정 에러:', error);
    
    // UNIQUE KEY 제약 조건 위반 (자재 코드 중복)
    if ((error as { number?: number })?.number === 2627) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 자재 코드입니다. 다른 코드를 사용해주세요.',
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: '자재 수정 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

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

    await executeNonQuery('DELETE FROM materials WHERE id = @id', { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '자재가 삭제되었습니다',
    });
  } catch (error: unknown) {
    console.error('자재 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '자재 삭제 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


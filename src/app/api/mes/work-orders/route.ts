import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 작업지시 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        id, 
        order_code as orderCode, 
        order_date as orderDate, 
        plan_code as planCode, 
        product_code as productCode, 
        product_name as productName,
        order_quantity as orderQuantity, 
        unit, 
        line, 
        start_date as startDate, 
        end_date as endDate, 
        status, 
        worker, 
        note,
        created_at as createdAt, 
        modified_at as modifiedAt
      FROM work_orders
      WHERE 1=1
    `;

    const params: Record<string, string | number | null> = {};

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }

    if (startDate) {
      query += ` AND order_date >= @startDate`;
      params.startDate = startDate;
    }

    if (endDate) {
      query += ` AND order_date <= @endDate`;
      params.endDate = endDate;
    }

    if (search) {
      query += ` AND (order_code LIKE '%' + @search + '%' OR product_name LIKE '%' + @search + '%')`;
      params.search = search;
    }

    query += ` ORDER BY order_date DESC, created_at DESC`;

    const orders = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error: unknown) {
    console.error('작업지시 조회 에러:', error);
    return NextResponse.json({
      success: false,
      message: '작업지시 조회 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST: 작업지시 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderCode,
      orderDate,
      planCode,
      productCode,
      productName,
      orderQuantity,
      unit,
      line,
      startDate,
      endDate,
      status = '대기',
      worker,
      note
    } = body;

    if (!orderCode || !orderDate || !productCode || !productName || !orderQuantity) {
      return NextResponse.json({
        success: false,
        message: '필수 항목을 입력해주세요',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO work_orders (
        order_code, order_date, plan_code, product_code, product_name,
        order_quantity, unit, line, start_date, end_date,
        status, worker, note, created_at
      )
      VALUES (
        @orderCode, @orderDate, @planCode, @productCode, @productName,
        @orderQuantity, @unit, @line, @startDate, @endDate,
        @status, @worker, @note, GETDATE()
      )
    `;

    await executeNonQuery(query, {
      orderCode,
      orderDate,
      planCode: planCode || '',
      productCode,
      productName,
      orderQuantity,
      unit: unit || 'EA',
      line: line || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status,
      worker: worker || '',
      note: note || ''
    });

    return NextResponse.json({
      success: true,
      message: '작업지시가 추가되었습니다',
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('작업지시 추가 에러:', error);
    return NextResponse.json({
      success: false,
      message: '작업지시 추가 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: 작업지시 수정
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
      'order_date', 'plan_code', 'product_code', 'product_name',
      'order_quantity', 'unit', 'line', 'start_date', 'end_date',
      'status', 'worker', 'note'
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
      UPDATE work_orders
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '작업지시가 수정되었습니다',
    });
  } catch (error: unknown) {
    console.error('작업지시 수정 에러:', error);
    return NextResponse.json({
      success: false,
      message: '작업지시 수정 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: 작업지시 삭제
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

    await executeNonQuery('DELETE FROM work_orders WHERE id = @id', { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '작업지시가 삭제되었습니다',
    });
  } catch (error: unknown) {
    console.error('작업지시 삭제 에러:', error);
    return NextResponse.json({
      success: false,
      message: '작업지시 삭제 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


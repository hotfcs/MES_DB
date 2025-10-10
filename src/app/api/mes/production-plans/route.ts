import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// GET: 생산계획 목록 조회
export async function GET() {
  try {
    const query = `
      SELECT 
        id, 
        plan_code as planCode, 
        plan_date as planDate, 
        product_code as productCode, 
        product_name as productName, 
        plan_quantity as planQuantity, 
        unit, 
        start_date as startDate, 
        end_date as endDate, 
        status, 
        manager, 
        note, 
        created_at as createdAt, 
        modified_at as modifiedAt 
      FROM production_plans 
      ORDER BY plan_date DESC
    `;
    const plans = await executeQuery(query);
    return NextResponse.json({ 
      success: true, 
      data: plans, 
      count: plans.length 
    });
  } catch (error: any) {
    console.error('생산계획 조회 에러:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST: 생산계획 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const planCode = body.planCode;
    const planDate = body.planDate;
    const productCode = body.productCode;
    const productName = body.productName;
    const planQuantity = body.planQuantity;
    const unit = body.unit || 'EA';
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;
    const planStatus = body.status || '계획';
    const manager = body.manager || '';
    const note = body.note || '';

    if (!planCode || !planDate || !productCode || !productName || !planQuantity) {
      return NextResponse.json({ 
        success: false, 
        message: '필수 항목 누락' 
      }, { status: 400 });
    }
    
    const query = `
      INSERT INTO production_plans (
        plan_code, plan_date, product_code, product_name, plan_quantity, 
        unit, start_date, end_date, status, manager, note, created_at
      ) 
      VALUES (
        @planCode, @planDate, @productCode, @productName, @planQuantity, 
        @unit, @startDate, @endDate, @status, @manager, @note, GETDATE()
      )
    `;

    await executeNonQuery(query, { 
      planCode, 
      planDate, 
      productCode, 
      productName, 
      planQuantity, 
      unit, 
      startDate, 
      endDate, 
      status: planStatus, 
      manager, 
      note 
    });

    return NextResponse.json({ 
      success: true,
      message: '생산계획이 추가되었습니다'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE: 생산계획 삭제
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ 
        success: false,
        message: 'id 필수' 
      }, { status: 400 });
    }

    await executeNonQuery('DELETE FROM production_plans WHERE id = @id', { 
      id: parseInt(id) 
    });

    return NextResponse.json({ 
      success: true,
      message: '생산계획이 삭제되었습니다'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}


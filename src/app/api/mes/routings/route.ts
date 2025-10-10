import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

export async function GET() {
  try {
    const routings = await executeQuery(`SELECT id, code, name, status, created_at, modified_at FROM routings ORDER BY created_at DESC`);
    const stepsRaw = await executeQuery(`
      SELECT 
        id, 
        routing_id as routingId, 
        sequence, 
        line, 
        process, 
        main_equipment as mainEquipment, 
        standard_man_hours as standardManHours, 
        previous_process as previousProcess, 
        next_process as nextProcess
      FROM routing_steps 
      ORDER BY routing_id, sequence
    `);
    
    return NextResponse.json({ 
      success: true, 
      data: { routings, routingSteps: stepsRaw },
      count: routings.length 
    });
  } catch (error: any) {
    console.error('라우팅 조회 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, name, status = 'active' } = await request.json();
    if (!code || !name) return NextResponse.json({ success: false, message: '필수 항목 누락' }, { status: 400 });
    
    await executeNonQuery(
      `INSERT INTO routings (code, name, status, created_at) VALUES (@code, @name, @status, GETDATE())`,
      { code, name, status }
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    await executeNonQuery('DELETE FROM routings WHERE id = @id', { id: parseInt(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


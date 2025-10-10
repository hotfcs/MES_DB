import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

export async function GET() {
  try {
    const bomsRaw = await executeQuery(`
      SELECT 
        id, 
        product_code as productCode, 
        product_name as productName, 
        routing_id as routingId, 
        routing_name as routingName, 
        revision, 
        status, 
        created_at as createdAt, 
        modified_at as modifiedAt 
      FROM boms 
      ORDER BY created_at DESC
    `);
    
    const itemsRaw = await executeQuery(`
      SELECT 
        id,
        bom_id as bomId,
        process_sequence as processSequence,
        process_name as processName,
        material_code as materialCode,
        material_name as materialName,
        quantity,
        unit,
        loss_rate as lossRate,
        alternate_material as alternateMaterial
      FROM bom_items 
      ORDER BY bom_id, process_sequence
    `);
    
    return NextResponse.json({ 
      success: true, 
      data: { boms: bomsRaw, bomItems: itemsRaw },
      count: bomsRaw.length 
    });
  } catch (error: any) {
    console.error('BOM 조회 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productCode, productName, routingId, routingName, revision, status = 'active' } = await request.json();
    if (!productCode || !productName) return NextResponse.json({ success: false, message: '필수 항목 누락' }, { status: 400 });
    
    await executeNonQuery(
      `INSERT INTO boms (product_code, product_name, routing_id, routing_name, revision, status, created_at) 
       VALUES (@productCode, @productName, @routingId, @routingName, @revision, @status, GETDATE())`,
      { productCode, productName, routingId: routingId || null, routingName: routingName || '', revision: revision || 'V1.0', status }
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
    await executeNonQuery('DELETE FROM boms WHERE id = @id', { id: parseInt(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


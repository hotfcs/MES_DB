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
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt, 
        FORMAT(modified_at, 'yyyy-MM-dd HH:mm:ss') as modifiedAt 
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
    
    // BOM별 라우팅 단계 스냅샷 조회
    const bomRoutingStepsRaw = await executeQuery(`
      SELECT 
        id,
        bom_id as bomId,
        sequence,
        line,
        process,
        main_equipment as mainEquipment,
        standard_man_hours as standardManHours,
        previous_process as previousProcess,
        next_process as nextProcess
      FROM bom_routing_steps 
      ORDER BY bom_id, sequence
    `);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        boms: bomsRaw, 
        bomItems: itemsRaw,
        bomRoutingSteps: bomRoutingStepsRaw 
      },
      count: bomsRaw.length 
    });
  } catch (error: unknown) {
    console.error('BOM 조회 에러:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productCode, productName, routingId, routingName, revision, status = 'active' } = await request.json();
    if (!productCode || !productName) return NextResponse.json({ success: false, message: '필수 항목 누락' }, { status: 400 });
    
    // Step 1: Insert BOM
    const result = await executeQuery(
      `INSERT INTO boms (product_code, product_name, routing_id, routing_name, revision, status, created_at) 
       OUTPUT INSERTED.id
       VALUES (@productCode, @productName, @routingId, @routingName, @revision, @status, GETDATE())`,
      { productCode, productName, routingId: routingId || null, routingName: routingName || '', revision: revision || 'V1.0', status }
    );
    
    const newBomId = result[0]?.id as number;
    
    // Step 2: Copy routing steps as snapshot if routingId is provided
    if (routingId && newBomId) {
      const routingSteps = await executeQuery(
        `SELECT 
          sequence,
          line,
          process,
          main_equipment as mainEquipment,
          standard_man_hours as standardManHours,
          previous_process as previousProcess,
          next_process as nextProcess
        FROM routing_steps 
        WHERE routing_id = @routingId
        ORDER BY sequence`,
        { routingId }
      );
      
      // Insert routing steps snapshot for this BOM
      for (const step of routingSteps) {
        await executeNonQuery(
          `INSERT INTO bom_routing_steps 
           (bom_id, sequence, line, process, main_equipment, standard_man_hours, previous_process, next_process, created_at) 
           VALUES (@bomId, @sequence, @line, @process, @mainEquipment, @standardManHours, @previousProcess, @nextProcess, GETDATE())`,
          {
            bomId: newBomId,
            sequence: step.sequence,
            line: step.line,
            process: step.process,
            mainEquipment: step.mainEquipment,
            standardManHours: step.standardManHours,
            previousProcess: step.previousProcess,
            nextProcess: step.nextProcess
          }
        );
      }
      
      console.log(`✅ BOM ${newBomId} 생성 완료. 라우팅 단계 ${routingSteps.length}개 스냅샷 저장됨.`);
    }
    
    return NextResponse.json({ success: true, data: { bomId: newBomId } }, { status: 201 });
  } catch (error: unknown) {
    console.error('BOM 추가 에러:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { bomId, items } = await request.json();
    
    if (!bomId || !items) {
      return NextResponse.json({ success: false, message: 'BOM ID와 자재 정보가 필요합니다.' }, { status: 400 });
    }

    // Transaction: Delete all existing items and insert new ones
    // Step 1: Delete existing items for this BOM
    await executeNonQuery('DELETE FROM bom_items WHERE bom_id = @bomId', { bomId });

    // Step 2: Insert new items
    for (const item of items) {
      await executeNonQuery(
        `INSERT INTO bom_items 
         (bom_id, process_sequence, process_name, material_code, material_name, quantity, unit, loss_rate, alternate_material) 
         VALUES (@bomId, @processSequence, @processName, @materialCode, @materialName, @quantity, @unit, @lossRate, @alternateMaterial)`,
        {
          bomId,
          processSequence: item.processSequence,
          processName: item.processName,
          materialCode: item.materialCode,
          materialName: item.materialName,
          quantity: item.quantity,
          unit: item.unit,
          lossRate: item.lossRate || 0,
          alternateMaterial: item.alternateMaterial || ''
        }
      );
    }

    // Update BOM's modified_at timestamp
    await executeNonQuery(
      'UPDATE boms SET modified_at = GETDATE() WHERE id = @bomId',
      { bomId }
    );

    console.log(`✅ BOM ${bomId} 자재 저장 완료. ${items.length}개 항목 저장됨.`);
    return NextResponse.json({ success: true, message: 'BOM 자재가 저장되었습니다.' });
  } catch (error: unknown) {
    console.error('BOM 자재 저장 에러:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    await executeNonQuery('DELETE FROM boms WHERE id = @id', { id: parseInt(id) });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


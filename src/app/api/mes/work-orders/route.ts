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
        FORMAT(order_date, 'yyyy-MM-dd') as orderDate, 
        plan_code as planCode, 
        product_code as productCode, 
        product_name as productName,
        order_quantity as orderQuantity, 
        unit, 
        line, 
        FORMAT(start_date, 'yyyy-MM-dd') as startDate, 
        FORMAT(end_date, 'yyyy-MM-dd') as endDate, 
        status, 
        worker, 
        note,
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') as createdAt, 
        FORMAT(modified_at, 'yyyy-MM-dd HH:mm:ss') as modifiedAt
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

    // Get routing steps and materials for all work orders
    const routingSteps = await executeQuery(`
      SELECT 
        id,
        work_order_id as workOrderId,
        sequence,
        line,
        process,
        main_equipment as mainEquipment,
        standard_man_hours as standardManHours,
        previous_process as previousProcess,
        next_process as nextProcess
      FROM work_order_routing_steps
      ORDER BY work_order_id, sequence
    `);

    const materials = await executeQuery(`
      SELECT 
        id,
        work_order_id as workOrderId,
        process_sequence as processSequence,
        process_name as processName,
        material_code as materialCode,
        material_name as materialName,
        quantity,
        unit,
        loss_rate as lossRate,
        alternate_material as alternateMaterial
      FROM work_order_materials
      ORDER BY work_order_id, process_sequence
    `);

    return NextResponse.json({
      success: true,
      data: {
        workOrders: orders,
        workOrderRoutingSteps: routingSteps,
        workOrderMaterials: materials
      },
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

    // Step 1: Insert work order and get ID
    const result = await executeQuery(`
      INSERT INTO work_orders (
        order_code, order_date, plan_code, product_code, product_name,
        order_quantity, unit, line, start_date, end_date,
        status, worker, note, created_at
      )
      OUTPUT INSERTED.id
      VALUES (
        @orderCode, @orderDate, @planCode, @productCode, @productName,
        @orderQuantity, @unit, @line, @startDate, @endDate,
        @status, @worker, @note, GETDATE()
      )
    `, {
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

    const workOrderId = result[0]?.id;

    if (!workOrderId) {
      throw new Error('작업지시 ID를 가져올 수 없습니다.');
    }

    // Step 2: Find the latest BOM revision for this product
    const latestBOM = await executeQuery(`
      SELECT TOP 1 id, revision
      FROM boms
      WHERE product_code = @productCode AND status = 'active'
      ORDER BY 
        CAST(SUBSTRING(revision, 5, LEN(revision) - 4) AS INT) DESC,
        created_at DESC
    `, { productCode });

    if (latestBOM && latestBOM.length > 0) {
      const bomId = latestBOM[0].id;
      console.log(`📋 제품 ${productCode}의 최종 BOM: ${latestBOM[0].revision} (ID: ${bomId})`);

      // Step 3: Copy BOM routing steps to work order routing steps
      const bomRoutingSteps = await executeQuery(`
        SELECT 
          sequence, line, process, main_equipment as mainEquipment,
          standard_man_hours as standardManHours,
          previous_process as previousProcess,
          next_process as nextProcess
        FROM bom_routing_steps
        WHERE bom_id = @bomId
        ORDER BY sequence
      `, { bomId });

      for (const step of bomRoutingSteps) {
        await executeNonQuery(`
          INSERT INTO work_order_routing_steps 
          (work_order_id, sequence, line, process, main_equipment, standard_man_hours, previous_process, next_process, created_at)
          VALUES (@workOrderId, @sequence, @line, @process, @mainEquipment, @standardManHours, @previousProcess, @nextProcess, GETDATE())
        `, {
          workOrderId,
          sequence: step.sequence,
          line: step.line,
          process: step.process,
          mainEquipment: step.mainEquipment,
          standardManHours: step.standardManHours,
          previousProcess: step.previousProcess,
          nextProcess: step.nextProcess
        });
      }

      console.log(`✅ 라우팅 단계 ${bomRoutingSteps.length}개 스냅샷 저장됨`);

      // Step 4: Copy BOM items (materials) to work order materials
      const bomItems = await executeQuery(`
        SELECT 
          process_sequence as processSequence,
          process_name as processName,
          material_code as materialCode,
          material_name as materialName,
          quantity,
          unit,
          loss_rate as lossRate,
          alternate_material as alternateMaterial
        FROM bom_items
        WHERE bom_id = @bomId
        ORDER BY process_sequence
      `, { bomId });

      for (const item of bomItems) {
        await executeNonQuery(`
          INSERT INTO work_order_materials 
          (work_order_id, process_sequence, process_name, material_code, material_name, quantity, unit, loss_rate, alternate_material, created_at)
          VALUES (@workOrderId, @processSequence, @processName, @materialCode, @materialName, @quantity, @unit, @lossRate, @alternateMaterial, GETDATE())
        `, {
          workOrderId,
          processSequence: item.processSequence,
          processName: item.processName,
          materialCode: item.materialCode,
          materialName: item.materialName,
          quantity: item.quantity,
          unit: item.unit,
          lossRate: item.lossRate || 0,
          alternateMaterial: item.alternateMaterial || ''
        });
      }

      console.log(`✅ 자재 정보 ${bomItems.length}개 스냅샷 저장됨`);
      console.log(`🎉 작업지시 ${workOrderId} 생성 완료 (BOM: ${latestBOM[0].revision})`);
    } else {
      console.log(`⚠️ 제품 ${productCode}의 BOM이 없습니다. 작업지시만 생성됨.`);
    }

    return NextResponse.json({
      success: true,
      message: '작업지시가 추가되었습니다',
      data: { workOrderId }
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


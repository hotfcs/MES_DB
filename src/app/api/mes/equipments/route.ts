import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

export async function GET() {
  try {
    const query = `
      SELECT 
        id, code, name, type, manufacturer, model, 
        purchase_date as purchaseDate, 
        line, manager, description, status, 
        created_at as createdAt, 
        modified_at as modifiedAt 
      FROM equipments 
      ORDER BY created_at DESC
    `;
    const equipments = await executeQuery(query);
    return NextResponse.json({ success: true, data: equipments, count: equipments.length });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, name, type, manufacturer, model, purchaseDate, line, manager, description, status = 'active' } = await request.json();
    if (!code || !name) return NextResponse.json({ success: false, message: '필수 항목 누락' }, { status: 400 });
    
    await executeNonQuery(
      `INSERT INTO equipments (code, name, type, manufacturer, model, purchase_date, line, manager, description, status, created_at) 
       VALUES (@code, @name, @type, @manufacturer, @model, @purchaseDate, @line, @manager, @description, @status, GETDATE())`,
      { code, name, type: type || '', manufacturer: manufacturer || '', model: model || '', purchaseDate: purchaseDate || null, line: line || '', manager: manager || '', description: description || '', status }
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false }, { status: 400 });

    const fieldMapping: Record<string, string> = {
      name: 'name', type: 'type', manufacturer: 'manufacturer', model: 'model',
      purchaseDate: 'purchase_date', line: 'line', manager: 'manager', description: 'description', status: 'status'
    };

    const setParts = Object.keys(updates).map(k => fieldMapping[k] ? `${fieldMapping[k]} = @${k}` : null).filter(Boolean);
    if (setParts.length === 0) return NextResponse.json({ success: false }, { status: 400 });

    await executeNonQuery(`UPDATE equipments SET ${setParts.join(', ')}, modified_at = GETDATE() WHERE id = @id`, { id, ...updates });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    await executeNonQuery('DELETE FROM equipments WHERE id = @id', { id: parseInt(id) });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


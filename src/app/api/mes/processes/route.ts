import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

export async function GET() {
  try {
    const query = `
      SELECT 
        id, code, name, type, 
        standard_time as standardTime, 
        line, warehouse, description, status, 
        created_at as createdAt, 
        modified_at as modifiedAt 
      FROM processes 
      ORDER BY created_at DESC
    `;
    const processes = await executeQuery(query);
    return NextResponse.json({ success: true, data: processes, count: processes.length });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, name, type, standardTime, line, warehouse, description, status = 'active' } = await request.json();
    if (!code || !name) return NextResponse.json({ success: false, message: '필수 항목 누락' }, { status: 400 });
    
    await executeNonQuery(
      `INSERT INTO processes (code, name, type, standard_time, line, warehouse, description, status, created_at) 
       VALUES (@code, @name, @type, @standardTime, @line, @warehouse, @description, @status, GETDATE())`,
      { code, name, type: type || '', standardTime: standardTime || 0, line: line || '', warehouse: warehouse || '', description: description || '', status }
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
      name: 'name', type: 'type', standardTime: 'standard_time',
      line: 'line', warehouse: 'warehouse', description: 'description', status: 'status'
    };

    const setParts = Object.keys(updates).map(k => fieldMapping[k] ? `${fieldMapping[k]} = @${k}` : null).filter(Boolean);
    if (setParts.length === 0) return NextResponse.json({ success: false }, { status: 400 });

    await executeNonQuery(`UPDATE processes SET ${setParts.join(', ')}, modified_at = GETDATE() WHERE id = @id`, { id, ...updates });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    await executeNonQuery('DELETE FROM processes WHERE id = @id', { id: parseInt(id) });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


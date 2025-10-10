import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT 
        id, code, name, location, capacity, manager, description, status, 
        created_at as createdAt, 
        modified_at as modifiedAt 
      FROM lines 
      ORDER BY created_at DESC
    `;
    const lines = await executeQuery(query);
    return NextResponse.json({ success: true, data: lines, count: lines.length });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, name, location, capacity, manager, description, status = 'active' } = await request.json();
    if (!code || !name) return NextResponse.json({ success: false, message: '필수 항목 누락' }, { status: 400 });
    
    await executeNonQuery(
      `INSERT INTO lines (code, name, location, capacity, manager, description, status, created_at) VALUES (@code, @name, @location, @capacity, @manager, @description, @status, GETDATE())`,
      { code, name, location: location || '', capacity: capacity || 0, manager: manager || '', description: description || '', status }
    );
    return NextResponse.json({ success: true, message: '라인이 추가되었습니다' }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: 'id 필수' }, { status: 400 });

    const fields = ['name', 'location', 'capacity', 'manager', 'description', 'status'];
    const setParts = Object.keys(updates).filter(k => fields.includes(k)).map(k => `${k} = @${k}`);
    if (setParts.length === 0) return NextResponse.json({ success: false }, { status: 400 });

    await executeNonQuery(`UPDATE lines SET ${setParts.join(', ')}, modified_at = GETDATE() WHERE id = @id`, { id, ...updates });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id 필수' }, { status: 400 });
    await executeNonQuery('DELETE FROM lines WHERE id = @id', { id: parseInt(id) });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


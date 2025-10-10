import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeNonQuery } from '@/lib/db-queries';

// 상품 타입 정의
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
}

// GET: 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    let query = `
      SELECT id, name, price, stock, created_at
      FROM products
      WHERE 1=1
    `;

    const params: Record<string, string | number | null> = {};

    if (search) {
      query += ` AND name LIKE '%' + @search + '%'`;
      params.search = search;
    }

    if (minPrice) {
      query += ` AND price >= @minPrice`;
      params.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      query += ` AND price <= @maxPrice`;
      params.maxPrice = parseFloat(maxPrice);
    }

    query += ` ORDER BY created_at DESC`;

    const products = await executeQuery<Product>(query, params);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      message: '상품 조회 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST: 상품 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, stock = 0 } = body;

    if (!name || price === undefined) {
      return NextResponse.json({
        success: false,
        message: 'name과 price는 필수입니다',
      }, { status: 400 });
    }

    const query = `
      INSERT INTO products (name, price, stock, created_at)
      VALUES (@name, @price, @stock, GETDATE())
    `;

    const rowsAffected = await executeNonQuery(query, { name, price, stock });

    return NextResponse.json({
      success: true,
      message: '상품 추가 성공',
      rowsAffected,
    }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      message: '상품 추가 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT: 상품 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, price, stock } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'id는 필수입니다',
      }, { status: 400 });
    }

    const updates: string[] = [];
    const params: Record<string, string | number | null> = { id };

    if (name !== undefined) {
      updates.push('name = @name');
      params.name = name;
    }
    if (price !== undefined) {
      updates.push('price = @price');
      params.price = price;
    }
    if (stock !== undefined) {
      updates.push('stock = @stock');
      params.stock = stock;
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        message: '수정할 내용이 없습니다',
      }, { status: 400 });
    }

    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = @id
    `;

    const rowsAffected = await executeNonQuery(query, params);

    return NextResponse.json({
      success: true,
      message: '상품 수정 성공',
      rowsAffected,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      message: '상품 수정 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE: 상품 삭제
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

    const query = 'DELETE FROM products WHERE id = @id';
    const rowsAffected = await executeNonQuery(query, { id: parseInt(id) });

    return NextResponse.json({
      success: true,
      message: '상품 삭제 성공',
      rowsAffected,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      message: '상품 삭제 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


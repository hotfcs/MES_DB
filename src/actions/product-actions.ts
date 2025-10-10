'use server';

import { executeQuery, executeNonQuery } from '@/lib/db-queries';
import { revalidatePath } from 'next/cache';
import { Product, ActionResponse } from '@/types/database';

// 상품 목록 조회
export async function getProducts(): Promise<ActionResponse<Product[]>> {
  try {
    const query = `
      SELECT id, name, price, stock, created_at
      FROM products
      ORDER BY created_at DESC
    `;

    const products = await executeQuery<Product>(query);

    return {
      success: true,
      data: products,
    };
  } catch (error: any) {
    console.error('상품 조회 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 상품 추가
export async function addProduct(formData: FormData): Promise<ActionResponse> {
  try {
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string) || 0;

    if (!name || isNaN(price)) {
      return {
        success: false,
        error: 'name과 price는 필수입니다',
      };
    }

    const query = `
      INSERT INTO products (name, price, stock, created_at)
      VALUES (@name, @price, @stock, GETDATE())
    `;

    await executeNonQuery(query, { name, price, stock });
    revalidatePath('/examples/azure-sql-server-actions');

    return { success: true };
  } catch (error: any) {
    console.error('상품 추가 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 상품 수정
export async function updateProduct(
  id: number,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);

    const updates: string[] = [];
    const params: Record<string, any> = { id };

    if (name) {
      updates.push('name = @name');
      params.name = name;
    }
    if (!isNaN(price)) {
      updates.push('price = @price');
      params.price = price;
    }
    if (!isNaN(stock)) {
      updates.push('stock = @stock');
      params.stock = stock;
    }

    if (updates.length === 0) {
      return {
        success: false,
        error: '수정할 내용이 없습니다',
      };
    }

    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = @id
    `;

    await executeNonQuery(query, params);
    revalidatePath('/examples/azure-sql-server-actions');

    return { success: true };
  } catch (error: any) {
    console.error('상품 수정 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// 상품 삭제
export async function deleteProduct(id: number): Promise<ActionResponse> {
  try {
    const query = 'DELETE FROM products WHERE id = @id';
    await executeNonQuery(query, { id });
    revalidatePath('/examples/azure-sql-server-actions');

    return { success: true };
  } catch (error: any) {
    console.error('상품 삭제 에러:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}


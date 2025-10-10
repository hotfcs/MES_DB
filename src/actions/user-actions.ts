'use server';

import { executeQuery, executeNonQuery } from '@/lib/db-queries';
import { revalidatePath } from 'next/cache';
import { User, ActionResponse } from '@/types/database';

// 사용자 목록 조회
export async function getUsers(): Promise<ActionResponse<User[]>> {
  try {
    const query = `
      SELECT TOP 100 
        id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
    `;

    const users = await executeQuery<User>(query);

    return {
      success: true,
      data: users,
    };
  } catch (error: unknown) {
    console.error('사용자 조회 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 사용자 추가
export async function addUser(formData: FormData): Promise<ActionResponse> {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
      return {
        success: false,
        error: 'name과 email은 필수입니다',
      };
    }

    const query = `
      INSERT INTO users (name, email, created_at)
      VALUES (@name, @email, GETDATE())
    `;

    await executeNonQuery(query, { name, email });
    revalidatePath('/examples/azure-sql-server-actions');

    return { success: true };
  } catch (error: unknown) {
    console.error('사용자 추가 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 사용자 삭제
export async function deleteUser(id: number): Promise<ActionResponse> {
  try {
    const query = 'DELETE FROM users WHERE id = @id';
    await executeNonQuery(query, { id });
    revalidatePath('/examples/azure-sql-server-actions');

    return { success: true };
  } catch (error: unknown) {
    console.error('사용자 삭제 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 사용자 검색
export async function searchUsers(searchTerm: string): Promise<ActionResponse<User[]>> {
  try {
    const query = `
      SELECT id, name, email, created_at
      FROM users
      WHERE name LIKE '%' + @searchTerm + '%' 
         OR email LIKE '%' + @searchTerm + '%'
      ORDER BY created_at DESC
    `;

    const users = await executeQuery<User>(query, { searchTerm });

    return {
      success: true,
      data: users,
    };
  } catch (error: unknown) {
    console.error('사용자 검색 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


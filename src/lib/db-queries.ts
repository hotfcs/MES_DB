import { getDbConnection, sql } from './db';

/**
 * 쿼리 실행 헬퍼 함수들
 */

// SELECT 쿼리 실행
export async function executeQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  try {
    const pool = await getDbConnection();
    const request = pool.request();

    // 파라미터 바인딩
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(query);
    return result.recordset as T[];
  } catch (error) {
    console.error('쿼리 실행 에러:', error);
    throw error;
  }
}

// INSERT/UPDATE/DELETE 쿼리 실행
export async function executeNonQuery(
  query: string,
  params?: Record<string, any>
): Promise<number> {
  try {
    const pool = await getDbConnection();
    const request = pool.request();

    // 파라미터 바인딩
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(query);
    return result.rowsAffected[0];
  } catch (error) {
    console.error('쿼리 실행 에러:', error);
    throw error;
  }
}

// Stored Procedure 실행
export async function executeStoredProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  try {
    const pool = await getDbConnection();
    const request = pool.request();

    // 파라미터 바인딩
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.execute(procedureName);
    return result.recordset as T[];
  } catch (error) {
    console.error('Stored Procedure 실행 에러:', error);
    throw error;
  }
}

// 트랜잭션 실행
export async function executeTransaction(
  callback: (transaction: sql.Transaction) => Promise<void>
): Promise<void> {
  const pool = await getDbConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    await callback(transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('트랜잭션 에러:', error);
    throw error;
  }
}


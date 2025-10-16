/**
 * 챗봇 데이터베이스 조회 함수
 */

import { executeQuery } from './db-queries';
import type { ChatSession, ChatMessage, CreateChatMessageDto } from '@/types/database';

// ====================================
// 세션 관리
// ====================================

/**
 * 새 챗봇 세션 생성
 */
export async function createChatSession(userId: number, sessionName?: string): Promise<number> {
  const query = `
    INSERT INTO ChatSessions (user_id, session_name)
    VALUES (@userId, @sessionName);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
  `;
  
  const result = await executeQuery(query, {
    userId,
    sessionName: sessionName || null
  }) as unknown as Array<{ id: number }>;
  
  return result[0].id;
}

/**
 * 사용자의 활성 세션 조회
 */
export async function getUserActiveSessions(userId: number): Promise<ChatSession[]> {
  const query = `
    SELECT id, user_id, session_name, created_at, updated_at, is_active
    FROM ChatSessions
    WHERE user_id = @userId AND is_active = 1
    ORDER BY updated_at DESC;
  `;
  
  const result = await executeQuery(query, { userId }) as unknown as ChatSession[];
  return result;
}

/**
 * 세션 정보 조회
 */
export async function getChatSession(sessionId: number): Promise<ChatSession | null> {
  const query = `
    SELECT id, user_id, session_name, created_at, updated_at, is_active
    FROM ChatSessions
    WHERE id = @sessionId;
  `;
  
  const result = await executeQuery(query, { sessionId }) as unknown as ChatSession[];
  return result.length > 0 ? result[0] : null;
}

/**
 * 세션 업데이트 시간 갱신
 */
export async function updateSessionTimestamp(sessionId: number): Promise<void> {
  const query = `
    UPDATE ChatSessions
    SET updated_at = GETDATE()
    WHERE id = @sessionId;
  `;
  
  await executeQuery(query, { sessionId });
}

// ====================================
// 메시지 관리
// ====================================

/**
 * 챗 메시지 저장
 */
export async function saveChatMessage(message: CreateChatMessageDto): Promise<number> {
  const query = `
    INSERT INTO ChatHistory (session_id, user_id, role, content, function_name, function_arguments, function_result)
    VALUES (@sessionId, @userId, @role, @content, @functionName, @functionArguments, @functionResult);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
  `;
  
  const result = await executeQuery(query, {
    sessionId: message.session_id,
    userId: message.user_id,
    role: message.role,
    content: message.content,
    functionName: message.function_name || null,
    functionArguments: message.function_arguments || null,
    functionResult: message.function_result || null
  }) as unknown as Array<{ id: number }>;
  
  return result[0].id;
}

/**
 * 세션의 대화 이력 조회
 */
export async function getChatHistory(sessionId: number, limit: number = 50): Promise<ChatMessage[]> {
  const query = `
    SELECT TOP (@limit) 
      id, session_id, user_id, role, content, 
      function_name, function_arguments, function_result, created_at
    FROM ChatHistory
    WHERE session_id = @sessionId
    ORDER BY created_at DESC;
  `;
  
  const result = await executeQuery(query, { sessionId, limit }) as unknown as ChatMessage[];
  return result.reverse(); // 오래된 것부터 최신 순으로 정렬
}

/**
 * 최근 대화 컨텍스트 조회 (OpenAI에 전송용)
 */
export async function getRecentContext(sessionId: number, messageCount: number = 10): Promise<Array<{role: string; content: string}>> {
  const query = `
    SELECT TOP (@messageCount) role, content
    FROM ChatHistory
    WHERE session_id = @sessionId
    ORDER BY created_at DESC;
  `;
  
  const result = await executeQuery(query, { sessionId, messageCount }) as unknown as Array<{role: string; content: string}>;
  return result.reverse();
}

// ====================================
// MES 데이터 조회 함수 (챗봇이 호출할 수 있는 함수들)
// ====================================

/**
 * 제품 정보 조회
 */
export async function searchProducts(keyword?: string, limit: number = 10) {
  let query = `
    SELECT TOP (@limit) 
      code, name, category, specification, unit, 
      standard_cost as standardCost, selling_price as sellingPrice, status
    FROM products
  `;
  
  const params: Record<string, string | number | boolean | null> = { limit };
  
  if (keyword) {
    query += ` WHERE name LIKE @keyword OR code LIKE @keyword`;
    params.keyword = `%${keyword}%`;
  }
  
  query += ` ORDER BY code`;
  
  return await executeQuery(query, params);
}

/**
 * 작업 지시 조회
 */
export async function searchWorkOrders(status?: string, limit: number = 10) {
  let query = `
    SELECT TOP (@limit) 
      order_code as orderCode, 
      product_code as productCode,
      product_name as productName,
      order_quantity as orderQuantity,
      unit, line, 
      start_date as startDate, 
      end_date as endDate,
      status, worker
    FROM work_orders
  `;
  
  const params: Record<string, string | number | boolean | null> = { limit };
  
  if (status) {
    query += ` WHERE status = @status`;
    params.status = status;
  }
  
  query += ` ORDER BY created_at DESC`;
  
  return await executeQuery(query, params);
}

/**
 * 설비 정보 조회
 */
export async function searchEquipments(keyword?: string) {
  let query = `
    SELECT 
      code, name, type, status, 
      line, location, description
    FROM equipments
  `;
  
  const params: Record<string, string | number | boolean | null> = {};
  
  if (keyword) {
    query += ` WHERE name LIKE @keyword OR code LIKE @keyword`;
    params.keyword = `%${keyword}%`;
  }
  
  query += ` ORDER BY code`;
  
  return await executeQuery(query, params);
}

/**
 * 자재 재고 조회
 */
export async function searchMaterials(keyword?: string, lowStock: boolean = false) {
  let query = `
    SELECT 
      code, name, category, specification,
      unit, purchase_price as purchasePrice,
      supplier, status
    FROM materials
  `;
  
  const params: Record<string, string | number | boolean | null> = {};
  const conditions: string[] = [];
  
  if (keyword) {
    conditions.push(`(name LIKE @keyword OR code LIKE @keyword)`);
    params.keyword = `%${keyword}%`;
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY code`;
  
  return await executeQuery(query, params);
}

/**
 * 생산 계획 조회
 */
export async function searchProductionPlans(status?: string, limit: number = 10) {
  let query = `
    SELECT TOP (@limit)
      plan_code as planCode, 
      product_code as productCode,
      product_name as productName,
      plan_quantity as planQuantity,
      unit,
      FORMAT(start_date, 'yyyy-MM-dd') as startDate, 
      FORMAT(end_date, 'yyyy-MM-dd') as endDate,
      status, manager, note
    FROM production_plans
  `;
  
  const params: Record<string, string | number | boolean | null> = { limit };
  
  if (status) {
    query += ` WHERE status = @status`;
    params.status = status;
  }
  
  query += ` ORDER BY created_at DESC`;
  
  return await executeQuery(query, params);
}

/**
 * 사용자 정보 조회
 */
export async function searchUsers(keyword?: string) {
  let query = `
    SELECT 
      u.account, u.name, u.email, u.phone,
      u.department, u.position, u.role
    FROM users u
  `;
  
  const params: Record<string, string | number | boolean | null> = {};
  
  if (keyword) {
    query += ` WHERE u.name LIKE @keyword OR u.account LIKE @keyword`;
    params.keyword = `%${keyword}%`;
  }
  
  query += ` ORDER BY u.account`;
  
  return await executeQuery(query, params);
}


/**
 * 챗봇 메시지 전송 API
 * POST /api/chat/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/openai-helper';
import {
  createChatSession,
  saveChatMessage,
  getChatSession,
  getRecentContext,
  updateSessionTimestamp,
} from '@/lib/chat-queries';
import type { ChatRequest, ChatResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = (await request.json()) as ChatRequest & { user_id: number };
    const { message, session_id, user_id } = body;

    // 유효성 검사
    if (!message || !message.trim()) {
      return NextResponse.json<ChatResponse>(
        {
          success: false,
          error: '메시지를 입력해주세요.',
        },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json<ChatResponse>(
        {
          success: false,
          error: '사용자 인증이 필요합니다.',
        },
        { status: 401 }
      );
    }

    // 세션 처리
    let sessionId = session_id;

    if (sessionId) {
      // 기존 세션 확인
      const existingSession = await getChatSession(sessionId);
      if (!existingSession) {
        return NextResponse.json<ChatResponse>(
          {
            success: false,
            error: '유효하지 않은 세션입니다.',
          },
          { status: 404 }
        );
      }
      
      if (existingSession.user_id !== user_id) {
        return NextResponse.json<ChatResponse>(
          {
            success: false,
            error: '권한이 없습니다.',
          },
          { status: 403 }
        );
      }
    } else {
      // 새 세션 생성
      sessionId = await createChatSession(user_id, '새 대화');
    }

    // 사용자 메시지 저장
    await saveChatMessage({
      session_id: sessionId,
      user_id: user_id,
      role: 'user',
      content: message,
    });

    // 최근 대화 컨텍스트 조회
    const recentContext = await getRecentContext(sessionId, 10);

    // OpenAI API 호출
    const { response: aiResponse, functionCalls } = await generateChatResponse(
      recentContext.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))
    );

    // AI 응답 저장
    await saveChatMessage({
      session_id: sessionId,
      user_id: user_id,
      role: 'assistant',
      content: aiResponse,
      function_name: functionCalls?.[0]?.name,
      function_arguments: functionCalls?.[0]?.arguments,
      function_result: functionCalls?.[0]?.result,
    });

    // 세션 업데이트 시간 갱신
    await updateSessionTimestamp(sessionId);

    return NextResponse.json<ChatResponse>({
      success: true,
      session_id: sessionId,
      response: aiResponse,
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json<ChatResponse>(
      {
        success: false,
        error: `챗봇 응답 생성 중 오류가 발생했습니다: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}


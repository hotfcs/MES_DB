/**
 * 챗봇 대화 이력 조회 API
 * GET /api/chat/history?session_id=1
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getChatHistory,
  getUserActiveSessions,
  getChatSession,
} from '@/lib/chat-queries';
import type { ApiResponse, ChatMessage, ChatSession } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionIdParam = searchParams.get('session_id');
    const userIdParam = searchParams.get('user_id');

    // 사용자 ID 확인
    if (!userIdParam) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '사용자 인증이 필요합니다.',
        },
        { status: 401 }
      );
    }

    const userId = parseInt(userIdParam, 10);

    // 세션 ID가 있으면 해당 세션의 대화 이력 반환
    if (sessionIdParam) {
      const sessionId = parseInt(sessionIdParam, 10);

      // 세션 소유권 확인
      const session = await getChatSession(sessionId);
      if (!session) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: '유효하지 않은 세션입니다.',
          },
          { status: 404 }
        );
      }

      if (session.user_id !== userId) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: '권한이 없습니다.',
          },
          { status: 403 }
        );
      }

      const history = await getChatHistory(sessionId);

      return NextResponse.json<ApiResponse<ChatMessage[]>>({
        success: true,
        data: history,
      });
    }

    // 세션 ID가 없으면 사용자의 활성 세션 목록 반환
    const sessions = await getUserActiveSessions(userId);

    return NextResponse.json<ApiResponse<ChatSession[]>>({
      success: true,
      data: sessions,
    });
  } catch (error: unknown) {
    console.error('Chat history API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: `대화 이력 조회 중 오류가 발생했습니다: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}


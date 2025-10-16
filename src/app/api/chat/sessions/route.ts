/**
 * 챗봇 세션 관리 API
 * POST /api/chat/sessions - 새 세션 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createChatSession } from '@/lib/chat-queries';
import type { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { user_id: number; session_name?: string };
    const { user_id, session_name } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '사용자 인증이 필요합니다.',
        },
        { status: 401 }
      );
    }

    const sessionId = await createChatSession(user_id, session_name);

    return NextResponse.json<ApiResponse<{ session_id: number }>>({
      success: true,
      data: { session_id: sessionId },
    });
  } catch (error: unknown) {
    console.error('Create session API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: `세션 생성 중 오류가 발생했습니다: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}


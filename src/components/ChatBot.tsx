'use client';

/**
 * 챗봇 메인 컴포넌트
 */

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/database';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatBotProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot = ({ userId, isOpen, onClose }: ChatBotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤을 최하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 세션 로드
  useEffect(() => {
    if (isOpen && userId) {
      loadHistory();
    }
  }, [isOpen, userId]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?user_id=${userId}`);
      const data = await response.json() as { success: boolean; data?: Array<{ id: number }> };

      if (data.success && data.data && data.data.length > 0) {
        // 가장 최근 세션 사용
        const latestSessionId = data.data[0].id;
        setSessionId(latestSessionId);

        // 해당 세션의 대화 이력 로드
        const historyResponse = await fetch(
          `/api/chat/history?user_id=${userId}&session_id=${latestSessionId}`
        );
        const historyData = await historyResponse.json() as { success: boolean; data?: ChatMessage[] };

        if (historyData.success && historyData.data) {
          setMessages(historyData.data);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // 사용자 메시지를 즉시 UI에 추가
    const userMessage: ChatMessage = {
      id: Date.now(),
      session_id: sessionId || 0,
      user_id: userId,
      role: 'user',
      content: message,
      created_at: new Date(),
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as {
        success: boolean;
        response?: string;
        session_id?: number;
        error?: string;
      };

      if (data.success && data.response) {
        // 세션 ID 저장
        if (data.session_id) {
          setSessionId(data.session_id);
        }

        // AI 응답 추가
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          session_id: data.session_id || sessionId || 0,
          user_id: userId,
          role: 'assistant',
          content: data.response,
          created_at: new Date(),
        };

        setMessages((prev: ChatMessage[]) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 에러 메시지 추가
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: sessionId || 0,
        user_id: userId,
        role: 'assistant',
        content: `죄송합니다. 오류가 발생했습니다: ${errorMessage}`,
        created_at: new Date(),
      };

      setMessages((prev: ChatMessage[]) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json() as {
        success: boolean;
        data?: { session_id: number };
      };

      if (data.success && data.data) {
        setSessionId(data.data.session_id);
        setMessages([]);
      }
    } catch (error: unknown) {
      console.error('Failed to create new session:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[500px] h-[650px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold">MES AI 어시스턴트</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNewChat}
            className="hover:bg-blue-700 p-1.5 rounded transition-colors"
            title="새 대화"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-1.5 rounded transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-blue-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-center">
              안녕하세요! 👋
              <br />
              MES 시스템 관련 질문을 해주세요.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg: ChatMessage) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-sm">응답 생성 중...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatBot;


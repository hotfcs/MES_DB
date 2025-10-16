'use client';
import Image from 'next/image';

/**
 * 챗봇 플로팅 버튼 컴포넌트
 */

interface ChatBotButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

const ChatBotButton = ({ onClick, unreadCount = 0 }: ChatBotButtonProps) => {
  const imageUrl = process.env.NEXT_PUBLIC_CHATBOT_IMAGE_URL as string | undefined;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-1/2 right-6 translate-y-1/2 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-blue-400/50 hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 group animate-pulse hover:animate-none overflow-hidden"
      aria-label="챗봇 열기"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="챗봇 아이콘"
          width={80}
          height={80}
          className="w-20 h-20 rounded-full object-cover"
          priority
        />
      ) : (
        // Fallback: AI챗봇 이미지와 텍스트 겹치기
        <div className="w-20 h-20 relative flex items-center justify-center overflow-hidden">
          {/* 배경 그라데이션 (로봇/AI 느낌) */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 opacity-90"></div>
          
          {/* 배경 패턴 (기술적 느낌) */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 80 80">
              <defs>
                <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="80" height="80" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* 중앙에 겹치는 큰 아이콘들 */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* 큰 말풍선 아이콘 */}
            <svg className="w-12 h-12 text-white opacity-60" fill="currentColor" viewBox="0 0 48 48">
              <path d="M6 6h36c2.2 0 4 1.8 4 4v12c0 2.2-1.8 4-4 4H24l-6 6V26H6c-2.2 0-4-1.8-4-4V10c0-2.2 1.8-4 4-4z"/>
            </svg>
            
            {/* 큰 로봇 아이콘 */}
            <svg className="w-12 h-12 text-white opacity-60" fill="currentColor" viewBox="0 0 48 48">
              <rect x="6" y="12" width="36" height="24" rx="3"/>
              <circle cx="18" cy="24" r="3"/>
              <circle cx="30" cy="24" r="3"/>
              <path d="M18 30h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="20" y="36" width="8" height="6" rx="2"/>
            </svg>
          </div>
          
          {/* 중앙에 겹치는 큰 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* AI 텍스트 (매우 크고 굵게) */}
            <div className="text-white text-lg font-black leading-none mb-0.5 drop-shadow-2xl" style={{textShadow: '3px 3px 6px rgba(0,0,0,0.9)'}}>
              AI
            </div>
            
            {/* 챗봇 텍스트 (매우 크고 굵게) */}
            <div className="text-white text-lg font-black leading-none drop-shadow-2xl" style={{textShadow: '3px 3px 6px rgba(0,0,0,0.9)'}}>
              챗봇
            </div>
          </div>
        </div>
      )}

      {/* 읽지 않은 메시지 뱃지 */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* 호버 툴팁 */}
      <span className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        AI 어시스턴트
      </span>
    </button>
  );
};

export default ChatBotButton;


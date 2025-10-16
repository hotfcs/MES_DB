'use client';

/**
 * 챗봇 메시지 컴포넌트
 */

import type { ChatMessage } from '@/types/database';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChartRenderer from './ChartRenderer';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${isUser ? 'max-w-[80%]' : 'max-w-[95%]'} rounded-lg p-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
        }`}
      >
        {/* 메시지 내용 */}
        <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none overflow-x-auto">
          {isUser ? (
            message.content
          ) : (
            <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300 my-2 text-xs" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gray-50" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody className="bg-white divide-y divide-gray-200" {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 border border-gray-300 bg-gray-100" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-2 py-1.5 text-xs text-gray-800 border border-gray-300" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="mb-2 last:mb-0" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-2" {...props} />
                ),
                pre: ({ node, children, ...props }) => {
                  // pre 태그의 children을 문자열로 변환
                  const getTextContent = (child: unknown): string => {
                    if (typeof child === 'string') return child;
                    if (Array.isArray(child)) return child.map((c) => getTextContent(c)).join('');
                    if (child && typeof child === 'object' && 'props' in child) {
                      return getTextContent((child as { props: { children: unknown } }).props.children);
                    }
                    return '';
                  };
                  
                  const textContent = getTextContent(children);
                  console.log('pre 태그 내용:', textContent); // 디버깅용
                  
                  // chart 코드블록 감지 - 더 관대한 조건
                  if (textContent.includes('"type"') && textContent.includes('"data"')) {
                    try {
                      const chartData = JSON.parse(textContent);
                      if (chartData.type && chartData.data && Array.isArray(chartData.data)) {
                        console.log('차트 데이터 감지 성공:', chartData); // 디버깅용
                        return <ChartRenderer chartData={chartData} />;
                      }
                    } catch (error: unknown) {
                      console.log('차트 JSON 파싱 오류:', error); // 디버깅용
                    }
                  }
                  
                  return <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto" {...props}>{children}</pre>;
                },
                code: ({ node, className, children, ...props }) => {
                  // inline code용
                  return <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            </>
          )}
        </div>

        {/* 타임스탬프 */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;


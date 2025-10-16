/**
 * OpenAI API 헬퍼 함수
 */

import OpenAI from 'openai';
import type { 
  ChatCompletionMessageParam, 
  ChatCompletionTool 
} from 'openai/resources/chat/completions';
import * as chatQueries from './chat-queries';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ====================================
// Function Calling 정의
// ====================================

/**
 * 챗봇이 호출할 수 있는 함수 정의
 */
export const availableFunctions: Record<string, (args: unknown) => Promise<unknown>> = {
  search_products: async (args: unknown) => {
    const { keyword, limit } = args as { keyword?: string; limit?: number };
    return await chatQueries.searchProducts(keyword, limit);
  },
  
  search_work_orders: async (args: unknown) => {
    const { status, limit } = args as { status?: string; limit?: number };
    return await chatQueries.searchWorkOrders(status, limit);
  },
  
  search_equipments: async (args: unknown) => {
    const { keyword } = args as { keyword?: string };
    return await chatQueries.searchEquipments(keyword);
  },
  
  search_materials: async (args: unknown) => {
    const { keyword, low_stock } = args as { keyword?: string; low_stock?: boolean };
    return await chatQueries.searchMaterials(keyword, low_stock);
  },
  
  search_production_plans: async (args: unknown) => {
    const { status, limit } = args as { status?: string; limit?: number };
    return await chatQueries.searchProductionPlans(status, limit);
  },
  
  search_users: async (args: unknown) => {
    const { keyword } = args as { keyword?: string };
    return await chatQueries.searchUsers(keyword);
  },
};

/**
 * OpenAI Function Calling 도구 정의
 */
export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: '제품 정보를 검색합니다. 제품명이나 제품코드로 검색할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '검색할 제품명 또는 제품코드',
          },
          limit: {
            type: 'number',
            description: '조회할 최대 개수 (기본값: 10)',
            default: 10,
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_work_orders',
      description: '작업 지시를 검색합니다. 상태별로 필터링할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: '작업 지시 상태 (예: 대기, 진행중, 완료, 보류)',
            enum: ['대기', '진행중', '완료', '보류'],
          },
          limit: {
            type: 'number',
            description: '조회할 최대 개수 (기본값: 10)',
            default: 10,
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_equipments',
      description: '설비 정보를 검색합니다. 설비명이나 설비코드로 검색할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '검색할 설비명 또는 설비코드',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_materials',
      description: '자재 재고 정보를 검색합니다. 자재명이나 자재코드로 검색하거나 재고 부족 자재를 조회할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '검색할 자재명 또는 자재코드',
          },
          low_stock: {
            type: 'boolean',
            description: '재고가 부족한 자재만 조회 (기본값: false)',
            default: false,
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_production_plans',
      description: '생산 계획을 검색합니다. 상태별로 필터링할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: '생산 계획 상태 (예: 계획, 진행중, 완료, 취소)',
            enum: ['계획', '진행중', '완료', '취소'],
          },
          limit: {
            type: 'number',
            description: '조회할 최대 개수 (기본값: 10)',
            default: 10,
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_users',
      description: '사용자 정보를 검색합니다. 사용자명이나 계정으로 검색할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '검색할 사용자명 또는 계정',
          },
        },
        required: [],
      },
    },
  },
];

// ====================================
// OpenAI API 호출
// ====================================

/**
 * 챗봇 응답 생성 (Function Calling 포함)
 */
export async function generateChatResponse(
  messages: ChatCompletionMessageParam[],
  maxIterations: number = 5
): Promise<{
  response: string;
  functionCalls?: Array<{ name: string; arguments: string; result: string }>;
}> {
  const functionCalls: Array<{ name: string; arguments: string; result: string }> = [];
  
  // 시스템 프롬프트 추가
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: `당신은 MES(제조 실행 시스템) 전문 AI 어시스턴트입니다. 
    
주요 역할:
- 생산 관리, 작업 지시, 자재 관리, 설비 관리 등 MES 업무 지원
- 사용자 질문에 친절하고 정확하게 답변
- 필요시 데이터베이스를 조회하여 실시간 정보 제공
- 한국어로 자연스럽게 대화

응답 규칙:
- 간결하고 명확하게 답변
- **데이터 조회 결과는 반드시 마크다운 표 형식으로 작성** (예: | 컬럼1 | 컬럼2 |)
- 3개 이상의 데이터는 항상 표로 표시
- 전문 용어는 쉽게 설명
- 추가 도움이 필요하면 제안

마크다운 표 형식 예시:
| 제품코드 | 제품명 | 수량 | 상태 |
|---------|-------|------|------|
| P001 | LED 조명 | 100 | 활성 |
| P002 | 센서 | 50 | 활성 |

**차트 시각화 기능 (매우 중요!):**
사용자가 "차트로 보여줘", "그래프로 보여줘", "막대차트로 보여줘", "시각화해줘" 등의 요청을 하면
**반드시** 아래 형식으로 차트를 제공하세요.

차트 제공 방법:
1. 먼저 간단한 설명 제공
2. 마크다운 표로 데이터 보여주기  
3. **반드시** chart 언어로 지정된 코드블록으로 차트 데이터 제공

차트 코드블록 형식:
- 세 개의 백틱 + chart + 줄바꿈
- JSON 형식의 차트 데이터
- 세 개의 백틱으로 종료

차트 JSON 구조:
{
  "type": "bar",
  "title": "제목",
  "data": [
    { "name": "항목1", "value": 100 },
    { "name": "항목2", "value": 150 }
  ],
  "xKey": "name",
  "yKey": "value"
}

차트 타입:
- "bar": 막대 차트 (비교, 순위, 수량 등) - 가장 많이 사용
- "line": 라인 차트 (추세, 시간 변화 등)  
- "pie": 파이 차트 (비율, 구성 등)

**생산계획 수량 차트 예시:**
1. "다음은 생산계획 수량입니다:"라고 말하기
2. 표 보여주기
3. chart 언어로 지정된 코드블록에 위 JSON 형식으로 차트 데이터 제공

**중요:** 차트 요청이 있을 때는 반드시 chart 언어로 지정된 코드블록을 포함해야 합니다!

상태 값 매핑 (중요!):
- 작업지시: "대기중", "대기 중" → status="대기"
- 생산계획: "대기중", "계획중", "대기 중", "계획 중" → status="계획"
- 사용자가 "대기중인 작업지시"라고 물으면 status="대기"로 검색
- 사용자가 "대기중인 생산계획"이라고 물으면 status="계획"로 검색`,
  };
  
  const conversationMessages: ChatCompletionMessageParam[] = [systemMessage, ...messages];
  
  let iteration = 0;
  
  while (iteration < maxIterations) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // OpenAI 모델
      messages: conversationMessages,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const message = response.choices[0].message;
    
    // 응답 메시지를 대화에 추가
    conversationMessages.push(message);
    
    // 함수 호출이 없으면 최종 응답 반환
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        response: message.content || '죄송합니다. 응답을 생성할 수 없습니다.',
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      };
    }
    
    // 함수 호출 처리
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === 'function') {
        const functionName = toolCall.function.name;
        const functionArgs = toolCall.function.arguments;
        
        try {
          // 함수 실행
          const functionToCall = availableFunctions[functionName];
          if (!functionToCall) {
            throw new Error(`Unknown function: ${functionName}`);
          }
          
          const args = JSON.parse(functionArgs) as unknown;
          const functionResult = await functionToCall(args);
          
          // 함수 호출 기록
          functionCalls.push({
            name: functionName,
            arguments: functionArgs,
            result: JSON.stringify(functionResult),
          });
          
          // 함수 결과를 대화에 추가
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: errorMessage }),
          });
        }
      }
    }
    
    iteration++;
  }
  
  // 최대 반복 횟수 초과
  return {
    response: '죄송합니다. 요청 처리에 시간이 너무 오래 걸렸습니다. 다시 시도해 주세요.',
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
  };
}

/**
 * 스트리밍 응답 생성 (향후 구현용)
 */
export async function* generateChatResponseStream(
  messages: ChatCompletionMessageParam[]
): AsyncGenerator<string> {
  const systemMessage: ChatCompletionMessageParam = {
    role: 'system',
    content: `당신은 MES(제조 실행 시스템) 전문 AI 어시스턴트입니다.`,
  };
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [systemMessage, ...messages],
    stream: true,
    temperature: 0.7,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}


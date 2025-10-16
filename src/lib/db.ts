import sql from 'mssql';

// Azure SQL Server 연결 설정
const config: sql.config = {
  user: process.env.AZURE_SQL_USER!,
  password: process.env.AZURE_SQL_PASSWORD!,
  server: process.env.AZURE_SQL_SERVER!,
  database: process.env.AZURE_SQL_DATABASE!,
  options: {
    encrypt: true, // Azure SQL은 암호화 필수
    trustServerCertificate: false, // Production에서는 false
    enableArithAbort: true, // 쿼리 성능 향상
    connectTimeout: 30000, // 30초 연결 타임아웃 (Vercel 서버리스 환경 최적화)
    requestTimeout: 30000, // 30초 요청 타임아웃
    connectionRetryInterval: 1000, // 재연결 간격
    appName: 'MES_Vercel', // 애플리케이션 이름 (Azure 모니터링용)
  },
  pool: {
    max: 10, // Vercel 서버리스 환경: 최대 연결 수 감소 (50 -> 10)
    min: 0, // Vercel 서버리스 환경: 최소 연결 0 (Cold Start 방지)
    idleTimeoutMillis: 30000, // Vercel 서버리스 환경: 유휴 타임아웃 단축 (60s -> 30s)
    evictionRunIntervalMillis: 30000, // 유휴 연결 정리 간격
  },
};

// 연결 풀 관리 (글로벌 변수로 Vercel 서버리스 함수 간 공유)
let pool: sql.ConnectionPool | null = null;
let poolConnecting: Promise<sql.ConnectionPool> | null = null;

/**
 * Azure SQL Server 연결 풀 가져오기
 * 싱글톤 패턴으로 연결 풀 재사용 (Vercel 서버리스 환경 최적화)
 * @param maxRetries 최대 재시도 횟수 (기본값: 3)
 */
export async function getDbConnection(maxRetries = 3): Promise<sql.ConnectionPool> {
  let lastError: unknown;
  
  // 이미 연결된 풀이 있고 정상 상태이면 재사용
  if (pool && pool.connected) {
    return pool;
  }
  
  // 다른 요청이 이미 연결 중이면 대기 (중복 연결 방지)
  if (poolConnecting) {
    return await poolConnecting;
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 기존 pool이 있지만 연결이 끊어진 경우 정리
      if (pool && !pool.connected) {
        try {
          await pool.close();
        } catch {
          // 이미 닫힌 경우 무시
        }
        pool = null;
      }
      
      if (!pool) {
        console.log(`🔄 Azure SQL Server 연결 시도 중... (${attempt}/${maxRetries})`);
        
        // 연결 Promise를 저장하여 중복 연결 방지
        poolConnecting = sql.connect(config);
        pool = await poolConnecting;
        poolConnecting = null;
        
        console.log('✅ Azure SQL Server 연결 성공');
      }
      return pool;
    } catch (error) {
      poolConnecting = null;
      lastError = error;
      const err = error as Error & { code?: string };
      console.error(`❌ Azure SQL Server 연결 실패 (시도 ${attempt}/${maxRetries}):`, err.message);
      
      // 에러 타입별 안내 메시지
      if (err.code === 'ETIMEOUT') {
        console.error(
          '⚠️  타임아웃 오류:\n' +
          '   - Azure Portal에서 방화벽 규칙에 현재 IP를 추가하세요\n' +
          '   - 네트워크 연결을 확인하세요'
        );
      } else if (err.message?.includes('Login failed')) {
        console.error(
          '⚠️  로그인 실패:\n' +
          '   - 환경 변수의 AZURE_SQL_USER와 AZURE_SQL_PASSWORD를 확인하세요'
        );
      }
      
      // 마지막 시도가 아니면 재시도
      if (attempt < maxRetries) {
        const waitTime = attempt * 500; // 0.5초, 1초, 1.5초... (빠른 재시도)
        console.log(`⏳ ${waitTime / 1000}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        pool = null; // 다음 시도를 위해 pool 초기화
      }
    }
  }
  
  // 모든 재시도 실패
  console.error(`❌ ${maxRetries}번의 시도 후에도 연결 실패`);
  throw lastError;
}

/**
 * 연결 풀 종료
 * 애플리케이션 종료 시 호출
 */
export async function closeDbConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Azure SQL Server 연결 종료');
    }
  } catch (error) {
    console.error('❌ 연결 종료 중 에러:', error);
    throw error;
  }
}

// 연결 상태 확인
export async function checkDbConnection(): Promise<boolean> {
  try {
    const connection = await getDbConnection();
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('연결 상태 확인 실패:', error);
    return false;
  }
}

// sql 객체를 export하여 다른 파일에서도 사용 가능하게 함
export { sql };


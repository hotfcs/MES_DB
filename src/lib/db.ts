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
    connectTimeout: 15000, // 15초 연결 타임아웃
    requestTimeout: 30000, // 30초 요청 타임아웃
  },
  pool: {
    max: 50, // 최대 연결 수 증가 (10 -> 50)
    min: 5, // 최소 연결 유지 (0 -> 5)
    idleTimeoutMillis: 60000, // 유휴 타임아웃 증가 (30s -> 60s)
  },
};

// 연결 풀 관리
let pool: sql.ConnectionPool | null = null;

/**
 * Azure SQL Server 연결 풀 가져오기
 * 싱글톤 패턴으로 연결 풀 재사용
 */
export async function getDbConnection(): Promise<sql.ConnectionPool> {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Azure SQL Server 연결 성공');
    }
    return pool;
  } catch (error) {
    console.error('❌ Azure SQL Server 연결 실패:', error);
    throw error;
  }
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


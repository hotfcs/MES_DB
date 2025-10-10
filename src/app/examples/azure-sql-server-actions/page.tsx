import { getUsers, addUser, deleteUser } from '@/actions/user-actions';

// Server Component로 구현된 Azure SQL Server 예제
export default async function AzureSqlServerActionsPage() {
  const { success, data: users, error } = await getUsers();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Azure SQL Server - Server Actions 예제</h1>

      {/* 사용자 추가 폼 */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">새 사용자 추가</h2>
        <form action={addUser} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            추가
          </button>
        </form>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">사용자 목록</h2>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-semibold">에러 발생</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : !success || !users || users.length === 0 ? (
          <p className="text-gray-500">데이터가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    ID: {user.id} | 생성: {new Date(user.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                <form action={deleteUser.bind(null, user.id)}>
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3">📝 Server Actions 사용 방법:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Server Component에서 직접 데이터베이스 조회</li>
          <li>
            <code className="bg-blue-100 px-2 py-1 rounded">action</code> 속성으로 Server Actions 연결
          </li>
          <li>페이지 새로고침 없이 데이터 추가/삭제</li>
          <li>자동으로 페이지 재검증 (revalidatePath)</li>
          <li>JavaScript 없이도 작동 (Progressive Enhancement)</li>
        </ul>
      </div>
    </div>
  );
}


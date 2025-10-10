'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: string;
}

// Client Component로 구현된 API Routes 예제
export default function AzureSqlApiPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('확인 중...');

  // 연결 상태 확인
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/test-connection');
      const data = await res.json();
      setConnectionStatus(data.success ? '✅ 연결됨' : '❌ 연결 실패');
    } catch (err) {
      setConnectionStatus('❌ 연결 실패');
    }
  };

  // 상품 목록 조회
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();

      if (data.success) {
        setProducts(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 상품 추가
  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const product = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string) || 0,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      const data = await res.json();

      if (data.success) {
        alert('상품이 추가되었습니다');
        e.currentTarget.reset();
        fetchProducts();
      } else {
        alert('추가 실패: ' + data.message);
      }
    } catch (err: any) {
      alert('추가 실패: ' + err.message);
    }
  };

  // 상품 삭제
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('상품이 삭제되었습니다');
        fetchProducts();
      } else {
        alert('삭제 실패: ' + data.message);
      }
    } catch (err: any) {
      alert('삭제 실패: ' + err.message);
    }
  };

  // 상품 검색
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const minPrice = formData.get('minPrice') as string;
    const maxPrice = formData.get('maxPrice') as string;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    try {
      setLoading(true);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Azure SQL Server - API Routes 예제</h1>
        <div className="text-sm">
          <span className="font-medium">연결 상태:</span> {connectionStatus}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 상품 추가 폼 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">새 상품 추가</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                상품명
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
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                가격
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium mb-1">
                재고
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                defaultValue={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              추가
            </button>
          </form>
        </div>

        {/* 검색 폼 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">상품 검색</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                상품명 검색
              </label>
              <input
                type="text"
                id="search"
                name="search"
                placeholder="검색어 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium mb-1">
                  최소 가격
                </label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium mb-1">
                  최대 가격
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                검색
              </button>
              <button
                type="button"
                onClick={() => {
                  (document.querySelector('form') as HTMLFormElement)?.reset();
                  fetchProducts();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">상품 목록</h2>
          <button
            onClick={fetchProducts}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            🔄 새로고침
          </button>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500">로딩 중...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-semibold">에러 발생</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <p className="text-center py-8 text-gray-500">데이터가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상품명</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">가격</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">재고</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">생성일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{product.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-sm">₩{product.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{product.stock}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(product.created_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3">📝 API Routes 사용 방법:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>
            <code className="bg-blue-100 px-2 py-1 rounded">fetch()</code>를 사용하여 API 호출
          </li>
          <li>Client Component에서 useState, useEffect 활용</li>
          <li>실시간 사용자 상호작용 처리 (검색, 추가, 삭제)</li>
          <li>RESTful API 패턴 (GET, POST, PUT, DELETE)</li>
          <li>에러 처리 및 로딩 상태 관리</li>
        </ul>
      </div>
    </div>
  );
}


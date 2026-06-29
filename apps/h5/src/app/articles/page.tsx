'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '../../trpc/client';

export default function H5ArticlesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.article.published.useQuery({ page, pageSize: 10 });

  return (
    <div className="min-h-screen bg-white">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-base font-bold">Lankit</Link>
          <Link href="/" className="text-xs text-blue-600">首页</Link>
        </div>
      </header>

      <main className="px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-5">最新文章</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border border-gray-100 rounded-lg p-4">
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-2" />
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>暂无已发布的文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.items.map((article: { id: string; title: string; summary: string | null; coverUrl: string | null; publishedAt: string | null; category?: { name: string } | null }) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {article.category && (
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                      {article.category.name}
                    </span>
                  )}
                  {article.publishedAt && (
                    <span className="text-[10px] text-gray-400">
                      {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{article.title}</h2>
                {article.summary && (
                  <p className="text-xs text-gray-500 line-clamp-2">{article.summary}</p>
                )}
              </Link>
            ))}
          </div>
        )}

        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex-1 max-w-[120px] py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-xs text-gray-400">
              {page} / {Math.ceil(data.total / data.pageSize)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.pageSize)}
              className="flex-1 max-w-[120px] py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

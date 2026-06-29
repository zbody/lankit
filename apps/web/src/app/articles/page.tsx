'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '../../trpc/client';

export default function ArticlesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.article.published.useQuery({ page, pageSize: 10 });

  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">Lankit</Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">首页</Link>
            <Link href="/articles" className="text-gray-900 font-medium">文章</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">最新文章</h1>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border border-gray-100 rounded-xl p-6">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">暂无已发布的文章</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.items.map((article: { id: string; title: string; summary: string | null; coverUrl: string | null; publishedAt: string | null; category?: { name: string } | null }) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block border border-gray-100 rounded-xl p-6 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex gap-6">
                  {article.coverUrl && (
                    <div className="w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      <img src={article.coverUrl} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {article.category && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {article.category.name}
                        </span>
                      )}
                      {article.publishedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h2>
                    {article.summary && (
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{article.summary}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-300 transition-colors"
            >
              上一页
            </button>
            <span className="text-sm text-gray-500">
              第 {page} / {Math.ceil(data.total / data.pageSize)} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.pageSize)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-300 transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Lankit. MIT License.
        </div>
      </footer>
    </div>
  );
}

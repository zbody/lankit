'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '../../../trpc/client';

export default function H5ArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: article, isLoading, error } = trpc.article.getPublished.useQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="px-4 h-12 border-b border-gray-100 flex items-center">
          <Link href="/" className="text-base font-bold">Lankit</Link>
        </header>
        <main className="px-4 py-6 animate-pulse space-y-3">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="space-y-2 mt-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-3 bg-gray-100 rounded w-full" />)}
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white">
        <header className="px-4 h-12 border-b border-gray-100 flex items-center">
          <Link href="/" className="text-base font-bold">Lankit</Link>
        </header>
        <main className="px-4 py-20 text-center">
          <p className="text-gray-900 font-medium mb-2">文章不存在</p>
          <p className="text-xs text-gray-500 mb-4">该文章可能已被删除或未发布</p>
          <Link href="/articles" className="text-xs text-blue-600">&larr; 返回列表</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 h-12 flex items-center justify-between">
          <Link href="/articles" className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <Link href="/" className="text-base font-bold">Lankit</Link>
        </div>
      </header>

      <main className="px-4 py-6">
        <article>
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {article.category?.name && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {article.category.name}
                </span>
              )}
              {article.publishedAt && (
                <time className="text-[10px] text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                </time>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{article.title}</h1>
            {article.summary && (
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">{article.summary}</p>
            )}
          </header>

          {article.coverUrl && (
            <div className="mb-6 rounded-lg overflow-hidden bg-gray-50">
              <img src={article.coverUrl} alt={article.title} className="w-full h-auto" />
            </div>
          )}

          <div
            className="text-sm text-gray-800 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link href="/articles" className="text-xs text-blue-600">更多文章 &rarr;</Link>
        </div>
      </main>
    </div>
  );
}

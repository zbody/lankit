'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '../../../trpc/client';

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: article, isLoading, error } = trpc.article.getPublished.useQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">Lankit</Link>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900 transition-colors">首页</Link>
              <Link href="/articles" className="hover:text-gray-900 transition-colors">文章</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="space-y-2 mt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-100 rounded w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">Lankit</Link>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">文章不存在</h1>
          <p className="text-gray-500 mb-6">该文章可能已被删除或未发布</p>
          <Link href="/articles" className="text-blue-600 hover:text-blue-700 font-medium">
            &larr; 返回文章列表
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">Lankit</Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">首页</Link>
            <Link href="/articles" className="hover:text-gray-900 transition-colors">文章</Link>
          </nav>
        </div>
      </header>

      {/* 文章内容 */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/articles" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回文章列表
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              {article.category?.name && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {article.category.name}
                </span>
              )}
              {article.publishedAt && (
                <time className="text-sm text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </time>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{article.title}</h1>
            {article.summary && (
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">{article.summary}</p>
            )}
          </header>

          {article.coverUrl && (
            <div className="mb-8 rounded-xl overflow-hidden bg-gray-50">
              <img src={article.coverUrl} alt={article.title} className="w-full h-auto object-cover max-h-96" />
            </div>
          )}

          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            更多文章
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Lankit. MIT License.
        </div>
      </footer>
    </div>
  );
}

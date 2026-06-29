'use client';

import Link from 'next/link';
import { trpc } from '../trpc/client';

export default function HomePage() {
  const { data: stats } = trpc.system.getStats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-lg font-bold">Lankit</span>
        <div className="flex items-center gap-4">
          <Link href="/articles" className="text-sm text-gray-500 hover:text-gray-900">文章</Link>
          <a href={process.env.NEXT_PUBLIC_ADMIN_URL || '//localhost:5175'} className="text-sm text-blue-600">登录</a>
        </div>
      </header>

      <main className="px-4">
        <section className="pt-12 pb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
            新一代管理平台
          </h1>
          <p className="text-base text-gray-600 mb-6 leading-relaxed">
            覆盖后台管理、PC 官网、H5 移动端、原生 App
          </p>

          <div className="flex gap-4 justify-center mb-6">
            {stats ? (
              <>
                <div className="px-4 py-2 bg-blue-50 rounded-lg text-center flex-1 max-w-[120px]">
                  <div className="text-xl font-bold text-blue-600">{stats.userCount}</div>
                  <div className="text-xs text-gray-500">注册用户</div>
                </div>
                <div className="px-4 py-2 bg-green-50 rounded-lg text-center flex-1 max-w-[120px]">
                  <div className="text-xl font-bold text-green-600">在线</div>
                  <div className="text-xs text-gray-500">系统状态</div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-xs">正在连接服务...</div>
            )}
          </div>

          <a
            href={process.env.NEXT_PUBLIC_ADMIN_URL || '//localhost:5175'}
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            进入后台
          </a>
        </section>

        <section className="py-8">
          <h2 className="text-xl font-bold text-center mb-6">核心技术栈</h2>
          <div className="space-y-4">
            {[
              { title: 'React 18 + Next.js 15', desc: 'Server Components、流式渲染、极致的首屏性能' },
              { title: 'tRPC 端到端类型安全', desc: '从 BFF 到各端，类型自动派生，零 API 联调成本' },
              { title: '全端覆盖', desc: 'Admin / PC / H5 / Mobile，一套代码基座' },
            ].map((f) => (
              <div key={f.title} className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-gray-600 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

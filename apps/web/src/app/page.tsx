export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">Lankit</span>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">特性</a>
            <a href="#tech-stack" className="hover:text-gray-900 transition-colors">技术栈</a>
            <a href="#platforms" className="hover:text-gray-900 transition-colors">多端支持</a>
            <a
              href="https://github.com/zbody/lankit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
            新一代全栈管理平台
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            基于 React 18 + Next.js 15 + tRPC + Hono 构建的企业级管理平台。
            覆盖后台管理、PC 官网、H5 移动端、原生 App，一套代码基座多端适配。
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/zbody/lankit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              在 GitHub 上查看
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:border-gray-300 hover:text-gray-900 transition-colors"
            >
              了解特性
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* 统计 */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { value: '6', label: '核心模块' },
              { value: '4', label: '端覆盖' },
              { value: '100%', label: 'TypeScript' },
              { value: 'MIT', label: '开源协议' },
            ].map((stat) => (
              <div key={stat.label} className="border border-gray-200 rounded-xl py-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特性 */}
      <section id="features" className="py-16 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">开箱即用的企业级能力</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              基于 RBAC 权限模型，提供完整的多组织、多租户管理后台所需的所有基础能力
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
                ),
                title: 'RBAC 权限管理',
                desc: '用户-角色-菜单三级权限模型，支持目录/菜单/按钮三级细粒度权限控制。',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                ),
                title: '多组织架构',
                desc: '树形组织架构，支持无限层级。用户归属组织隔离，数据权限随组织树派生。',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>
                ),
                title: '完整审计日志',
                desc: '自动记录所有关键操作，支持按用户、操作类型、实体等多维度追溯查询。',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
                ),
                title: '通知系统',
                desc: '内置通知中心，支持 INFO / WARNING / ERROR / SUCCESS 多类型，已读未读管理。',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                ),
                title: '系统设置',
                desc: '可扩展的 key-value 系统配置，支持运行时动态修改，覆盖各类业务需求。',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                ),
                title: '登录安全',
                desc: '内置登录尝试记录、失败原因追踪、IP 监控，为系统安全提供基础保障。',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border border-gray-200 rounded-xl p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 技术栈 */}
      <section id="tech-stack" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">现代化的全栈技术选型</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              从端到端类型安全的前后端通信，到高性能的数据库访问层，每个环节都选择了当下最成熟的方案
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { layer: '前端框架', tech: 'React 18 + Next.js 15', desc: 'Server Components、App Router、流式渲染' },
              { layer: '类型安全通信', tech: 'tRPC v10', desc: '端到端类型自动派生，零 API 文档维护成本' },
              { layer: 'BFF 层', tech: 'Hono', desc: '轻量高性能 Node.js 框架，原生支持 TypeScript' },
              { layer: 'ORM / 数据库', tech: 'Prisma + PostgreSQL', desc: '类型安全的数据库访问，自动迁移' },
              { layer: 'UI 组件库', tech: 'Ant Design 5', desc: '企业级设计体系，丰富的现成组件' },
              { layer: '样式方案', tech: 'Tailwind CSS', desc: '原子化 CSS，开发效率与一致性兼得' },
              { layer: 'Monorepo', tech: 'pnpm + Turborepo', desc: '高效的依赖管理，增量构建' },
              { layer: '移动端', tech: 'Expo (React Native)', desc: '一套 React 代码，覆盖 iOS 与 Android' },
              { layer: '验证层', tech: 'Zod', desc: '声明式 schema 验证，运行时类型安全' },
            ].map((item) => (
              <div key={item.tech} className="border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-0.5">{item.layer}</div>
                <div className="text-sm font-semibold text-gray-900">{item.tech}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 多端支持 */}
      <section id="platforms" className="py-16 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">一套代码基座，覆盖四端</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              后台管理、PC 官网、移动端 H5、原生 App — 共享同一套 tRPC 类型定义和业务逻辑
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { name: 'Admin 后台', tech: 'Vite + Ant Design', desc: '中后台管理面板，完整 RBAC 管理界面' },
              { name: 'PC 官网', tech: 'Next.js 15', desc: '服务端渲染，SEO 友好，极致首屏性能' },
              { name: 'H5 移动端', tech: 'Next.js 15', desc: '响应式设计，适配手机浏览器' },
              { name: '原生 App', tech: 'Expo / RN', desc: 'iOS + Android 双端覆盖' },
            ].map((platform) => (
              <div key={platform.name} className="border border-gray-200 rounded-xl p-5 text-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{platform.name}</h3>
                <div className="text-xs text-blue-600 font-medium mb-2">{platform.tech}</div>
                <p className="text-xs text-gray-500">{platform.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 架构亮点 */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">架构设计亮点</h2>
            <p className="text-sm text-gray-500">精心设计的模块化架构，让开发和维护都变得简单</p>
          </div>
          <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { title: '端到端类型安全', desc: '从 Prisma Schema 到 tRPC Router 再到前端查询，类型一路自动派生，改数据库字段不需要手改任何类型定义。' },
              { title: 'Monorepo 工程化', desc: 'Turborepo 增量构建 + pnpm workspace，共享配置与工具库，多应用并行开发零成本。' },
              { title: '权限模型成熟', desc: 'RBAC + 组织树数据权限，支持用户级菜单覆盖，可满足绝大多数企业级权限场景。' },
              { title: '全方位审计', desc: '所有关键操作自动记录审计日志，满足合规审计需求，支持多维度追溯查询。' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">完全开源，MIT 协议</h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-8">
            免费用于个人和商业项目。欢迎在 GitHub 上 Star、Fork、提交 Issue 和 PR。
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/zbody/lankit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub 仓库
            </a>
            <a
              href="https://github.com/zbody/lankit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:border-gray-300 hover:text-gray-900 transition-colors"
            >
              查看文档
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Lankit. MIT License.</span>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <a href="https://github.com/zbody/lankit" target="_blank" rel="noreferrer" className="hover:text-gray-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-gray-600 transition-colors">文档</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Issues</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

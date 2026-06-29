import type { Metadata } from 'next';
import '../styles/globals.css';
import { TRPCProvider } from '../trpc/provider';

export const metadata: Metadata = {
  title: {
    default: 'Lankit — 新一代全栈管理平台',
    template: '%s | Lankit',
  },
  description:
    '基于 React 18 + Next.js 15 + tRPC + Hono 构建的现代化企业级管理平台。覆盖后台管理、PC 官网、H5 移动端、原生 App。完全开源，MIT 协议。',
  keywords: ['管理平台', 'RBAC', 'React', 'Next.js', 'tRPC', 'Prisma', '开源', '企业级后台'],
  authors: [{ name: 'Lankit Team' }],
  openGraph: {
    title: 'Lankit — 新一代全栈管理平台',
    description:
      '基于 React 18 + Next.js 15 + tRPC + Hono 构建的现代化企业级管理平台。完全开源，MIT 协议。',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

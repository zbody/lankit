import type { Metadata } from 'next';
import { TRPCProvider } from '../trpc/provider';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Lankit',
  description: '移动端网页 — 轻量、快速、触手可及',
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

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink, TRPCClientError } from '@trpc/client';
import { useState } from 'react';
import { ConfigProvider, message } from 'antd';
import { trpc } from './trpc/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { themeConfig } from './styles/theme';
import App from './App';
import './styles/globals.css';

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError(err) {
              if (err instanceof TRPCClientError) {
                const msg = err.message;
                // 网络错误
                if (msg === 'Failed to fetch' || msg === 'Network request failed') {
                  message.error('网络连接失败，请检查网络后重试');
                  return;
                }
                // 超时
                if (msg.includes('timeout') || msg.includes('Timeout')) {
                  message.error('请求超时，请稍后重试');
                  return;
                }
                // 直接展示后端返回的业务错误（已有人性化文案）
                message.error(msg);
              } else {
                message.error('操作失败，请稍后重试');
              }
            },
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: '/trpc',
          headers() {
            const token = localStorage.getItem('token');
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <TRPCProvider>
          <ConfigProvider theme={themeConfig}>
            <App />
          </ConfigProvider>
        </TRPCProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);

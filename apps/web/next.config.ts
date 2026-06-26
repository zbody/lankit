import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 静态导出，用于 GitHub Pages 部署
  output: 'export',

  // GitHub Pages 不支持 Next.js 图片优化
  images: {
    unoptimized: true,
  },

  // GitHub Pages 部署在子路径下时需设置 basePath
  // 例如仓库为 username/platform，则 basePath = '/platform'
  // 通过环境变量 NEXT_PUBLIC_BASE_PATH 传入，默认为空
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // 静态导出时关闭 Next.js 的图片优化和 ISR 相关功能
  trailingSlash: true,
};

export default nextConfig;

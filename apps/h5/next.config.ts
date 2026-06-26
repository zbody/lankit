import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 静态导出，用于 GitHub Pages 部署
  output: 'export',

  // 部署在子路径 /lankit/h5 下
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  images: {
    unoptimized: true,
  },

  trailingSlash: true,
};

export default nextConfig;

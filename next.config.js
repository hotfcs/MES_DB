/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  // img 태그 사용을 허용하기 위한 설정
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

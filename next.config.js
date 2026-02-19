/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/static/**',
      },
    ],
  },
  async rewrites() {
    const jasaUrl = process.env.NEXT_PUBLIC_API_JASA_URL || "http://localhost:8081";
    return [
      { source: "/api/jasa/:path*", destination: `${jasaUrl}/:path*` },
      { source: "/static/:path*", destination: `${jasaUrl}/static/:path*` },
    ];
  },
};

module.exports = nextConfig;

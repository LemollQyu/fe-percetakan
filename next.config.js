/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      // Local dev

      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8082",
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8083",
        pathname: "/static/**",
      },
      // Ngrok (wildcard hostname)
      {
        protocol: "https",
        hostname: "**.ngrok-free.app",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "**.trycloudflare.com",
        pathname: "/static/**",
      },
      // next.config.js - sudah ada ini, tapi pastikan ada:
      {
        protocol: "https",
        hostname: "**.trycloudflare.com",
        pathname: "/static/**",
      },
    ],
  },

  async rewrites() {
    const userUrl =
      process.env.NEXT_PUBLIC_API_USER_URL || "http://localhost:8080";
    const jasaUrl =
      process.env.NEXT_PUBLIC_API_JASA_URL || "http://localhost:8081";
    const orderUrl =
      process.env.NEXT_PUBLIC_API_ORDER_URL || "http://localhost:8082";
    const paymentUrl =
      process.env.NEXT_PUBLIC_API_PAYMENT_URL || "http://localhost:8083";

    return [
      // ── API proxy routes (legacy — kalau masih ada yang pakai /api/jasa /api/order) ──
      { source: "/api/jasa/:path*", destination: `${jasaUrl}/:path*` },
      { source: "/api/order/:path*", destination: `${orderUrl}/:path*` },

      // ── Static files dari tiap service ──
      // Urutan penting: lebih spesifik dulu
      {
        source: "/static/user/:path*",
        destination: `${userUrl}/static/user/:path*`,
      },
      {
        source: "/static/jasa/:path*",
        destination: `${jasaUrl}/static/jasa/:path*`,
      },
      {
        source: "/static/order/:path*",
        destination: `${orderUrl}/static/order/:path*`,
      },
      {
        source: "/static/payment/:path*",
        destination: `${paymentUrl}/static/payment/:path*`,
      },
      {
        source: "/static/bukti/:path*",
        destination: `${paymentUrl}/static/bukti/:path*`,
      },
      {
        source: "/static/refund/:path*",
        destination: `${paymentUrl}/static/refund/:path*`,
      },
      {
        source: "/static/icon-method/:path*",
        destination: `${paymentUrl}/static/icon-method/:path*`,
      },
      {
        source: "/static/code-qris/:path*",
        destination: `${paymentUrl}/static/code-qris/:path*`,
      },

      // Fallback static (kalau path tidak ada prefix service-nya)
      { source: "/static/:path*", destination: `${jasaUrl}/static/:path*` },
    ];
  },
};

module.exports = nextConfig;

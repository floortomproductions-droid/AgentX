/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/.well-known/:path*',
      },
      {
        source: '/openapi.json',
        destination: '/openapi.json',
      },
    ];
  },
  // Allow CSP for local dev testing
  async headers() {
    return [
      {
        source: '/agents.html',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* https://localhost:*;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

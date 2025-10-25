import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/express-register',
        destination: 'http://localhost:4000/express-register',
      },
    ];
  },
};

export default nextConfig;

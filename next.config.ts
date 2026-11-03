import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  ...(process.env.CLOUDFLARE_PAGES === '1' ? { output: 'export' as const } : {}),
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  images: {
    unoptimized: process.env.CLOUDFLARE_PAGES === '1',
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  ...(process.env.CLOUDFLARE_PAGES !== '1' ? { async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ] },
      { source: '/studio/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/dev/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      ...(process.env.VERCEL_ENV === 'preview' ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : []),
    ];
  } } : {}),
};
export default nextConfig;

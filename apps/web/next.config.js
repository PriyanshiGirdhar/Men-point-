/** @type {import('next').NextConfig} */
// Production API is proxied through /api when API_URL is set on Vercel.
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.dummyjson.com' },
      { protocol: 'https', hostname: 'pub-7bbc84d64eb649bc9ca526bbb7874b9f.r2.dev' },
    ],
  },
  async rewrites() {
    const api = process.env.API_URL?.replace(/\/$/, '');
    if (!api) return [];
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
};

module.exports = nextConfig;

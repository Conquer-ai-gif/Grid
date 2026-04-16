/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'getstream.io' },
    ],
  },
  webpack: (config) => {
    // Required for @excalidraw/excalidraw
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    return config;
  },
  // Inngest requires this for serverless functions
  experimental: {
    serverComponentsExternalPackages: ['inngest'],
  },
};

export default nextConfig;

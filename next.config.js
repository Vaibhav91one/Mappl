/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Appwrite Sites deployment
  trailingSlash: true,
  
  // Disable image optimization for better compatibility
  images: {
    unoptimized: true,
  },
  
  // Configure for Appwrite Sites
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Disable features that require server
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure for better compatibility
  experimental: {
    // Add any experimental features here if needed
  },
  
  // Configure webpack for better compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  
  // Ensure proper routing for Appwrite Sites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

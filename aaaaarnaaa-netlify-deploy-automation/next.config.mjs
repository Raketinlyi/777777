/**
 * @type {import('next').NextConfig}
 * Optimized for Netlify deployment
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Netlify configuration with API routes support
  trailingSlash: true,
  
  // Disable ESLint during build to avoid linting errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  images: {
    domains: [
      'nftstorage.link',
      'ipfs.io',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'dweb.link',
      'ipfs.dweb.link',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.dweb.link',
      },
    ],
    unoptimized: true, // Required for static export and IPFS
  },
  
  // Webpack configuration for Netlify compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
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
  
  // Environment variables
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '33139',
  },
};

export default nextConfig;
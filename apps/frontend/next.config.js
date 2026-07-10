const fs = require('fs');
const path = require('path');

// Local monorepo dev: load root .env if present (not on Vercel)
const rootEnv = path.join(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  try {
    require('dotenv').config({ path: rootEnv });
  } catch {
    // optional in production
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
let apiHostPattern = null;

try {
  if (apiUrl) {
    const parsedApiUrl = new URL(apiUrl);
    apiHostPattern = {
      protocol: parsedApiUrl.protocol.replace(':', ''),
      hostname: parsedApiUrl.hostname,
      port: parsedApiUrl.port || undefined,
    };
  }
} catch (error) {
  console.warn('Invalid NEXT_PUBLIC_API_URL for remotePatterns:', error);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid persistent webpack cache corruption in this workspace on Windows.
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      ...(apiHostPattern ? [apiHostPattern] : []),
    ],
  },
};

module.exports = nextConfig;

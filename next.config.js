/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable React strict mode for better checks
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true, // Keep this true for faster iteration, consider false for production builds
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true, // Keep this true for faster iteration, consider false for production builds
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Allow images from Firebase Storage
        port: '',
        pathname: '/**', // Allow any path within the bucket
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos', // Allow placeholder images
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

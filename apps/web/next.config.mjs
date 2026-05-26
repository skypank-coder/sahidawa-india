import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin();

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  swDest: 'public/sw.js',
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      urlPattern: /^\/api\/medicines\/lookup/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'medicine-lookup-cache',
        expiration: { maxEntries: 500, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'map-tiles-cache',
        expiration: { maxEntries: 1000, maxAgeSeconds: 604800 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\/api\/.*(alert|cdsco).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'alerts-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
        networkTimeoutSeconds: 10,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 2592000 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-cache',
        expiration: { maxEntries: 500, maxAgeSeconds: 31536000 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\/_next\/image.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**'],
        poll: 1000,
      };
    }
    return config;
  },
};

export default withNextIntl(withPWA(pwaConfig)(nextConfig));

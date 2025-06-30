// @ts-check
import { defineConfig } from 'astro/config';
import partytown from '@astrojs/partytown';
import node from '@astrojs/node';
import { i18n } from './src/i18n/config';

import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { ASTRO_DOMAIN, ASTRO_REDIS_URL, ASTRO_PORT } = loadEnv(
  process.env.NODE_ENV || '',
  process.cwd(),
  ''
);
export const port = Number(ASTRO_PORT) ?? 4321;
export const DOMAIN = ASTRO_DOMAIN;
export const SITE = `http://${DOMAIN}` || 'https://example.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [partytown()],
  output: 'server',
  server: { port },
  session: {
    // The name of the Unstorage driver
    driver: 'redis',
    // The required options depend on the driver
    options: {
      url: ASTRO_REDIS_URL,
    },
    ttl: 3600, // 1 hour
  },
  image: {
    // Example: allow processing all images from your aws s3 bucket
    responsiveStyles: true,
    domains: ['images.unsplash.com', 'www.cafecoffeeday.com'],
    remotePatterns: [{ protocol: 'https' }],
  },

  i18n,
  adapter: node({
    mode: 'standalone',
  }),

  vite: {
    plugins: [tailwindcss()],
  },
});

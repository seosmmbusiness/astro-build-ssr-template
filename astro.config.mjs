// @ts-check
import partytown from '@astrojs/partytown';
import node from '@astrojs/node';
import { i18n } from './src/i18n/config';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig, fontProviders } from 'astro/config';
import alpine from '@astrojs/alpinejs';

const { NODE_ENV, ASTRO_DOMAIN, ASTRO_REDIS_URL, ASTRO_PORT } = loadEnv(
  process.env.NODE_ENV || '',
  process.cwd(),
  ''
);
export const port = Number(ASTRO_PORT) ?? 4321;
export const DOMAIN = ASTRO_DOMAIN;
const protocol = NODE_ENV === 'production' ? 'https' : 'http';

export const SITE = `${protocol}://${DOMAIN}` || 'https://example.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [partytown(), alpine()],
  output: 'server',
  server: { port },
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: 'Roboto',
        cssVariable: '--font-roboto',
      },
    ],
  },
  session: {
    driver: 'redis',
    options: {
      url: ASTRO_REDIS_URL,
    },
    ttl: 3600, // 1 hour
  },
  image: {
    responsiveStyles: true,
    domains: [],
    remotePatterns: [{ protocol: 'https' }],
  },

  i18n,
  adapter: node({
    mode: 'standalone',
  }),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});

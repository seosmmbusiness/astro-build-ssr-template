import { locales } from "../i18n/config";

type LocaleExclude = { locale: string; path: string };

const globalExcludes: string[] = [
  '/privacy',
  // другие пути для глобального исключения
];

const localeExcludes: LocaleExclude[] = [
  { locale: 'fr', path: '/blog/post' },
  // другие локализованные исключения
];

// Кэшированный XML и время его генерации
let cachedSitemap: string | null = null;
let cacheTimestamp = 0; // метка времени в миллисекундах

// Время жизни кеша: 1 час в миллисекундах
const CACHE_TTL = 3600 * 1000;

export async function GET({ request }: { request: Request }) {
  const now = Date.now();

  // Если кеш ещё жив, возвращаем его
  if (cachedSitemap && now - cacheTimestamp < CACHE_TTL) {
    console.log('Returning cached sitemap');
    return new Response(cachedSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`
      }
    });
  }

  // Иначе пересоздаём sitemap
  cacheTimestamp = now;

  const { origin } = new URL(request.url);

  // Ищем все страницы без учёта локали
  const pageFiles = import.meta.glob('/src/pages/[locale]/**/*.{astro,md,mdx}', { eager: true });
  const basePaths: string[] = [];
  const prefix = '/src/pages/[locale]';

  for (const filePath in pageFiles) {
    if (!filePath.startsWith(prefix)) continue;

    let routePath = filePath.substring(prefix.length)
      .replace(/\.(astro|md|mdx)$/, '')
      .replace(/\/index$/, '');

    if (routePath === '') routePath = '/';

    // Пропускаем динамические сегменты кроме [locale]
    if (routePath.includes('[')) continue;
    if (!basePaths.includes(routePath)) basePaths.push(routePath);
  }

  // Применяем глобальные исключения
  const filteredPaths = basePaths.filter(p => !globalExcludes.includes(p));

  // Строим XML
  let sitemapXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapXML += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  sitemapXML += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const path of filteredPaths) {
    const availableLocales = locales.filter(
      loc => !localeExcludes.some(ex => ex.locale === loc && ex.path === path)
    );
    if (availableLocales.length === 0) continue;

    for (const locale of availableLocales) {
      const url = origin + (path === '/' ? `/${locale}/` : `/${locale}${path}`);
      sitemapXML += '  <url>\n';
      sitemapXML += `    <loc>${url}</loc>\n`;
      for (const altLocale of availableLocales) {
        const altUrl = origin + (path === '/' ? `/${altLocale}/` : `/${altLocale}${path}`);
        sitemapXML += `    <xhtml:link rel="alternate" hreflang="${altLocale}" href="${altUrl}" />\n`;
      }
      sitemapXML += '  </url>\n';
    }
  }

  sitemapXML += '</urlset>';
  cachedSitemap = sitemapXML;

  return new Response(sitemapXML, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`
    }
  });
}

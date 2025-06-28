import type { APIRoute } from 'astro';
import { getCache, setCache } from '../../../lib/cache';
import { API_TOKEN } from '../../../constants/api';

export const GET: APIRoute = async ({ params, request }) => {
  // Авторизация: ожидаем заголовок Authorization: Bearer <token>
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;
  if (!token || token !== API_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Собираем path + querystring для ключа
  const pathSegments = Array.isArray(params.path) ? params.path : [params.path];
  const urlPath = pathSegments.join('/');
  const incomingUrl = new URL(request.url);
  const qs = incomingUrl.searchParams.toString();
  const cacheKey = `${urlPath}${qs ? `?${qs}` : ''}`;
  // Читаем кастомный TTL из заголовка (вероятный TTL для установки кеша)
  const expiresHeader = request.headers.get('X-Cache-Expires');
  const headerTtl = expiresHeader ? parseInt(expiresHeader, 10) : NaN;
  const envTtl = Number(import.meta.env.ASTRO_REDIS_CACHE_TTL) || 10;
  const ttlSeconds = !isNaN(headerTtl) && headerTtl > 0 ? headerTtl : envTtl;

  // Тег для группировки записей
  const tag = request.headers.get('X-Cache-Tag') || 'all';

  // Попытка взять из кеша
  const cached = await getCache<any>(cacheKey);
  if (cached !== null) {
    // Если есть в кеше — сразу отдаем его
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Status': 'HIT',
      },
    });
  }

  // Мимо кеша: делаем запрос к API
  const apiBase = import.meta.env.ASTRO_API_URL;
  if (!apiBase) {
    return new Response(JSON.stringify({ error: 'API URL not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // const targetUrl = `${apiBase.replace(/\/$/, '')}/${urlPath}${qs ? `?${qs}` : ''}`;
    const res = await fetch(apiBase, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error: ${res.status}` }),
        {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await res.json();

    // Сохраняем в кеш с TTL и тегом
    const isCached = await setCache({
      key: cacheKey,
      value: data,
      ttlSeconds,
      tag,
    });
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Cache-Status': isCached ? 'HIT' : 'MISS',
    });
    if (isCached) {
      headers.append('X-Cache-Reason', 'Stored in cache');
      headers.append('X-Cache-Tag', tag);
      headers.append('X-Cache-Expires', ttlSeconds.toString());
    } else {
      headers.append('X-Cache-Reason', 'Not cached');
    }

    // Возвращаем ответ с данными
    console.log(`API response for ${cacheKey}:`, data);
    console.log(`Cache status: ${isCached ? 'HIT' : 'MISS'}`);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('API request error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch data from API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

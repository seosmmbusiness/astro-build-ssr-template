import type { APIRoute } from 'astro';
import { clearCache, clearCacheByTag } from '../../lib/cache';
import { CLEAN_CACHE_TOKEN } from '../../constants/api';

export const POST: APIRoute = async ({ request }) => {
  // Авторизация: ожидаем заголовок Authorization: Bearer <token>
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;
  if (!token || token !== CLEAN_CACHE_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Извлекаем необязательный тег из тела запроса
  let tag: string | undefined;
  try {
    const { tag: bodyTag } = (await request.json()) as { tag?: string };
    tag = bodyTag;
  } catch {
    // Если тело не JSON или отсутствует, оставляем tag undefined
  }

  // Очищаем весь кеш или только по тегу
  const success =
    typeof tag === 'string' ? await clearCacheByTag(tag) : await clearCache();

  return new Response(JSON.stringify({ success }), {
    status: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
};

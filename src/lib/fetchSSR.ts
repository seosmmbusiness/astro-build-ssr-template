// src/lib/fetch.ts

import { SITE } from '../../astro.config.mjs';
import type { FetchOptions } from '../../types/common.types';
import { API_TOKEN } from '../constants/api';

/**
 * Объединяет дефолтные и пользовательские заголовки в единый HeadersInit.
 */
function mergeHeaders(base: HeadersInit, override?: HeadersInit): HeadersInit {
  const headers = new Headers(base);
  if (override) {
    new Headers(override).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

/**
 * SSR‐fetch для Astro:
 * - относительные пути (/path) превращаются во внутренние API `${SITE}/api${path}`
 * - токен добавляется только для внутренних API: URL.startsWith(`${SITE}/api/`)
 * - берёт токен и SITE из constants/api
 * - умеет прокидывать куки из Astro.request
 * - поддерживает AbortController‐таймаут
 * - централизованная обработка ошибок
 */
export async function fetchSSR(
  input: RequestInfo,
  init: RequestInit = {},
  { timeoutMs = 1_000, cookieHeader }: FetchOptions = {}
): Promise<Response> {
  const siteUrl = SITE.replace(/\/$/, '');

  // Преобразуем относительные пути во внутренние API
  let urlString = typeof input === 'string' ? input : (input as Request).url;
  if (
    typeof input === 'string' &&
    urlString.startsWith('/') &&
    !/^\/\//.test(urlString) &&
    !/^https?:\/\//.test(urlString)
  ) {
    const path = urlString.replace(/^\//, '');
    urlString = `${siteUrl}/api/${path}`;
    input = urlString;
  }

  // Подготавливаем заголовок авторизации только для внутренних /api/ путей
  const authHeader =
    API_TOKEN && urlString.startsWith(`${siteUrl}/api/`)
      ? { Authorization: `Bearer ${API_TOKEN}` }
      : {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (authHeader.Authorization) {
    headers.Authorization = authHeader.Authorization;
  }
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const defaultInit: RequestInit = {
    headers,
  };

  // Мёрджим дефолтные и пользовательские init, включая заголовки
  const mergedInit: RequestInit = {
    ...defaultInit,
    ...init,
    headers: mergeHeaders(defaultInit.headers!, init.headers),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...mergedInit, signal: controller.signal });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`[fetchSSR] Timeout after ${timeoutMs}ms:`, input);
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }
    console.error('[fetchSSR] Fetch error:', input, err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Как fetchSSR, но сразу парсит JSON и кидает onError, если статус ≠ 2xx.
 */
export async function fetchSSRJSON<T = any>(
  input: RequestInfo,
  init: RequestInit = {},
  opts?: FetchOptions
): Promise<T> {
  const res = await fetchSSR(input, init, opts);
  if (!res.ok) {
    const body = await res.text();
    console.error(`[fetchSSRJSON] HTTP ${res.status} ${res.statusText}`, body);
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

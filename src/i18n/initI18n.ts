import { defaultLocale, locales } from '@/i18n/config';
import { translations } from '@/i18n/translate';

export async function initI18n(params: Record<string, any>) {
  let locale = params.locale;
  const redirect = !(locale && locales.includes(locale));

  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  const t = await translations(locale);

  return { locale, t, redirect, defaultLocale };
}

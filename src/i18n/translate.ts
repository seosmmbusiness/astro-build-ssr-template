import type { Translations } from '../../types/i18n/translations';
import { defaultLocale, locales } from '@/i18n/config';

export const translations = async (locale?: string): Promise<Translations> => {
  const fallbackTranslates: Translations = await import(
    `./locales/${defaultLocale}.json`
  );
  let localeTranslates: Translations = {};
  if (locale && locales.includes(locale)) {
    localeTranslates = await import(`./locales/${locale}.json`);
  }

  return {
    ...fallbackTranslates,
    ...localeTranslates,
  };
};

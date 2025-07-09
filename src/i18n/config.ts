export const locales = ['en', 'ru'];
export const defaultLocale = 'en';

export const i18n = {
  locales,
  defaultLocale,
  routing: {
    prefixDefaultLocale: true,
  },
};

export const localesForSitemap = () => {
  let res: Record<string, string> = {};
  locales.forEach((locale) => {
    if (!res?.[locale]) {
      res[locale] = locale;
    }
  });
  return res;
};

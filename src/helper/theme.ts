export function getThemeCookie(Astro: any) {
  const tCook = Astro.cookies.get('darkMode_on')?.value;
  const initOn = tCook === 'true';
  const initialTheme = initOn ? 'dark' : 'light';
  return { tCook, initOn, initialTheme };
}

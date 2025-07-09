window.cookieStorage = {
  getItem(key) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [rawName, rawValue] = cookie.split('=');
      if (rawName.trim() === key) {
        return decodeURIComponent(rawValue);
      }
    }
    return null;
  },

  setItem(key, value) {
    // создаём дату истечения через год
    const expiresDate = new Date();
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);

    document.cookie = [
      `${key}=${encodeURIComponent(value)}`,
      `expires=${expiresDate.toUTCString()}`,
      'path=/',
    ].join('; ');
  },
};

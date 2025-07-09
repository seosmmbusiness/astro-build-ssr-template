import type { Alpine } from 'alpinejs';
import type { cookieStorage } from '../types/common.types';
declare global {
  interface Window {
    Alpine: Alpine;
    cStore: cookieStorage;
    df?: boolean;
  }
  var Alpine: Alpine;
  interface AlpineStores {
    darkMode: {
      on: boolean;
      init(): void;
      toggle(): void;
    };
  }
}

export {};

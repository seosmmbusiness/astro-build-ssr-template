export interface cacheData {
  [key: string]: {
    data: any;
    expires: number;
  };
}

export interface FetchOptions {
  timeoutMs?: number;
  cookieHeader?: string;
}

export interface cookieStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

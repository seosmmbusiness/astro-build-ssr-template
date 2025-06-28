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

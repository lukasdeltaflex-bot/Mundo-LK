export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SmartMemoryCache {
  private static instance: SmartMemoryCache;
  private cache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  public static getInstance(): SmartMemoryCache {
    if (!SmartMemoryCache.instance) {
      SmartMemoryCache.instance = new SmartMemoryCache();
    }
    return SmartMemoryCache.instance;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

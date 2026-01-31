/**
 * Simple in-memory TTL cache for development.
 * Reduces redundant external HTTP requests.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cached value or compute and cache it.
   * Also deduplicates in-flight requests for the same key.
   */
  async getOrSet(
    key: string,
    compute: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if there's already an in-flight request for this key
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      return inFlight;
    }

    // Start the computation and track it
    const promise = compute().then((value) => {
      this.set(key, value, ttlMs);
      this.inFlightRequests.delete(key);
      return value;
    }).catch((error) => {
      this.inFlightRequests.delete(key);
      throw error;
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  private inFlightRequests = new Map<string, Promise<T>>();
}

// Singleton caches for different data types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCache = new TTLCache<any>(5 * 60 * 1000); // 5 minutes default

// Export the class for custom instances
export { TTLCache };

import Redis from 'ioredis';

export interface IDeduplicationCache {
  isDuplicate(deviceId: string, packageName: string, startTime: number): Promise<boolean>;
  markSeen(deviceId: string, packageName: string, startTime: number, ttlSeconds?: number): Promise<void>;
  filterNewRecords<T extends { packageName: string; startTime: number }>(
    deviceId: string,
    records: T[]
  ): Promise<{ newRecords: T[]; duplicateCount: number }>;
  close(): Promise<void>;
}

class RedisCache implements IDeduplicationCache {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: () => null // Prevent infinite reconnection loops if Redis is offline
    });
    this.client.on('error', (err) => {
      // Non-blocking warning
    });
  }

  private getKey(deviceId: string, packageName: string, startTime: number): string {
    return `dedup:${deviceId}:${packageName}:${startTime}`;
  }

  async isDuplicate(deviceId: string, packageName: string, startTime: number): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.getKey(deviceId, packageName, startTime));
      return exists === 1;
    } catch {
      return false;
    }
  }

  async markSeen(deviceId: string, packageName: string, startTime: number, ttlSeconds = 86400): Promise<void> {
    try {
      await this.client.set(this.getKey(deviceId, packageName, startTime), '1', 'EX', ttlSeconds);
    } catch {
      // Non-blocking fallback
    }
  }

  async filterNewRecords<T extends { packageName: string; startTime: number }>(
    deviceId: string,
    records: T[]
  ): Promise<{ newRecords: T[]; duplicateCount: number }> {
    if (records.length === 0) return { newRecords: [], duplicateCount: 0 };

    try {
      const pipeline = this.client.pipeline();
      for (const r of records) {
        pipeline.exists(this.getKey(deviceId, r.packageName, r.startTime));
      }
      const results = await pipeline.exec();
      if (!results) {
        return { newRecords: records, duplicateCount: 0 };
      }

      const newRecords: T[] = [];
      let duplicateCount = 0;

      for (let i = 0; i < records.length; i++) {
        const [err, exists] = results[i];
        if (!err && exists === 1) {
          duplicateCount++;
        } else {
          newRecords.push(records[i]);
          await this.markSeen(deviceId, records[i].packageName, records[i].startTime);
        }
      }

      return { newRecords, duplicateCount };
    } catch {
      return { newRecords: records, duplicateCount: 0 };
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}

/**
 * Resilient In-Memory Deduplication Cache with TTL and LRU expiration.
 */
class MemoryCache implements IDeduplicationCache {
  private cache: Map<string, number> = new Map();
  private maxItems = 100000;

  private getKey(deviceId: string, packageName: string, startTime: number): string {
    return `${deviceId}:${packageName}:${startTime}`;
  }

  async isDuplicate(deviceId: string, packageName: string, startTime: number): Promise<boolean> {
    const key = this.getKey(deviceId, packageName, startTime);
    const expiry = this.cache.get(key);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async markSeen(deviceId: string, packageName: string, startTime: number, ttlSeconds = 86400): Promise<void> {
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(this.getKey(deviceId, packageName, startTime), Date.now() + ttlSeconds * 1000);
  }

  async filterNewRecords<T extends { packageName: string; startTime: number }>(
    deviceId: string,
    records: T[]
  ): Promise<{ newRecords: T[]; duplicateCount: number }> {
    const newRecords: T[] = [];
    let duplicateCount = 0;
    const now = Date.now();

    for (const r of records) {
      const key = this.getKey(deviceId, r.packageName, r.startTime);
      const exp = this.cache.get(key);
      if (exp && exp > now) {
        duplicateCount++;
      } else {
        newRecords.push(r);
        this.cache.set(key, now + 86400 * 1000);
      }
    }

    return { newRecords, duplicateCount };
  }

  async close(): Promise<void> {
    this.cache.clear();
  }
}

let cacheInstance: IDeduplicationCache | null = null;

export function getDeduplicationCache(): IDeduplicationCache {
  if (cacheInstance) return cacheInstance;

  cacheInstance = new MemoryCache();
  return cacheInstance;
}

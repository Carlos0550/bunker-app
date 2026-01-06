import { redis } from "@/config/redis";


export async function setJSON<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  const jsonString = JSON.stringify(value);

  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, jsonString);
  } else {
    await redis.set(key, jsonString);
  }
}


export async function getJSON<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    console.error(`Error parseando JSON de Redis para key: ${key}`);
    return null;
  }
}


export async function deleteKey(key: string): Promise<boolean> {
  const result = await redis.del(key);
  return result > 0;
}


export async function updateJSON<T extends object>(
  key: string,
  partial: Partial<T>,
  ttlSeconds?: number
): Promise<boolean> {
  const current = await getJSON<T>(key);

  if (!current) {
    return false;
  }

  const updated = { ...current, ...partial };
  await setJSON(key, updated, ttlSeconds);
  return true;
}


export async function searchKeys(
  pattern: string,
  count: number = 100
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, foundKeys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      count
    );
    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== "0");

  return keys;
}


export async function exists(key: string): Promise<boolean> {
  const result = await redis.exists(key);
  return result === 1;
}


export async function setWithExpiry(
  key: string,
  value: string,
  seconds: number
): Promise<void> {
  await redis.setex(key, seconds, value);
}


export async function getTTL(key: string): Promise<number> {
  return redis.ttl(key);
}


export async function extendTTL(key: string, seconds: number): Promise<boolean> {
  const result = await redis.expire(key, seconds);
  return result === 1;
}


export async function increment(key: string, amount: number = 1): Promise<number> {
  if (amount === 1) {
    return redis.incr(key);
  }
  return redis.incrby(key, amount);
}


export async function decrement(key: string, amount: number = 1): Promise<number> {
  if (amount === 1) {
    return redis.decr(key);
  }
  return redis.decrby(key, amount);
}


export async function deleteByPattern(pattern: string): Promise<number> {
  const keys = await searchKeys(pattern);

  if (keys.length === 0) {
    return 0;
  }

  return redis.del(...keys);
}


export async function setMultiple(
  entries: Array<[string, unknown]>
): Promise<void> {
  const pipeline = redis.pipeline();

  for (const [key, value] of entries) {
    const jsonValue = typeof value === "string" ? value : JSON.stringify(value);
    pipeline.set(key, jsonValue);
  }

  await pipeline.exec();
}


export async function getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) {
    return [];
  }

  const values = await redis.mget(...keys);

  return values.map((value) => {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  });
}



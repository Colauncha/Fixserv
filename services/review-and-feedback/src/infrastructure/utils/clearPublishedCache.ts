import { redis } from "@fixserv-colauncha/shared";

export async function clearPublishedCache(
  artisanId: string,
  serviceId: string,
) {
  if (!redis) {
    throw new Error("Redis client is not initialized");
  }
  const keys = await redis.keys(`artisan:${artisanId}:published:v1:*`);
  if (keys.length) await redis.del(keys);

  const svcKeys = await redis.keys(`service:${serviceId}:published:v1:*`);
  if (svcKeys.length) await redis.del(svcKeys);
}

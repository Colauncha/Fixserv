import { redis } from "@fixserv-colauncha/shared";

export async function clearServiceCache() {
  if (!redis) {
    throw new Error("Not initialized");
  }
  const keys = await redis.keys("services:*");
  if (!redis) {
    throw new Error("Not initialized");
  }
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

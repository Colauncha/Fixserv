import { redis } from "@fixserv-colauncha/shared";

export async function clearServiceCache() {
  const keys = await redis.keys("services:*");
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

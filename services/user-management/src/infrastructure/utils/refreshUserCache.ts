import { connectRedis, redis } from "@fixserv-colauncha/shared";
import { UserAggregate } from "src/domain/aggregates/userAggregate";

export async function invalidateUserCache(userId: string): Promise<void> {
  const cacheKey = `user:${userId}`;
  await connectRedis();
  await redis.del(cacheKey);
  console.log(`Cache invalidated for user:${userId}`);
}

export async function refreshUserCache(user: UserAggregate) {
  await redis.set(`user:${user.id}`, JSON.stringify(user), {
    EX: 60 * 10, // Cache for 10 minutes
  });
}

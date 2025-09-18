import jwt from "jsonwebtoken";
import { TokenService } from "./tokenService";
import {
  connectRedis,
  NotAuthorizeError,
  redis,
} from "@fixserv-colauncha/shared";
interface UserPayload {
  id: string;
  email: string;
  role: string;
}
export class JwtTokenService implements TokenService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
  private readonly VERIFICATION_TOKEN_EXPIRY = "24h"; // 24 hours
  private readonly REDIS_VERIFICATION_PREFIX = "email_verify";
  constructor() {}

  generateBearerToken(id: string, email: string, role: string): string {
    return jwt.sign({ id, email, role }, process.env.JWT_KEY!, {
      expiresIn: "1h",
    });
  }

  //generateVerificationToken(id: string): string {
  //  return  jwt.sign(
  //    { id },
  //    process.env.JWT_KEY!,
  //    {
  //      expiresIn: "1h",
  //    }
  //  )
  //}

  generateVerificationToken(id: string): string {
    const token = jwt.sign(
      { id, type: "email_verification" },
      process.env.JWT_KEY!,
      {
        expiresIn: "1h",
      }
    );
    this.storeVerificationTokenInRedis(id, token);
    return token;
  }

  generatePasswordResetToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_KEY!, { expiresIn: "15m" });
  }

  //validateVerificationToken(token: string): string | null {
  //  try {
  //    const payload = jwt.verify(token, process.env.JWT_KEY!) as //UserPayload;
  //    return payload.id;
  //  } catch (error) {
  //    throw new NotAuthorizeError();
  //  }
  //}
  validatePasswordResetToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;
      return payload.id;
    } catch (error) {
      throw new NotAuthorizeError();
    }
  }

  //generateVerificationToken(userId: string): string {
  //  const token = jwt.sign(
  //    { userId, type: "email_verification" },
  //    this.JWT_SECRET,
  //    { expiresIn: this.VERIFICATION_TOKEN_EXPIRY }
  //  );
  //
  //  // Store in Redis with expiration
  //  this.storeVerificationTokenInRedis(userId, token);
  //
  //  return token;
  //}

  private async storeVerificationTokenInRedis(
    id: string,
    token: string
  ): Promise<void> {
    try {
      await connectRedis();
      const key = `${this.REDIS_VERIFICATION_PREFIX}${id}`;

      // Store token in Redis with 24 hour expiration
      await redis.set(key, token, {
        EX: 24 * 60 * 60, // 24 hours in seconds
      });

      console.log(`📝 Verification token stored in Redis for user: ${id}`);
    } catch (error) {
      console.error("Failed to store verification token in Redis:", error);
      // Don't throw here as the JWT token itself still has expiration
    }
  }

  async validateVerificationToken(token: string): Promise<string | null> {
    try {
      // First validate JWT
      const decoded = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;

      //if (decoded.type !== "email_verification") {
      //  return null;
      //}

      const userId = decoded.id;

      // Then check if token exists in Redis (not expired)
      await connectRedis();
      const key = `${this.REDIS_VERIFICATION_PREFIX}${userId}`;
      const storedToken = await redis.get(key);

      if (!storedToken || storedToken !== token) {
        console.log(
          `❌ Verification token not found or expired in Redis for user: ${userId}`
        );
        return null;
      }

      console.log(`✅ Verification token validated for user: ${userId}`);
      return userId;
    } catch (error) {
      console.error("Token validation failed:", error);
      return null;
    }
  }

  async invalidateVerificationToken(userId: string): Promise<void> {
    try {
      await connectRedis();
      const key = `${this.REDIS_VERIFICATION_PREFIX}${userId}`;
      await redis.del(key);
      console.log(`🗑️ Verification token invalidated for user: ${userId}`);
    } catch (error) {
      console.error("Failed to invalidate verification token:", error);
    }
  }
}

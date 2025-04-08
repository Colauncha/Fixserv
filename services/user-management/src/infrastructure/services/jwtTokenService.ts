import jwt from "jsonwebtoken";
import { TokenService } from "./tokenService";
import { AuthMiddleware } from "../../interfaces/middlewares/authMiddleware";
import { NotAuthorizeError } from "../../errors/notAuthorizeError";

interface UserPayload {
  id: string;
  email: string;
}
export class JwtTokenService implements TokenService {
  constructor() {}

  generateSessionToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_KEY!, {
      expiresIn: "1h",
    });
  }

  generateVerificationToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_KEY!, {
      expiresIn: "1h",
    });
  }

  generatePasswordResetToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_KEY!, { expiresIn: "15m" });
  }

  validateVerificationToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;
      return payload.id;
    } catch (error) {
      throw new NotAuthorizeError();
    }
  }
  validatePasswordResetToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;
      return payload.id;
    } catch (error) {
      throw new NotAuthorizeError();
    }
  }
}

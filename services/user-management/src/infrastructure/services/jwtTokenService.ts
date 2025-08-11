import jwt from "jsonwebtoken";
import { TokenService } from "./tokenService";
import { NotAuthorizeError } from "@fixserv-colauncha/shared";
interface UserPayload {
  id: string;
  email: string;
  role: string;
}
export class JwtTokenService implements TokenService {
  constructor() {}

  generateBearerToken(id: string, email: string, role: string): string {
    return jwt.sign({ id, email, role }, process.env.JWT_KEY!, {
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

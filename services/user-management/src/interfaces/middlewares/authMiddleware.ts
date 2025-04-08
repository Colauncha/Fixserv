import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { NotAuthorizeError } from "../../errors/notAuthorizeError";

interface UserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export class AuthMiddleware {
  constructor() {}

  public protect(req: Request, res: Response, next: NextFunction): any {
    if (!req.session?.jwt) {
      return next(new NotAuthorizeError());
    }
    try {
      const payload = jwt.verify(
        req.session.jwt,
        process.env.JWT_KEY!
      ) as UserPayload;
      req.currentUser = payload;
      next();
    } catch (error: any) {
      if (error.name === "JsonWebTokenError") {
        return res
          .status(400)
          .json({ message: "Invalid token, please log in again! " });
      }
      if (error.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ message: "Your token has expired login again " });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  public requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.currentUser) {
      throw new NotAuthorizeError();
    }
    next();
  }
}

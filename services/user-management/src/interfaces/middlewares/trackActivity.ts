import { Request, Response, NextFunction } from "express";
import { ClientModel } from "../../infrastructure/persistence/models/client";
import { ArtisanModel } from "../../infrastructure/persistence/models/artisan";

export const trackActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Run in background — don't block the request
  if (req.currentUser?.id) {
    const { id, role } = req.currentUser;

    setImmediate(async () => {
      try {
        const Model = role === "CLIENT" ? ClientModel : ArtisanModel;
        // Cast to any to avoid incompatible union overloads between the two model types
        await (Model as any).findByIdAndUpdate(id, {
          $set: { lastActiveAt: new Date() },
        });
      } catch (error: any) {
        // Non-fatal — never block request for activity tracking
        console.error("Failed to track activity:", error.message);
      }
    });
  }

  next();
};

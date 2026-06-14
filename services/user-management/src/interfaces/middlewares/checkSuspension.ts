import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../application/services/authService";

export const checkSuspension =
  (authService: AuthService) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) return next();

      const user = await authService.findUserById(currentUser.id);

      console.log(
        "checkSuspension",
        currentUser.id,
        user.isSuspended,
        user.suspensionReason,
      );
      if (user.isSuspended) {
        const untilText = user.suspendedUntil
          ? `until ${new Date(user.suspendedUntil).toLocaleDateString()}`
          : "indefinitely";

        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: `Your account has been suspended ${untilText}. Reason: ${user.suspensionReason}. Contact support@fixserv.com for assistance.`,
          suspendedUntil: user.suspendedUntil,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };

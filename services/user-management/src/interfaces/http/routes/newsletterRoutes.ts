import { Router } from "express";
import { NewsletterController } from "../../controllers/newsletterController";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
import { EmailService } from "../../../infrastructure/services/emailServiceImpls";
import { NewsletterService } from "../../../application/services/newsletterService";
import { auth } from "google-auth-library";

const emailService = new EmailService();
const newsletterService = new NewsletterService(emailService);
const newsletterCtrl = new NewsletterController(newsletterService);

const authMiddleware = new AuthMiddleware();

export const newsletterRouter = Router();

// Public — anyone can subscribe (logged in or not)
newsletterRouter.post(
  "/subscribe",
  newsletterCtrl.subscribe.bind(newsletterCtrl),
);

// Public — called from email link (returns HTML)
newsletterRouter.get(
  "/unsubscribe",
  newsletterCtrl.unsubscribeByToken.bind(newsletterCtrl),
);

// Authenticated — user unsubscribes from their account settings
newsletterRouter.post(
  "/unsubscribe",
  authMiddleware.protect,
  newsletterCtrl.unsubscribeByEmail.bind(newsletterCtrl),
);

// Admin only
newsletterRouter.post(
  "/admin/send",
  authMiddleware.protect,
  requireRole("ADMIN"),
  newsletterCtrl.sendNewsletter.bind(newsletterCtrl),
);

newsletterRouter.get(
  "/admin/stats",
  authMiddleware.protect,
  requireRole("ADMIN"),
  newsletterCtrl.getStats.bind(newsletterCtrl),
);

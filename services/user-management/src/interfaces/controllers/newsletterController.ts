import { Request, Response } from "express";
import { NewsletterService } from "../../application/services/newsletterService";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  // POST /api/newsletter/subscribe
  async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const { email, fullName } = req.body;

      if (!email || !email.trim()) {
        throw new BadRequestError("Email is required");
      }

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError("Invalid email format");
      }

      // If a logged-in user subscribes, attach their account info
      const userId = req.currentUser?.id;
      const role = req.currentUser?.role as "CLIENT" | "ARTISAN" | undefined;

      const result = await this.newsletterService.subscribe({
        email,
        fullName: fullName ?? "",
        userId,
        role: role ?? "VISITOR",
      });

      res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/newsletter/unsubscribe?token=xxx
  // This is called from the link in the email — returns HTML, not JSON
  async unsubscribeByToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        res
          .status(400)
          .send(
            this.htmlPage(
              "Invalid Link",
              "This unsubscribe link is invalid or has already been used.",
              false,
            ),
          );
        return;
      }

      const result = await this.newsletterService.unsubscribeByToken(token);

      // Redirect to frontend with success message, OR render a simple HTML page
      res.status(200).send(this.htmlPage("Unsubscribed", result.message, true));
    } catch (error: any) {
      res.status(400).send(this.htmlPage("Error", error.message, false));
    }
  }

  // POST /api/newsletter/unsubscribe  (from account settings — JSON)
  async unsubscribeByEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.currentUser?.email ?? req.body.email;

      if (!email) throw new BadRequestError("Email is required");

      const result = await this.newsletterService.unsubscribeByEmail(email);
      res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/admin/newsletter/send  (admin only)
  async sendNewsletter(req: Request, res: Response): Promise<void> {
    try {
      const { subject, htmlContent } = req.body;
      const adminId = req.currentUser!.id;

      if (!subject || !htmlContent) {
        throw new BadRequestError("subject and htmlContent are required");
      }

      const result = await this.newsletterService.sendToAllSubscribers({
        subject,
        htmlContent,
        adminId,
      });

      res.status(200).json({
        success: true,
        message: `Newsletter sent to ${result.sent} subscribers`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/admin/newsletter/stats  (admin only)
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.newsletterService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  // Simple HTML page for unsubscribe confirmation (no frontend needed)
  private htmlPage(title: string, message: string, success: boolean): string {
    const color = success ? "#28a745" : "#dc3545";
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 500px; margin: 80px auto; text-align: center;">
          <h1 style="color: #dc3545;">Fixserv</h1>
          <h2 style="color: ${color};">${title}</h2>
          <p>${message}</p>
          <a href="${process.env.FIXSERV_FRONTEND}" 
             style="background: #dc3545; color: white; padding: 10px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
            Go to Fixserv
          </a>
        </body>
      </html>
    `;
  }
}

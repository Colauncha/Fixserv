import { NewsletterSubscriberModel } from "../../infrastructure/persistence/models/newsletterSubscriberModel";
import { EmailService } from "../../infrastructure/services/emailServiceImpls";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { v4 as uuidv4 } from "uuid";

export class NewsletterService {
  constructor(private emailService: EmailService) {}

  // ── Subscribe ─────────────────────────────────────────────────────────
  async subscribe(data: {
    email: string;
    fullName?: string;
    userId?: string;
    role?: "CLIENT" | "ARTISAN" | "ADMIN" | "VISITOR";
  }): Promise<{ message: string; alreadySubscribed: boolean }> {
    const existing = await NewsletterSubscriberModel.findOne({
      email: data.email.toLowerCase(),
    });

    if (existing) {
      if (existing.isActive) {
        return {
          message: "You are already subscribed.",
          alreadySubscribed: true,
        };
      }

      // Re-subscribe if they previously unsubscribed
      existing.isActive = true;
      existing.unsubscribedAt = null;
      existing.unsubscribeToken = uuidv4(); // fresh token on re-subscribe
      await existing.save();

      await this.sendWelcomeEmail(data.email, data.fullName ?? "");
      return {
        message: "Welcome back! You've been re-subscribed.",
        alreadySubscribed: false,
      };
    }

    const subscriber = await NewsletterSubscriberModel.create({
      email: data.email.toLowerCase(),
      fullName: data.fullName ?? "",
      userId: data.userId ?? null,
      role: data.role ?? "VISITOR",
    });

    await this.sendWelcomeEmail(
      data.email,
      data.fullName ?? "",
      subscriber.unsubscribeToken,
    );
    return {
      message: "Successfully subscribed to the Fixserv newsletter!",
      alreadySubscribed: false,
    };
  }

  // ── Unsubscribe via token (from email link) ───────────────────────────
  async unsubscribeByToken(token: string): Promise<{ message: string }> {
    const subscriber = await NewsletterSubscriberModel.findOne({
      unsubscribeToken: token,
    });

    if (!subscriber) throw new BadRequestError("Invalid unsubscribe link");
    if (!subscriber.isActive)
      return { message: "You are already unsubscribed." };

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return {
      message:
        "You've been unsubscribed successfully. We're sorry to see you go.",
    };
  }

  // ── Unsubscribe by email (from account settings) ──────────────────────
  async unsubscribeByEmail(email: string): Promise<{ message: string }> {
    const subscriber = await NewsletterSubscriberModel.findOne({
      email: email.toLowerCase(),
    });

    if (!subscriber || !subscriber.isActive) {
      return { message: "Email not found in subscriber list." };
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return { message: "Unsubscribed successfully." };
  }

  // ── Admin: send newsletter to all active subscribers ─────────────────
  async sendToAllSubscribers(data: {
    subject: string;
    htmlContent: string;
    adminId: string;
  }): Promise<{ sent: number; failed: number }> {
    const subscribers = await NewsletterSubscriberModel.find({
      isActive: true,
    }).lean();

    if (subscribers.length === 0) {
      throw new BadRequestError("No active subscribers found");
    }

    let sent = 0;
    let failed = 0;

    // Send in batches of 50 to avoid overwhelming Zoho rate limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (subscriber) => {
          try {
            await this.emailService.sendNewsletter({
              to: subscriber.email,
              subject: data.subject,
              htmlContent: data.htmlContent,
              unsubscribeToken: subscriber.unsubscribeToken,
            });
            sent++;
          } catch (error: any) {
            failed++;
            console.error(
              `Failed to send newsletter to ${subscriber.email}:`,
              error.message,
            );
          }
        }),
      );

      // Small delay between batches to respect Zoho rate limits
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`📧 Newsletter sent: ${sent} succeeded, ${failed} failed`);
    return { sent, failed };
  }

  // ── Admin: get subscriber stats ───────────────────────────────────────
  async getStats() {
    const [total, active, byRole] = await Promise.all([
      NewsletterSubscriberModel.countDocuments(),
      NewsletterSubscriberModel.countDocuments({ isActive: true }),
      NewsletterSubscriberModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      active,
      unsubscribed: total - active,
      byRole: byRole.reduce((acc: any, r: any) => {
        acc[r._id] = r.count;
        return acc;
      }, {}),
    };
  }

  // ── Auto-subscribe registered users ───────────────────────────────────
  // Call this in UserService.registerUser() after creating the user
  async autoSubscribeUser(data: {
    email: string;
    fullName: string;
    userId: string;
    role: "CLIENT" | "ARTISAN" | "ADMIN" | "VISITOR";
  }): Promise<void> {
    try {
      await this.subscribe({
        email: data.email,
        fullName: data.fullName,
        userId: data.userId,
        role: data.role,
      });
    } catch (error: any) {
      // Non-fatal — user is registered, just log newsletter failure
      console.error("Auto-subscribe failed:", error.message);
    }
  }

  private async sendWelcomeEmail(
    email: string,
    fullName: string,
    unsubscribeToken?: string,
  ): Promise<void> {
    try {
      // Only send welcome if we have an unsubscribe token
      if (!unsubscribeToken) return;

      await this.emailService.sendNewsletter({
        to: email,
        subject: "Welcome to Fixserv Updates! 🛠️",
        unsubscribeToken,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #346DA3;">Welcome to Fixserv${fullName ? `, ${fullName}` : ""}! 🎉</h2>
            <p>Thanks for subscribing to Fixserv updates. You'll hear from us about:</p>
            <ul>
              <li>New artisans and services on the platform</li>
              <li>Tips for getting the best repairs</li>
              <li>Platform updates and new features</li>
              <li>Exclusive offers and promotions</li>
            </ul>
            <p>We won't spam you — only valuable updates.</p>
            <p>The Fixserv Team 🛠️</p>
          </div>
        `,
      });
    } catch (error: any) {
      console.error("Failed to send welcome email:", error.message);
    }
  }
}

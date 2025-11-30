import { BadRequestError } from "@fixserv-colauncha/shared";
import { IEmailService } from "./emailService";
import transporter from "../../config/emailConfig";

export class EmailService implements IEmailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // const resetUrl = `${process.env.BASE_URL}/api/admin/reset-password?token=${token}`;
    const resetUrl = `${process.env.FIXSERV_FRONTEND}/auth/reset-password?token=${token}`;

    console.log("from email service", resetUrl);
    try {
      await transporter.sendMail({
        from: `"FixServ Support" <${process.env.MAIL_USERNAME}>`,
        to: email,
        subject: "Reset your FixServ password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0;">FixServ</h1>
            </div>
            
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              You (or someone else) requested a password reset for your FixServ account.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc3545; color: white; padding: 15px 35px; 
                        text-decoration: none; border-radius: 8px; display: inline-block;
                        font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>If the button doesn't work:</strong><br>
                Copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="color: #856404; font-size: 14px; margin: 0;">
                <strong>⚠️ Security Notice:</strong><br>
                This reset link will expire in 1 hour. If you didn't request this password reset, 
                please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                © 2025 FixServ. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Password reset email sent successfully to: ${email}`);
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error);
      throw new BadRequestError("Failed to send password reset email");
    }
  }
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    // For microservices, use the API Gateway URL or frontend URL
    const verificationUrl = `${process.env.BASE_URL}/api/users/verify-email?token=${token}`;
    // Alternative: Direct API call if you want users to hit the API directly
    // const verificationUrl = `${process.env.API_GATEWAY_URL}/auth/verify-email?token=${token}`;

    console.log("📧 Sending verification email to:", email);
    console.log("🔗 Verification URL:", verificationUrl);

    try {
      await transporter.sendMail({
        from: `"FixServ" <${process.env.MAIL_USERNAME}>`,
        to: email,
        subject: "Verify your FixServ account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0;">FixServ</h1>
            </div>
            
            <h2 style="color: #333; text-align: center;">Welcome to FixServ!</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for registering with FixServ. Please verify your email address to activate your account.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 15px 35px; 
                        text-decoration: none; border-radius: 8px; display: inline-block;
                        font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>If the button doesn't work:</strong><br>
                Copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                This verification link will expire in 24 hours.<br>
                If you didn't create a FixServ account, please ignore this email.
              </p>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                © 2025 FixServ. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Verification email sent successfully to: ${email}`);
    } catch (error: any) {
      console.error("❌ Failed to send verification email:", error.message);
      // throw new BadRequestError("Failed to send verification email");
    }
  }

  async sendWaitlistWelcomeEmail(
    email: string,
    fullName: string
  ): Promise<void> {
    console.log("🎉 Sending waitlist welcome email to:", email);

    try {
      await transporter.sendMail({
        from: `"FixServ Team" <${process.env.MAIL_USERNAME}>`,
        to: email,
        subject: "🎉 Welcome to FixServ Waitlist!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 32px;">🎉 FixServ</h1>
            </div>
            
            <!-- Main Content -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 28px;">Welcome to FixServ!</h2>
              <p style="margin: 0; font-size: 18px; opacity: 0.95;">You're now on our exclusive waitlist</p>
            </div>

            <div style="padding: 0 20px;">
              <p style="font-size: 16px; line-height: 1.8; color: #333;">
                Hey ${fullName}! 👋
              </p>
              
              <p style="font-size: 16px; line-height: 1.8; color: #333;">
                Thank you for verifying your email and joining the FixServ waitlist! We're thrilled to have you as part of our early community.
              </p>

              <div style="background-color: #f0f7ff; padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #007bff;">
                <h3 style="color: #007bff; margin-top: 0; font-size: 20px;">🚀 What's Next?</h3>
                <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">You'll be among the first to know when FixServ V2 launches</li>
                  <li style="margin-bottom: 10px;">Get exclusive early access to new features</li>
                  <li style="margin-bottom: 10px;">Receive updates on our development progress</li>
                  <li style="margin-bottom: 10px;">Be part of shaping the future of FixServ</li>
                </ul>
              </div>

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #ffc107;">
                <p style="color: #856404; margin: 0; font-size: 15px;">
                  <strong>💡 Stay Tuned!</strong><br>
                  We're working hard to bring you an amazing experience. Keep an eye on your inbox for exciting updates, 
                  exclusive sneak peeks, and early access opportunities.
                </p>
              </div>

              <p style="font-size: 16px; line-height: 1.8; color: #333;">
                Have questions or feedback? We'd love to hear from you! Simply reply to this email.
              </p>

              <p style="font-size: 16px; line-height: 1.8; color: #333; margin-top: 30px;">
                Best regards,<br>
                <strong>The FixServ Team</strong>
              </p>
            </div>

            <!-- Social Links (Optional) -->
            <div style="text-align: center; margin: 40px 0; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
              <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Follow us for updates:</p>
              <div style="display: inline-block;">
                <!-- Add your social media links here -->
                <a href="#" style="margin: 0 10px; color: #007bff; text-decoration: none;">Twitter</a>
                <a href="#" style="margin: 0 10px; color: #007bff; text-decoration: none;">LinkedIn</a>
                <a href="#" style="margin: 0 10px; color: #007bff; text-decoration: none;">Instagram</a>
              </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0;">
                You're receiving this email because you joined the FixServ waitlist.
              </p>
              <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0;">
                © 2025 FixServ. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Waitlist welcome email sent successfully to: ${email}`);
    } catch (error: any) {
      console.error("❌ Failed to send waitlist welcome email:", error.message);
      // Don't throw - email is optional, don't block the verification process
    }
  }
}

import { BadRequestError } from "@fixserv-colauncha/shared";
import { EmailService } from "./emailService";
import { resend } from "./resendService";

export class ResendEmailService implements EmailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // const resetUrl = `${process.env.ESEND_API_KEY}/reset-password?token=${token}`;
    // const resetUrl = `${process.env.BASE_URL}/api/admin/reset-password?token=${token}`;
    const resetUrl = `${process.env.BASE_URL}/api/admin/reset-password?token=${token}`;

    console.log(resetUrl);

    await resend.emails.send({
      from: "fixserv@resend.dev",
      to: email,
      subject: "Reset your FixServ password",
      html: `<p>forgot your password? You (or someone else) requested a password reset.</p> <div>Submit a PATCH request with your new password to: ${resetUrl}.\nIf you didn't request this, please ignore this email</div>`,
    });
  }
}

/*
const { data, error } = await resend.emails.
send({
  from: "artisanack@resend.dev",
  to: "evwerhamreisrael@gmail.com",
  subject: "Hello from Resend",
  html: "<strong>It works!</strong>",
});
if (error) {
  throw new BadRequestError("Failed to send 
email");
}
*/

/**
    <p>Hi there,</p>
   <p>You (or someone else) requested a 
password reset.</p>
   <p><a href="${resetUrl}">Click here to set a 
new password.</a></p>
   <p>If you didn’t request this, just ignore 
this message.</p>
 `,
 */

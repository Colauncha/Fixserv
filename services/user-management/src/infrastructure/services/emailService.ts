export interface IEmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendWaitlistWelcomeEmail(email: string, fullName: string): Promise<void>;
}

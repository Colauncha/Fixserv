export interface TokenService {
  generateVerificationToken(id: string): string;
  validateVerificationToken(token: string): string | null;
  generatePasswordResetToken(id: string): string;
  validatePasswordResetToken(token: string): string | null;
  generateBearerToken(id: string, email: string, role: string): string;
}

import { BusinessHours } from "../value-objects/businessHours";
import { Categories } from "../value-objects/categories";
import { Category } from "../value-objects/category";
import { Certificates } from "../value-objects/certificates";
import { Certificate } from "../value-objects/certificate";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { SkillSet } from "../value-objects/skillSet";
import { User } from "./user";

export class Artisan extends User {
  constructor(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    public businessName: string,
    public location: string,
    public rating: number,
    public skillSet: SkillSet,
    public businessHours: BusinessHours,
    public categories: Categories,
    public certificates: Certificates,
    public profilePicture?: string, // Optional field for profile picture URL
    //public isEmailVerified?: boolean,
    //public   emailVerificationToken?: string | null,
    //public   emailVerifiedAt?: Date | null
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null,
  ) {
    super(
      id,
      email,
      password,
      fullName,
      "ARTISAN",
      phoneNumber,
      profilePicture,
      isEmailVerified,
      emailVerificationToken,
      emailVerifiedAt,
    );
  }
  addSkill(newSkill: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet.addSkill(newSkill),
      this.businessHours,
      this.categories,
      this.certificates,
      this.profilePicture,
      // CRITICAL: Preserve email verification state when creating new instance
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }
  addCategory(category: Category | string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet,
      this.businessHours,
      this.categories.addCategory(category),
      this.certificates,
      this.profilePicture,
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }

  removeCategory(categoryName: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet,
      this.businessHours,
      this.categories.removeCategory(categoryName),
      this.certificates,
      this.profilePicture,
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }

  canProvideService(serviceType: string): boolean {
    return this.skillSet.hasSkill(serviceType);
  }

  hasCategory(categoryName: string): boolean {
    return this.categories.hasCategory(categoryName);
  }

  getCategoryNames(): string[] {
    return this.categories.categoryNames;
  }

  // ========== CERTIFICATE METHODS ==========

  /**
   * Add a new certificate to the artisan
   * Returns a new Artisan instance with the certificate added
   */
  addCertificate(certificate: Certificate): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet,
      this.businessHours,
      this.categories,
      this.certificates.addCertificate(certificate), // Updated certificates
      this.profilePicture,
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }

  /**
   * Remove a certificate by ID
   * Returns a new Artisan instance with the certificate removed
   */
  removeCertificate(certificateId: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet,
      this.businessHours,
      this.categories,
      this.certificates.removeCertificate(certificateId), // Updated certificates
      this.profilePicture,
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }

  /**
   * Approve a certificate (admin action)
   * Returns a new Artisan instance with the certificate approved
   */
  approveCertificate(certificateId: string, adminId: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet,
      this.businessHours,
      this.categories,
      this.certificates.approveCertificate(certificateId, adminId), // Updated certificates
      this.profilePicture,
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }

  /**
   * Reject a certificate with a reason (admin action)
   * Returns a new Artisan instance with the certificate rejected
   */
  rejectCertificate(
    certificateId: string,
    adminId: string,
    reason: string,
  ): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet,
      this.businessHours,
      this.categories,
      this.certificates.rejectCertificate(certificateId, adminId, reason), // Updated certificates
      this.profilePicture,
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
    );
  }

  // ========== CERTIFICATE QUERY METHODS ==========

  /**
   * Check if artisan has pending certificates
   */
  hasPendingCertificates(): boolean {
    return this.certificates.hasPendingCertificates;
  }

  /**
   * Check if artisan has approved certificates
   */
  hasApprovedCertificates(): boolean {
    return this.certificates.hasApprovedCertificates;
  }

  /**
   * Get total certificate count
   */
  getCertificateCount(): number {
    return this.certificates.count;
  }

  /**
   * Get approved certificate count
   */
  getApprovedCertificateCount(): number {
    return this.certificates.approvedCount;
  }

  /**
   * Get all certificates
   */
  getCertificates(): Certificate[] {
    return this.certificates.certificates;
  }
}

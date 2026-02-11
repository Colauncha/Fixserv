import { Admin } from "../entities/admin";
import { Artisan } from "../entities/artisan";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Client } from "../entities/client";
import { User } from "../entities/user";
import { BusinessHours } from "../value-objects/businessHours";
import { DeliveryAddress } from "../value-objects/deliveryAddress";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { ServicePreferences } from "../value-objects/servicePreferences";
import { SkillSet } from "../value-objects/skillSet";
import { Categories } from "../value-objects/categories";
import { Certificates } from "../value-objects/certificates";
import { Certificate } from "../value-objects/certificate";

export class UserAggregate {
  // public isEmailVerified: boolean = false;
  //public isEmailVerified?: boolean;
  //public emailVerifiedAt?: Date;
  //public emailVerificationToken?: string;
  private constructor(public readonly _user: User) {}

  static createClient(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    address: DeliveryAddress,
    preferences: ServicePreferences,
    profilePicture?: string | null,
    uploadedProducts?: any[],
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null,
  ): UserAggregate {
    const client = new Client(
      id,
      email,
      password,
      fullName,
      phoneNumber,
      address,
      preferences,
      profilePicture || undefined,
      uploadedProducts || [],
      isEmailVerified,
      emailVerificationToken,
      emailVerifiedAt,
    );
    return new UserAggregate(client);
  }

  static createArtisan(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    businessName: string,
    location: string,
    rating: number,
    skillSet: SkillSet,
    businessHours: BusinessHours,
    categories: Categories,
    certificates: Certificates,
    profilePicture?: string | null,
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null,
  ): UserAggregate {
    const artisan = new Artisan(
      id,
      email,
      password,
      fullName,
      phoneNumber,
      businessName,
      location,
      rating,
      skillSet,
      businessHours,
      categories,
      certificates,
      profilePicture || undefined,
      isEmailVerified,
      emailVerificationToken,
      emailVerifiedAt,
    );
    return new UserAggregate(artisan);
  }

  static createAdmin(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    permissions: string[],
    profilePicture?: string | null,
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null,
  ) {
    const admin = new Admin(
      id,
      email,
      password,
      fullName,
      phoneNumber,
      permissions,
      profilePicture || undefined,
      isEmailVerified,
      emailVerificationToken,
      emailVerifiedAt,
    );
    return new UserAggregate(admin);
  }

  markEmailAsVerified(verifiedAt?: Date): void {
    this._user.isEmailVerified = true;
    this._user.emailVerificationToken = this._user.emailVerificationToken;
    this._user.emailVerifiedAt = verifiedAt || new Date();
  }

  setEmailVerificationToken(token: string): void {
    this._user.emailVerificationToken = token;
  }

  async changePassword(
    oldPlainPassword: string,
    newPlainPassword: string,
  ): Promise<void> {
    if (!(await this._user.password.compare(oldPlainPassword))) {
      throw new BadRequestError("Old passowrd is incorrect");
    }
    this._user.password = await Password.create(newPlainPassword);
  }

  async setPassword(newPlainPassword: string): Promise<void> {
    this._user.password = await Password.create(newPlainPassword);
  }

  get id(): string {
    return this._user.id;
  }

  get email(): string {
    return this._user.email.value;
  }

  get password(): string {
    return this._user.password.hash;
  }
  get role(): "CLIENT" | "ARTISAN" | "ADMIN" {
    return this._user.role;
  }

  get fullName(): string {
    return this._user.fullName;
  }

  get deliveryAddress(): DeliveryAddress {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError("Only clients have delivery addresses");
    }
    return (this._user as Client).deliveryAddress;
  }

  get servicePreferences(): ServicePreferences {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError(
        "Service Preferences are only availabe for clients",
      );
    }
    return (this._user as Client).servicePreferences;
  }

  get businessName(): string {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Business name are only availabe for artisans");
    }
    return (this._user as Artisan).businessName;
  }

  get skills(): SkillSet {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Skills name are only availabe for artisans");
    }
    return (this._user as Artisan).skillSet;
  }

  get permissions(): string[] {
    if (this._user.role !== "ADMIN") {
      throw new BadRequestError("Permissions  are only availabe or admins");
    }
    return (this._user as Admin).permissions;
  }

  get businessHours(): BusinessHours {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Permissions  are only availabe or admins");
    }
    return (this._user as Artisan).businessHours;
  }

  get location(): string {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Location are only availabe for artisans");
    }
    return (this._user as Artisan).location;
  }
  get rating(): number {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Rating are only availabe for artisans");
    }
    return (this._user as Artisan).rating;
  }
  get profilePicture(): string | undefined {
    return this._user.profilePicture;
  }
  get uploadedProducts(): any[] {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError(
        "Uploaded products are only available for clients",
      );
    }
    return (this._user as Client).uploadedProducts || [];
  }

  get phoneNumber(): string {
    return this._user.phoneNumber;
  }

  get emailVerificationToken(): string | null | undefined {
    return this._user.emailVerificationToken;
  }

  get emailVerifiedAt(): Date | null | undefined {
    return this._user.emailVerifiedAt;
  }

  get isEmailVerified(): boolean {
    return this._user.isEmailVerified || false;
  }

  setUploadedProducts(products: any[]): void {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError("Only clients can have uploaded products");
    }
    (this._user as Client).uploadedProducts = products || [];
  }

  updateFullName(fullName: string) {
    if (!fullName || fullName.trim().length === 0) {
      throw new BadRequestError("Full name cannot be empty");
    }
    this._user.fullName = fullName;
  }

  updateRating(newRating: number) {
    if (!newRating || typeof newRating !== "number") {
      throw new BadRequestError("Rating cannot be empty and must be a number");
    }
    return ((this._user as Artisan).rating = newRating);
  }

  updateDeliveryAddress(newAddress: DeliveryAddress): void {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError("Only clients have delivery addresses");
    }
    (this._user as Client).deliveryAddress = newAddress;
  }

  updateServicePreferences(preferences: ServicePreferences) {
    if (this._user.role !== "CLIENT") {
      throw new Error("Only clients can have service preferences");
    }
    (this._user as Client).servicePreferences = preferences;
  }

  updateBusinessName(name: string) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can have business names");
    }
    (this._user as Artisan).businessName = name;
  }

  updateLocation(location: string) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can update location");
    }
    (this._user as Artisan).location = location;
  }

  updateSkillSet(newSKill: SkillSet): void {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can  add skills");
    }
    (this._user as Artisan).skillSet = newSKill;
  }
  updateBusinessHours(hours: BusinessHours) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can update business hours");
    }

    (this._user as Artisan).businessHours = hours;
  }

  updatePermissions(permissions: string[]) {
    if (this._user.role !== "ADMIN") {
      throw new BadRequestError("Only admins can update permissions");
    }
    (this._user as Admin).permissions = permissions;
  }

  updateProfilePicture(imageUrl: string): void {
    this._user.profilePicture = imageUrl || undefined;
  }

  updatePhoneNumber(phoneNumber: string): void {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new BadRequestError("Phone number cannot be empty");
    }
    this._user.phoneNumber = phoneNumber;
  }

  isProfileComplete(): boolean {
    if (this.role == "CLIENT") {
      return (
        this.deliveryAddress?.city !== "" &&
        this.deliveryAddress?.country !== "" &&
        this.deliveryAddress?.postalCode !== "" &&
        this.deliveryAddress?.state !== "" &&
        this.deliveryAddress?.street !== ""
      );
    } else if (this.role === "ARTISAN") {
      return (
        this.businessName !== "" &&
        this.location !== "" &&
        this.rating !== undefined &&
        this.skills.skills.length > 0
      );
    }
    return true;
  }

  static fromJSON(json: any): UserAggregate {
    const { id, fullName, role } = json;
    const email = Email.fromJSON(json.email || "");
    const password = Password.fromJSON(json.password || "");
    const profilePicture = json.profilePicture || null;
    const phoneNumber = json.phoneNumber || "";
    const isEmailVerified = json.isEmailVerified || false;
    const emailVerificationToken = json.emailVerificationToken || undefined;
    const emailVerifiedAt = json.emailVerifiedAt || new Date();

    switch (role) {
      case "CLIENT":
        const address = DeliveryAddress.fromJSON(json.deliveryAddress || {});
        const servicePreferences = ServicePreferences.fromJSON(
          json.servicePreferences || [],
        );
        const uploadedProducts = json.uploadedProducts || [];
        return UserAggregate.createClient(
          id,
          email,
          password,
          fullName,
          phoneNumber,
          address,
          servicePreferences,
          profilePicture,
          uploadedProducts,
          isEmailVerified,
          emailVerificationToken,
          emailVerifiedAt,
        );

      case "ARTISAN":
        const skillSetData = json.skillSet || json.skills || [];
        let skillSet: SkillSet;
        if (Array.isArray(skillSetData) && skillSetData.length > 0) {
          skillSet = new SkillSet(skillSetData);
        } else {
          skillSet = new SkillSet(["General Service"]);
        }
        const businessHours = BusinessHours.fromJSON(json.businessHours || {});
        const categories = Categories.fromJSON(json.categories || []);
        const certificates = Certificates.fromJSON(json.certificates || []);

        return UserAggregate.createArtisan(
          id,
          email,
          password,
          fullName,
          phoneNumber,
          json.businessName,
          json.location,
          json.rating,
          skillSet,
          businessHours,
          categories,
          certificates,
          profilePicture,
          isEmailVerified,
          emailVerificationToken,
          emailVerifiedAt,
        );

      case "ADMIN":
        return UserAggregate.createAdmin(
          id,
          email,
          password,
          fullName,
          phoneNumber,
          json.permissions || [],
          profilePicture,
          isEmailVerified,
          emailVerificationToken,
          emailVerifiedAt,
        );

      default:
        throw new BadRequestError(`Unknown role: ${role}`);
    }
  }

  isClient(): boolean {
    return this._user.role === "CLIENT";
  }

  isArtisan(): boolean {
    return this._user.role === "ARTISAN";
  }

  isAdmin(): boolean {
    return this._user.role === "ADMIN";
  }

  toJSON(): any {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      role: this.role,
      phoneNumber: this.phoneNumber,
      profilePicture: this.profilePicture,
      createdAt: this._user.createdAt,
      updatedAt: this._user.updatedAt,
      isEmailVerified: this.isEmailVerified,
      emailVerificationToken: this.emailVerificationToken,
      emailVerifiedAt: this.emailVerifiedAt,
      ...(this.isClient() && {
        deliveryAddress: this.deliveryAddress.toJSON(),
        servicePreferences: this.servicePreferences.toJSON(),
        uploadedProducts: this.uploadedProducts,
      }),
      ...(this.isArtisan() && {
        businessName: this.businessName,
        location: this.location,
        rating: this.rating,
        skillSet: this.skills,
        businessHours: this.businessHours,
        categories: this.getCategoryNames(),
        certificates: this.getCertificates().map((cert) => cert.toJSON()),
      }),
      ...(this.isAdmin() && {
        permissions: this.permissions,
      }),
    };
  }
  // Category management methods
  updateCategories(categories: Categories) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans have categories");
    }
    (this._user as Artisan).categories = categories;
  }
  //addCategory(category: Category | string): void;
  //removeCategory(categoryName: string): void;
  getCategoryNames(): string[] {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans have categories");
    }
    return (this._user as Artisan).categories.categoryNames;
  }

  //hasCategory(categoryName: string): boolean;
  get categories(): Categories | undefined {
    if (this._user.role !== "ARTISAN") return undefined;
    return (this._user as Artisan).categories;
  }

  // ========== CERTIFICATE METHODS (for Artisans only) ==========

  /**
   * Add a certificate to the artisan
   * Throws error if user is not an artisan
   */
  addCertificate(certificate: Certificate): UserAggregate {
    if (this.role !== "ARTISAN") {
      throw new Error("Only artisans can have certificates");
    }

    // Get the current artisan entity
    const artisan = this._user as Artisan;

    // Create new artisan with added certificate
    const updatedArtisan = artisan.addCertificate(certificate);

    // Return new UserAggregate with updated artisan
    return new UserAggregate(updatedArtisan);
  }

  /**
   * Remove a certificate from the artisan
   * Throws error if user is not an artisan
   */
  removeCertificate(certificateId: string): UserAggregate {
    if (this.role !== "ARTISAN") {
      throw new Error("Only artisans can have certificates");
    }

    const artisan = this._user as Artisan;
    const updatedArtisan = artisan.removeCertificate(certificateId);

    return new UserAggregate(updatedArtisan);
  }

  /**
   * Approve a certificate (admin action)
   * Throws error if user is not an artisan
   */
  approveCertificate(certificateId: string, adminId: string): UserAggregate {
    if (this.role !== "ARTISAN") {
      throw new Error("Only artisans can have certificates");
    }

    const artisan = this._user as Artisan;
    const updatedArtisan = artisan.approveCertificate(certificateId, adminId);

    return new UserAggregate(updatedArtisan);
  }

  /**
   * Reject a certificate with reason (admin action)
   * Throws error if user is not an artisan
   */
  rejectCertificate(
    certificateId: string,
    adminId: string,
    reason: string,
  ): UserAggregate {
    if (this.role !== "ARTISAN") {
      throw new Error("Only artisans can have certificates");
    }

    const artisan = this._user as Artisan;
    const updatedArtisan = artisan.rejectCertificate(
      certificateId,
      adminId,
      reason,
    );

    return new UserAggregate(updatedArtisan);
  }

  /**
   * Get all certificates for the artisan
   * Returns empty array if user is not an artisan
   */
  getCertificates(): Certificate[] {
    if (this.role !== "ARTISAN") {
      return [];
    }

    const artisan = this._user as Artisan;
    // return artisan.getCertificates();
    // Make sure certificates exist
    if (!artisan.certificates) {
      return [];
    }

    // Return the certificates array
    return artisan.certificates.certificates;
  }

  /**
   * Check if artisan has pending certificates
   * Returns false if user is not an artisan
   */
  hasPendingCertificates(): boolean {
    if (this.role !== "ARTISAN") {
      return false;
    }

    const artisan = this._user as Artisan;
    // return artisan.hasPendingCertificates();
    return artisan.certificates.hasPendingCertificates;
  }

  /**
   * Get total certificate count
   * Returns 0 if user is not an artisan
   */
  getCertificateCount(): number {
    if (this.role !== "ARTISAN") {
      return 0;
    }

    const artisan = this._user as Artisan;
    // return artisan.getCertificateCount();
    if (!artisan.certificates) {
      return 0;
    }

    return artisan.certificates.count;
  }

  /**
   * Get approved certificate count
   * Returns 0 if user is not an artisan
   */
  getApprovedCertificateCount(): number {
    if (this.role !== "ARTISAN") {
      return 0;
    }

    const artisan = this._user as Artisan;
    if (!artisan.certificates) {
      return 0;
    }
    return artisan.certificates.approvedCount;
  }
}

export class DeliveryAddress {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly state: string,
    public readonly country: string
  ) {
    if (!street || !city || !postalCode) {
      throw new Error("Address fields cannot be empty");
    }
    this.validatePostalCode(postalCode, country);
  }

  validatePostalCode(code: string, country: string) {
    if (country === "NG" && !/^\d{6}$/.test(code)) {
      throw new Error("Invalid 9ja postal code");
    }
  }

  toString(): string {
    return `${this.street},${this.city},${this.postalCode},${this.country}`;
  }
}

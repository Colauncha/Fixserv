import { BadRequestError } from "@fixserv-colauncha/shared";

export class DeliveryAddress {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly state: string,
    public readonly country: string
  ) {
    // if (!street || !city || !postalCode) {
    // // throw new Error("Address fields cannot be empty");
    // }
    this.validatePostalCode(postalCode, country);
  }

  validatePostalCode(code: string, country: string) {
    if (country === "NG" && !/^\d{6}$/.test(code)) {
      throw new BadRequestError("Invalid 9ja postal code");
    }
  }

  toString(): string {
    return `${this.street},${this.city},${this.postalCode},${this.country}`;
  }
  // ✅ Serialize for Redis or API response
  toJSON() {
    return {
      street: this.street,
      city: this.city,
      postalCode: this.postalCode,
      state: this.state,
      country: this.country,
    };
  }

  // ✅ Deserialize from JSON (used in UserAggregate.fromJSON)
  static fromJSON(json: {
    street: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
  }): DeliveryAddress {
    return new DeliveryAddress(
      json.street,
      json.city,
      json.postalCode,
      json.state,
      json.country
    );
  }
}

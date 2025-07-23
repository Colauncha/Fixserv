"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryAddress = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class DeliveryAddress {
    constructor(street, city, postalCode, state, country) {
        this.street = street;
        this.city = city;
        this.postalCode = postalCode;
        this.state = state;
        this.country = country;
        if (!street || !city || !postalCode) {
            throw new Error("Address fields cannot be empty");
        }
        this.validatePostalCode(postalCode, country);
    }
    validatePostalCode(code, country) {
        if (country === "NG" && !/^\d{6}$/.test(code)) {
            throw new shared_1.BadRequestError("Invalid 9ja postal code");
        }
    }
    toString() {
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
    static fromJSON(json) {
        return new DeliveryAddress(json.street, json.city, json.postalCode, json.state, json.country);
    }
}
exports.DeliveryAddress = DeliveryAddress;

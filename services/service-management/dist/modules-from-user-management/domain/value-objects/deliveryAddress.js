"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryAddress = void 0;
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
            throw new Error("Invalid 9ja postal code");
        }
    }
    toString() {
        return `${this.street},${this.city},${this.postalCode},${this.country}`;
    }
}
exports.DeliveryAddress = DeliveryAddress;

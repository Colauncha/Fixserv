"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
class Email {
    constructor(email) {
        if (!this.isValid(email)) {
            throw new Error("Invalid email format");
        }
        this._value = email.toLowerCase();
    }
    get value() {
        return this._value;
    }
    isValid(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    static fromJSON(value) {
        return new Email(value);
    }
}
exports.Email = Email;

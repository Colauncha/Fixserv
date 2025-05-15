"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_1 = require("@fixserv-colauncha/shared");
class JwtTokenService {
    constructor() { }
    generateSessionToken(id, email, role) {
        return jsonwebtoken_1.default.sign({ id, email, role }, process.env.JWT_KEY, {
            expiresIn: "1h",
        });
    }
    generateVerificationToken(id) {
        return jsonwebtoken_1.default.sign({ id }, process.env.JWT_KEY, {
            expiresIn: "1h",
        });
    }
    generatePasswordResetToken(id) {
        return jsonwebtoken_1.default.sign({ id }, process.env.JWT_KEY, { expiresIn: "15m" });
    }
    validateVerificationToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
            return payload.id;
        }
        catch (error) {
            throw new shared_1.NotAuthorizeError();
        }
    }
    validatePasswordResetToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
            return payload.id;
        }
        catch (error) {
            throw new shared_1.NotAuthorizeError();
        }
    }
}
exports.JwtTokenService = JwtTokenService;

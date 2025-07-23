"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const shared_1 = require("@fixserv-colauncha/shared");
const rateLimiter = () => {
    return (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // limit each IP to 100 requests per window
        message: "Too many requests from this IP, please try again later.",
        standardHeaders: true, // return RateLimit headers
        legacyHeaders: false,
        store: new rate_limit_redis_1.default({
            sendCommand: (...args) => shared_1.redis.sendCommand(args),
        }),
    });
};
exports.rateLimiter = rateLimiter;

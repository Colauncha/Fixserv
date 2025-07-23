"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const userAggregate_1 = require("../../domain/aggregates/userAggregate");
const shared_1 = require("@fixserv-colauncha/shared");
const shared_2 = require("@fixserv-colauncha/shared");
const password_1 = require("../../domain/value-objects/password");
const shared_3 = require("@fixserv-colauncha/shared");
class AuthService {
    constructor(userRepository, tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!password) {
                throw new shared_2.BadRequestError("Password is required");
            }
            const cacheKey = `user:email:${email}`;
            yield (0, shared_3.connectRedis)();
            const cachedUser = yield shared_3.redis.get(cacheKey);
            let user;
            if (cachedUser) {
                user = userAggregate_1.UserAggregate.fromJSON(JSON.parse(cachedUser));
            }
            else {
                const foundUser = yield this.userRepository.findByEmail(email);
                if (!foundUser) {
                    throw new shared_2.BadRequestError("No user with that email exists");
                }
                user = foundUser;
                // Cache the user data for 10 minutes
                yield shared_3.redis.set(cacheKey, JSON.stringify(user.toJSON()), {
                    EX: 60 * 10,
                });
            }
            const passwordData = password_1.Password.fromHash(user.password);
            const isMatch = yield passwordData.compare(password);
            if (!isMatch) {
                throw new shared_1.NotAuthorizeError();
            }
            const BearerToken = this.tokenService.generateBearerToken(user.id, user.email, user.role);
            return { user, BearerToken };
        });
    }
    findUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `user:${id}`;
            yield (0, shared_3.connectRedis)();
            const cachedUser = yield shared_3.redis.get(cacheKey);
            if (cachedUser) {
                return userAggregate_1.UserAggregate.fromJSON(JSON.parse(cachedUser));
            }
            const user = yield this.userRepository.findById(id);
            if (!user) {
                throw new shared_2.BadRequestError("User with that Id not found");
            }
            yield shared_3.redis.set(cacheKey, JSON.stringify(user.toJSON()), {
                EX: 60 * 10,
            });
            return user;
        });
    }
}
exports.AuthService = AuthService;

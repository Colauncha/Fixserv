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
const shared_1 = require("@fixserv-colauncha/shared");
const shared_2 = require("@fixserv-colauncha/shared");
const password_1 = require("../../domain/value-objects/password");
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
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new shared_1.NotAuthorizeError();
            }
            const passwordData = password_1.Password.fromHash(user.password);
            const isMatch = yield passwordData.compare(password);
            if (!isMatch) {
                throw new shared_1.NotAuthorizeError();
            }
            //check if email is verified
            const sessionToken = this.tokenService.generateSessionToken(user.id, user.email, user.role);
            return { user, sessionToken };
        });
    }
    logout(sessionToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    findUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(id);
            if (!user) {
                throw new shared_2.BadRequestError("User with that Id not found");
            }
            return user;
        });
    }
}
exports.AuthService = AuthService;

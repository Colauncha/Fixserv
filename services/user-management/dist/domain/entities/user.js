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
exports.User = void 0;
const password_1 = require("../value-objects/password");
class User {
    constructor(id, email, password, fullName, role, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    changePassword(oldPlainPassword, newPlainPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const isMatch = this.password.compare(oldPlainPassword);
            if (!isMatch) {
                throw new Error("Old password is incorrect");
            }
            this.password = yield password_1.Password.create(newPlainPassword);
        });
    }
}
exports.User = User;

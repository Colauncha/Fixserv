"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
const user_1 = require("./user");
class Admin extends user_1.User {
    constructor(id, email, password, fullName, permissions) {
        super(id, email, password, fullName, "ADMIN");
        this.permissions = permissions;
    }
}
exports.Admin = Admin;

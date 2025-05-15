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
exports.UserAggregate = void 0;
const admin_1 = require("../entities/admin");
const artisan_1 = require("../entities/artisan");
const shared_1 = require("@fixserv-colauncha/shared");
const client_1 = require("../entities/client");
const password_1 = require("../value-objects/password");
class UserAggregate {
    constructor(_user) {
        this._user = _user;
    }
    static createClient(id, email, password, fullName, address, preferences) {
        const client = new client_1.Client(id, email, password, fullName, address, preferences);
        return new UserAggregate(client);
    }
    static createArtisan(id, email, password, fullName, businessName, rating, location, skillSet, businessHours) {
        const artisan = new artisan_1.Artisan(id, email, password, fullName, businessName, rating, location, skillSet, businessHours);
        console.log(artisan);
        return new UserAggregate(artisan);
    }
    static createAdmin(id, email, password, fullName, permissions) {
        const admin = new admin_1.Admin(id, email, password, fullName, permissions);
        return new UserAggregate(admin);
    }
    changePassword(oldPlainPassword, newPlainPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this._user.password.compare(oldPlainPassword))) {
                throw new shared_1.BadRequestError("Old passowrd is incorrect");
            }
            this._user.password = yield password_1.Password.create(newPlainPassword);
        });
    }
    get id() {
        return this._user.id;
    }
    get email() {
        return this._user.email.value;
    }
    get password() {
        return this._user.password.hash;
    }
    get role() {
        return this._user.role;
    }
    get fullName() {
        return this._user.fullName;
    }
    get deliveryAddress() {
        if (this._user.role !== "CLIENT") {
            throw new Error("Only clients have delivery addresses");
        }
        return this._user.deliveryAddress;
    }
    get servicePreferences() {
        if (this._user.role !== "CLIENT") {
            throw new Error("Service Preferences are only availabe for clients");
        }
        return this._user.servicePreferences;
    }
    get businessName() {
        if (this._user.role !== "ARTISAN") {
            throw new Error("Business name are only availabe for artisans");
        }
        return this._user.businessName;
    }
    get skills() {
        if (this._user.role !== "ARTISAN") {
            throw new Error("Skills name are only availabe for artisans");
        }
        return this._user.skillSet;
    }
    get permissions() {
        if (this._user.role !== "ADMIN") {
            throw new Error("Permissions  are only availabe or admins");
        }
        return this._user.permissions;
    }
    get businessHours() {
        if (this._user.role !== "ARTISAN") {
            throw new Error("Permissions  are only availabe or admins");
        }
        return this._user.businessHours;
    }
    get location() {
        if (this._user.role !== "ARTISAN") {
            throw new Error("Location are only availabe for artisans");
        }
        return this._user.location;
    }
    get rating() {
        if (this._user.role !== "ARTISAN") {
            throw new Error("Rating are only availabe for artisans");
        }
        return this._user.rating;
    }
    updateAddress(newAddress) {
        if (this._user.role !== "CLIENT") {
            throw new Error("Only clients have delivery addresses");
        }
        this._user.deliveryAddress = newAddress;
    }
    addSkill(newSKill) {
        if (this._user.role !== "ARTISAN") {
            throw new Error("Only artisans can  add skills");
        }
        this._user.skillSet = this._user.skillSet.addSkill(newSKill);
    }
}
exports.UserAggregate = UserAggregate;

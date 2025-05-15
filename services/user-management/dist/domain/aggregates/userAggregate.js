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
    static createArtisan(id, email, password, fullName, businessName, location, rating, skillSet, businessHours) {
        const artisan = new artisan_1.Artisan(id, email, password, fullName, businessName, location, rating, skillSet, businessHours);
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
            throw new shared_1.BadRequestError("Only clients have delivery addresses");
        }
        return this._user.deliveryAddress;
    }
    get servicePreferences() {
        if (this._user.role !== "CLIENT") {
            throw new shared_1.BadRequestError("Service Preferences are only availabe for clients");
        }
        return this._user.servicePreferences;
    }
    get businessName() {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Business name are only availabe for artisans");
        }
        return this._user.businessName;
    }
    get skills() {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Skills name are only availabe for artisans");
        }
        return this._user.skillSet;
    }
    get permissions() {
        if (this._user.role !== "ADMIN") {
            throw new shared_1.BadRequestError("Permissions  are only availabe or admins");
        }
        return this._user.permissions;
    }
    get businessHours() {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Permissions  are only availabe or admins");
        }
        return this._user.businessHours;
    }
    get location() {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Location are only availabe for artisans");
        }
        return this._user.location;
    }
    get rating() {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Rating are only availabe for artisans");
        }
        return this._user.rating;
    }
    updateFullName(fullName) {
        if (!fullName || fullName.trim().length === 0) {
            throw new shared_1.BadRequestError("Full name cannot be empty");
        }
        this._user.fullName = fullName;
    }
    updateRating(newRating) {
        if (!newRating || typeof newRating !== "number") {
            throw new shared_1.BadRequestError("Rating cannot be empty and must be a number");
        }
        return (this._user.rating = newRating);
    }
    updateDeliveryAddress(newAddress) {
        if (this._user.role !== "CLIENT") {
            throw new shared_1.BadRequestError("Only clients have delivery addresses");
        }
        this._user.deliveryAddress = newAddress;
    }
    updateServicePreferences(preferences) {
        if (this._user.role !== "CLIENT") {
            throw new Error("Only clients can have service preferences");
        }
        this._user.servicePreferences = preferences;
    }
    updateBusinessName(name) {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Only artisans can have business names");
        }
        this._user.businessName = name;
    }
    updateLocation(location) {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Only artisans can update location");
        }
        this._user.location = location;
    }
    updateSkillSet(newSKill) {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Only artisans can  add skills");
        }
        this._user.skillSet = newSKill;
    }
    updateBusinessHours(hours) {
        if (this._user.role !== "ARTISAN") {
            throw new shared_1.BadRequestError("Only artisans can update business hours");
        }
        this._user.businessHours = hours;
    }
    updatePermissions(permissions) {
        if (this._user.role !== "ADMIN") {
            throw new shared_1.BadRequestError("Only admins can update permissions");
        }
        this._user.permissions = permissions;
    }
}
exports.UserAggregate = UserAggregate;

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
exports.UserRepositoryImpl = void 0;
const userAggregate_1 = require("../../domain/aggregates/userAggregate");
const businessHours_1 = require("../../domain/value-objects/businessHours");
const deliveryAddress_1 = require("../../domain/value-objects/deliveryAddress");
const email_1 = require("../../domain/value-objects/email");
const password_1 = require("../../domain/value-objects/password");
const servicePreferences_1 = require("../../domain/value-objects/servicePreferences");
const skillSet_1 = require("../../domain/value-objects/skillSet");
const admin_1 = require("./models/admin");
const artisan_1 = require("./models/artisan");
const client_1 = require("./models/client");
class UserRepositoryImpl {
    save(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const userData = this.toPersistence(user);
            const role = user.role;
            switch (role) {
                case "CLIENT":
                    yield client_1.ClientModel.findOneAndUpdate({
                        _id: user.id,
                    }, userData, { upsert: true, new: true });
                    break;
                case "ARTISAN":
                    yield artisan_1.ArtisanModel.findOneAndUpdate({
                        _id: user.id,
                    }, userData, {
                        upsert: true,
                        new: true,
                    });
                    break;
                case "ADMIN":
                    yield admin_1.AdminModel.findOneAndUpdate({
                        _id: user.id,
                    }, userData, { upsert: true, new: true });
                    break;
                default:
                    throw new Error(`Unknown role ${role}`);
            }
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let userData;
            userData = yield client_1.ClientModel.findById(id).select("+password");
            if (userData)
                return this.toDomain(userData);
            userData = yield artisan_1.ArtisanModel.findById(id).select("+password");
            if (userData)
                return this.toDomain(userData);
            userData = yield admin_1.AdminModel.findById(id).select("+password");
            if (userData)
                return this.toDomain(userData);
            return null;
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            let userData;
            userData = yield client_1.ClientModel.findOne({ email }).select("+password");
            if (userData)
                return this.toDomain(userData);
            userData = yield artisan_1.ArtisanModel.findOne({ email }).select("+password");
            if (userData)
                return this.toDomain(userData);
            userData = yield admin_1.AdminModel.findOne({ email }).select("+password");
            if (userData)
                return this.toDomain(userData);
            return null;
        });
    }
    updateRating(userId, newRating) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only artisans have ratings
                yield artisan_1.ArtisanModel.findOneAndUpdate({ _id: userId }, {
                    $set: { rating: newRating },
                    $push: {
                        ratingHistory: {
                            rating: newRating,
                            updatedAt: new Date(),
                        },
                    },
                }, { new: true }).exec();
            }
            catch (error) {
                throw new Error(`Failed to update rating for user ${userId}: ${error.message}`);
            }
        });
    }
    toPersistence(user) {
        const base = {
            _id: user.id,
            email: user.email,
            password: user.password,
            fullName: user.fullName,
            role: user.role,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (user.role === "CLIENT") {
            return Object.assign(Object.assign({}, base), { deliveryAddress: user.deliveryAddress, servicePreferences: user.servicePreferences.categories });
        }
        else if (user.role === "ARTISAN") {
            return Object.assign(Object.assign({}, base), { businessName: user.businessName, location: user.location, rating: user.rating, skillSet: user.skills.skills, businessHours: user.businessHours });
        }
        else if (user.role === "ADMIN") {
            return Object.assign(Object.assign({}, base), { permissions: user.permissions });
        }
    }
    toDomain(data) {
        if (data.role === "CLIENT") {
            return userAggregate_1.UserAggregate.createClient(data._id.toString(), new email_1.Email(data.email), password_1.Password.fromHash(data.password), data.fullName, new deliveryAddress_1.DeliveryAddress(data.deliveryAddress.street, data.deliveryAddress.city, data.deliveryAddress.postalCode, data.deliveryAddress.state, data.deliveryAddress.country), new servicePreferences_1.ServicePreferences(Array.isArray(data.servicePreferences) ? data.servicePreferences : []));
        }
        else if (data.role === "ARTISAN") {
            const skills = Array.isArray(data.skillSet)
                ? data.skillSet
                : ["General Repair"];
            return userAggregate_1.UserAggregate.createArtisan(data._id.toString(), new email_1.Email(data.email), password_1.Password.fromHash(data.password), data.fullName, data.businessName, data.location, data.rating, new skillSet_1.SkillSet(skills), new businessHours_1.BusinessHours(data.businessHours));
        }
        else if (data.role === "ADMIN") {
            return userAggregate_1.UserAggregate.createAdmin(data._id.toString(), new email_1.Email(data.email), password_1.Password.fromHash(data.password), data.fullName, data.permissions);
        }
        throw new Error(`Unknown role ${data.role}`);
    }
    toJSON(user) {
        const base = {
            _id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (user.role === "CLIENT") {
            return Object.assign(Object.assign({}, base), { deliveryAddress: user.deliveryAddress, servicePreferences: user.servicePreferences.categories });
        }
        else if (user.role === "ARTISAN") {
            return Object.assign(Object.assign({}, base), { businessName: user.businessName, location: user.location, rating: user.rating, skillSet: user.skills.skills, businessHours: user.businessHours });
        }
        else if (user.role === "ADMIN") {
            return Object.assign(Object.assign({}, base), { permissions: user.permissions });
        }
    }
}
exports.UserRepositoryImpl = UserRepositoryImpl;

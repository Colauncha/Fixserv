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
exports.AuthController = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
const userRepositoryImpl_1 = require("../../infrastructure/persistence/userRepositoryImpl");
const validateUpdateRequest_1 = require("../middlewares/validateUpdateRequest");
const deliveryAddress_1 = require("../../domain/value-objects/deliveryAddress");
const servicePreferences_1 = require("../../domain/value-objects/servicePreferences");
const businessHours_1 = require("../../domain/value-objects/businessHours");
const skillSet_1 = require("../../domain/value-objects/skillSet");
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.userRepository = new userRepositoryImpl_1.UserRepositoryImpl();
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    throw new shared_1.BadRequestError("Email and password are required");
                }
                const { user, sessionToken } = yield this.authService.login(email, password);
                req.session = { jwt: sessionToken };
                res.status(200).json(user);
            }
            catch (error) {
                // throw new NotAuthorizeError();
                console.log(error);
                res.status(404).send(error);
            }
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const sessionToken = (_a = req.session) === null || _a === void 0 ? void 0 : _a.jwt;
                yield this.authService.logout(sessionToken);
                req.session = null;
                res.status(200).json({ message: "Logged out successfull" });
            }
            catch (error) {
                res.status(400).json({ message: "Logout failed" });
            }
        });
    }
    findUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const user = yield this.authService.findUserById(id);
                res.status(200).json(user);
            }
            catch (error) {
                res.status(400).json({ message: "User not found" });
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const updates = req.body;
                const currentUser = req.currentUser;
                if (currentUser.id !== id) {
                    throw new shared_1.BadRequestError("Unauthorized to update this user");
                }
                // Get existing user
                const existingUser = yield this.authService.findUserById(id);
                if (!existingUser) {
                    throw new shared_1.BadRequestError("User not found");
                }
                // Validate updates based on role
                (0, validateUpdateRequest_1.validateUpdateRequest)(existingUser.role, updates);
                // Apply updates
                const updatedUser = this.applyUpdates(existingUser, updates);
                // Save updated user
                yield this.userRepository.save(updatedUser);
                res.status(200).json(existingUser);
            }
            catch (error) {
                res.status(error instanceof shared_1.BadRequestError ? 400 : 500).json({
                    success: false,
                    error: error.message,
                });
            }
        });
    }
    applyUpdates(user, updates) {
        // Base fields that all users can update
        if (updates.fullName)
            user.updateFullName(updates.fullName);
        if (updates.password)
            user.changePassword(user.password, updates.password);
        let skillsArray = updates.skillSet;
        // Role-specific updates
        switch (user.role) {
            case "CLIENT":
                if (updates.deliveryAddress) {
                    user.updateDeliveryAddress(new deliveryAddress_1.DeliveryAddress(updates.deliveryAddress.street, updates.deliveryAddress.city, updates.deliveryAddress.postalCode, updates.deliveryAddress.state, updates.deliveryAddress.country));
                }
                if (updates.servicePreferences) {
                    user.updateServicePreferences(new servicePreferences_1.ServicePreferences(updates.servicePreferences));
                }
                break;
            case "ARTISAN":
                if (updates.businessName)
                    user.updateBusinessName(updates.businessName);
                if (updates.location)
                    user.updateLocation(updates.location);
                if (updates.skillSet) {
                    user.updateSkillSet(new skillSet_1.SkillSet(updates.skillSet));
                }
                if (updates.businessHours) {
                    user.updateBusinessHours(new businessHours_1.BusinessHours(updates.businessHours));
                }
                break;
            case "ADMIN":
                if (updates.permissions && user.role === "ADMIN") {
                    user.updatePermissions(updates.permissions);
                }
                break;
        }
        return user;
    }
}
exports.AuthController = AuthController;

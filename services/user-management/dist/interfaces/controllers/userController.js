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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userRepositoryImpl_1 = require("../../infrastructure/persistence/userRepositoryImpl");
const shared_1 = require("@fixserv-colauncha/shared");
const artisan_1 = require("../../infrastructure/persistence/models/artisan");
class UserController {
    constructor(userService) {
        this.userService = userService;
        this.response = new userRepositoryImpl_1.UserRepositoryImpl();
    }
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _a = req.body, { email, password, fullName, role } = _a, roleData = __rest(_a, ["email", "password", "fullName", "role"]);
                const { user } = yield this.userService.registerUser(email, password, fullName, role, roleData.clientData, roleData.artisanData, roleData.adminData);
                // req.session = { jwt: sessionToken };
                res.status(201).json(this.response.toJSON(user));
            }
            catch (error) {
                if (error.code === 11000) {
                    throw new shared_1.BadRequestError("Email already in use");
                }
                // return res.status(404).send(error);
            }
        });
    }
    users(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const artisans = yield artisan_1.ArtisanModel.find();
                if (!artisans) {
                    throw new shared_1.BadRequestError("No artisan in Database");
                }
                res.status(200).json({
                    results: artisans.length,
                    data: {
                        artisans,
                    },
                });
            }
            catch (error) {
                throw new shared_1.BadRequestError("Not found");
            }
        });
    }
    test(req, res) {
        res.send("Hello world");
    }
}
exports.UserController = UserController;

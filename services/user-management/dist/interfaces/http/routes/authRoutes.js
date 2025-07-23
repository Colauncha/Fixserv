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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = __importDefault(require("express"));
const userRepositoryImpl_1 = require("../../../infrastructure/persistence/userRepositoryImpl");
const jwtTokenService_1 = require("../../../infrastructure/services/jwtTokenService");
const authService_1 = require("../../../application/services/authService");
const AuthController_1 = require("../../controllers/AuthController");
const shared_1 = require("@fixserv-colauncha/shared");
const shared_2 = require("@fixserv-colauncha/shared");
const shared_3 = require("@fixserv-colauncha/shared");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
exports.adminRouter = router;
const userRepository = new userRepositoryImpl_1.UserRepositoryImpl();
const tokenService = new jwtTokenService_1.JwtTokenService();
const authService = new authService_1.AuthService(userRepository, tokenService);
const authController = new AuthController_1.AuthController(authService);
const authMiddleware = new shared_1.AuthMiddleware();
const validate = new shared_3.ValidateRequest();
router.post("/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Email must be valid"),
    (0, express_validator_1.body)("password").trim().notEmpty().withMessage("Password is required"),
], validate.validateRequest, authController.login.bind(authController));
router.post("/logout", authMiddleware.protect, authController.logout.bind(authController));
router.get("/currentUser", authMiddleware.protect, (0, shared_2.requireRole)("ADMIN", "ARTISAN"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userRepository.findById(req.currentUser.id);
    res.status(200).send(user);
}));
router.get("/artisan/:id", authController.findUserById.bind(authController));
router.get("/client/:clientId", authController.findUserById.bind(authController));
router.patch("/:id", authMiddleware.protect, (0, shared_2.requireRole)("ADMIN", "ARTISAN", "CLIENT"), authController.updateUser.bind(authController));

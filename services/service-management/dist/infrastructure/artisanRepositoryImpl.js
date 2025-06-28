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
exports.ArtisanRepositoryImpl = void 0;
const artisan_1 = require("../modules-from-user-management/artisan");
const artisan_2 = require("../modules-from-user-management/domain/entities/artisan");
class ArtisanRepositoryImpl {
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield artisan_1.ArtisanModel.findById(id).lean();
            if (!doc)
                return null;
            return this.toDomain(doc);
        });
    }
    exists(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield artisan_1.ArtisanModel.countDocuments({ _id: id });
            return count > 0;
        });
    }
    toDomain(doc) {
        return new artisan_2.Artisan(doc._id, doc.email, doc.password, doc.fullName, doc.businessName, doc.location, doc.rating, doc.skillSet, doc.businessHours);
    }
}
exports.ArtisanRepositoryImpl = ArtisanRepositoryImpl;

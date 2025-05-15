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
exports.ServiceRepositoryImpl = void 0;
const service_1 = require("../domain/entities/service");
const serviceDetails_1 = require("../domain/value-objects/serviceDetails");
const service_2 = require("./persistence/model/service");
class ServiceRepositoryImpl {
    findByArtisanId(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield service_2.ServiceModel.find({ artisanId });
            return docs.map(this.toDomain);
        });
    }
    save(service) {
        return __awaiter(this, void 0, void 0, function* () {
            yield service_2.ServiceModel.findOneAndUpdate({ _id: service.id }, {
                _id: service.id,
                artisanId: service.artisanId,
                title: service.details.title,
                description: service.details.description,
                price: service.details.price,
                estimatedDuration: service.details.estimatedDuration,
                isActive: service.isActive,
                rating: service.rating,
            }, { upsert: true });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield service_2.ServiceModel.findById(id);
            if (!doc)
                return null;
            return this.toDomain(doc);
        });
    }
    // async findByArtisanId(artisanId: string): //Promise<ServiceAggregate[]> {
    //   const docs = await ServiceModel.find({ //artisanId });
    //   return docs.map(this.toDomain);
    // }
    activateService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield service_2.ServiceModel.updateOne({ _id: id }, { isActive: true });
        });
    }
    deactivateService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield service_2.ServiceModel.updateOne({ _id: id }, { isActive: false });
        });
    }
    updateService(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateObj = {};
                if (updates.title !== undefined)
                    updateObj.title = updates.title;
                if (updates.description !== undefined)
                    updateObj.description = updates.description;
                if (updates.price !== undefined)
                    updateObj.price = updates.price;
                if (updates.estimatedDuration !== undefined)
                    updateObj.estimatedDuration = updates.estimatedDuration;
                if (updates.isActive !== undefined)
                    updateObj.isActive = updates.isActive;
                if (updates.rating !== undefined) {
                    updateObj.rating = updates.rating;
                    updateObj.$push = {
                        ratingHistory: {
                            rating: updates.rating,
                            updatedAt: new Date(),
                        },
                    };
                    const result = yield service_2.ServiceModel.updateOne({ _id: id }, { $set: updateObj });
                    if (result.matchedCount === 0) {
                        throw new Error("Service not found");
                    }
                }
            }
            catch (error) {
                throw new Error(`Failed to update service: ${error.message}`);
            }
        });
    }
    updateRating(serviceId, newRating) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield service_2.ServiceModel.findOneAndUpdate({ _id: serviceId }, {
                    $set: { rating: newRating },
                    $push: {
                        ratingHistory: {
                            rating: newRating,
                            updatedAt: new Date(),
                        },
                    },
                });
            }
            catch (error) {
                throw new Error(`Failed to update rating for service ${serviceId}: 
      ${error.message}`);
            }
        });
    }
    toDomain(doc) {
        return new service_1.Service(doc._id, doc.artisanId, new serviceDetails_1.ServiceDetails(doc.title, doc.description, doc.price, doc.estimatedDuration), doc.isActive, doc.rating);
    }
}
exports.ServiceRepositoryImpl = ServiceRepositoryImpl;

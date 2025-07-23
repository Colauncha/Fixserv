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
exports.serviceLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const service_1 = require("../../domain/entities/service");
const service_2 = require("../persistence/model/service");
const serviceDetails_1 = require("../../domain/value-objects/serviceDetails");
// Batch function to load many by IDs
const batchGetServices = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    const services = yield service_2.ServiceModel.find({ _id: { $in: ids } }).lean();
    const serviceMap = new Map(services.map((doc) => [
        doc._id.toString(),
        new service_1.Service(doc._id, doc.artisanId, new serviceDetails_1.ServiceDetails(doc.title, doc.description, doc.price, doc.estimatedDuration), doc.isActive, doc.rating),
    ]));
    return ids.map((id) => serviceMap.get(id) || null);
});
exports.serviceLoader = new dataloader_1.default(batchGetServices);

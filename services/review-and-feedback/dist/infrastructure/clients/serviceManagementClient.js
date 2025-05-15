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
exports.ServiceManagementClient = void 0;
class ServiceManagementClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    getService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield this.httpClient.get(`/${serviceId}`);
                return {
                    exists: true,
                    rating: response.data.rating,
                };
            }
            catch (error) {
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    return { exists: false };
                }
                throw new Error(`Failed to fetch service: ${error.message}`);
            }
        });
    }
    updateServiceRating(serviceId, newRating) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.httpClient.patch(`/${serviceId}`, {
                    rating: newRating,
                });
            }
            catch (error) {
                throw new Error(`Failed to update service rating: ${error.message}`);
            }
        });
    }
}
exports.ServiceManagementClient = ServiceManagementClient;

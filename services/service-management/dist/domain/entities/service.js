"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
class Service {
    constructor(id, artisanId, details, isActive, rating) {
        this.id = id;
        this.artisanId = artisanId;
        this.details = details;
        this.isActive = isActive;
        this.rating = rating;
    }
}
exports.Service = Service;

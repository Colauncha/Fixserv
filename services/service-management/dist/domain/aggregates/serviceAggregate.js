"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAggregate = void 0;
const service_1 = require("../../domain/entities/service");
const serviceDetails_1 = require("../value-objects/serviceDetails");
const uuid_1 = require("uuid");
class ServiceAggregate {
    constructor(_service) {
        this._service = _service;
    }
    static create(artisanId, title, description, price, estimatedDuration, rating) {
        const service = new service_1.Service((0, uuid_1.v4)(), artisanId, new serviceDetails_1.ServiceDetails(title, description, price, estimatedDuration), true, rating);
        return new ServiceAggregate(service);
    }
    get id() {
        return this._service.id;
    }
    get artisanId() {
        return this._service.artisanId;
    }
    get details() {
        return this._service.details;
    }
    get isActive() {
        return this._service.isActive;
    }
    get rating() {
        return this._service.rating;
    }
    deactivate() {
        this._service.isActive = false;
    }
    activate() {
        this._service.isActive = true;
    }
}
exports.ServiceAggregate = ServiceAggregate;

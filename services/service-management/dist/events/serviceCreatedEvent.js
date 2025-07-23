"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCreatedEvent = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ServiceCreatedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ServiceCreated";
        this.version = 1;
    }
}
exports.ServiceCreatedEvent = ServiceCreatedEvent;

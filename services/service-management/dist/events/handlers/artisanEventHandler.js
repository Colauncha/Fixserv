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
exports.ArtisanEventsHandler = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
const shared_2 = require("@fixserv-colauncha/shared");
class ArtisanEventsHandler {
    constructor() {
        this.eventBus = new shared_1.RedisEventBus();
        this.subscriptions = [];
    }
    setupSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventBus.subscribe("artisan_events", (event) => {
                if (event.eventName === "ArtisanCreated") {
                    this.handleArtisanCreated(event);
                }
            });
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
            this.subscriptions = [];
        });
    }
    handleArtisanCreated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("New artisan created:", event);
                // Send ACK
                const ack = new shared_2.EventAck(event.id, "processed", "service-management");
                yield this.eventBus.publish("event_acks", ack);
            }
            catch (error) {
                const ack = new shared_2.EventAck(event.id, "failed", "service-management", error.message);
                yield this.eventBus.publish("event_acks", ack);
            }
        });
    }
}
exports.ArtisanEventsHandler = ArtisanEventsHandler;

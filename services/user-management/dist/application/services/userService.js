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
exports.UserService = void 0;
const uuid_1 = require("uuid");
const shared_1 = require("@fixserv-colauncha/shared");
const userAggregate_1 = require("../../domain/aggregates/userAggregate");
const businessHours_1 = require("../../domain/value-objects/businessHours");
const deliveryAddress_1 = require("../../domain/value-objects/deliveryAddress");
const email_1 = require("../../domain/value-objects/email");
const password_1 = require("../../domain/value-objects/password");
const servicePreferences_1 = require("../../domain/value-objects/servicePreferences");
const skillSet_1 = require("../../domain/value-objects/skillSet");
const artisanCreatedEvent_1 = require("../../events/artisanCreatedEvent");
const shared_2 = require("@fixserv-colauncha/shared");
class UserService {
    constructor(userRepository, tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.eventBus = new shared_2.RedisEventBus();
        this.pendingEvents = new Map();
    }
    registerUser(email, password, fullName, role, clientData, artisanData, adminData) {
        return __awaiter(this, void 0, void 0, function* () {
            const emailData = new email_1.Email(email);
            const passwordData = yield password_1.Password.create(password);
            let user;
            switch (role) {
                case "CLIENT":
                    if (!clientData)
                        throw new shared_1.BadRequestError("Client data required");
                    user = userAggregate_1.UserAggregate.createClient((0, uuid_1.v4)(), emailData, passwordData, fullName, new deliveryAddress_1.DeliveryAddress(clientData.deliveryAddress.city, clientData.deliveryAddress.country, clientData.deliveryAddress.postalCode, clientData.deliveryAddress.state, clientData.deliveryAddress.street), new servicePreferences_1.ServicePreferences(clientData.servicePreferences));
                    break;
                case "ARTISAN":
                    if (!artisanData)
                        throw new shared_1.BadRequestError("Artisan data required");
                    user = userAggregate_1.UserAggregate.createArtisan((0, uuid_1.v4)(), emailData, passwordData, fullName, artisanData.businessName, artisanData.location, artisanData.rating, new skillSet_1.SkillSet(artisanData.skillSet), new businessHours_1.BusinessHours(artisanData.businessHours));
                    const event = new artisanCreatedEvent_1.ArtisanCreatedEvent({
                        name: user.businessName,
                        skills: user.skills.skills,
                    });
                    let unsubscribe = () => __awaiter(this, void 0, void 0, function* () { });
                    const ackPromise = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        const sub = yield this.eventBus.subscribe("event_acks", (ack) => {
                            if (ack.originalEventId === event.id) {
                                resolve(ack);
                                unsubscribe();
                            }
                        });
                        unsubscribe = sub.unsubscribe;
                    }));
                    this.pendingEvents.set(event.id, ackPromise);
                    try {
                        yield this.userRepository.save(user);
                        yield this.eventBus.publish("artisan_events", event);
                        const ack = yield Promise.race; //([ackPromise, timeout(5000)]);
                        // if (ack.status === "failed") {
                        //   throw new BadRequestError(`Event //processing failed: ${ack.//error}`);
                        //}
                    }
                    catch (err) {
                        this.pendingEvents.delete(event.id);
                        // throw new BadRequestError(err);
                    }
                    break;
                case "ADMIN":
                    if (!adminData)
                        throw new shared_1.BadRequestError("Admin data required");
                    user = userAggregate_1.UserAggregate.createAdmin((0, uuid_1.v4)(), emailData, passwordData, fullName, adminData.permissions);
                    break;
                default:
                    throw new shared_1.BadRequestError("Invalid role");
            }
            //const event = new ArtisanCreatedEvent({
            //  name: user.businessName,
            //  skills: user.skills.skills,
            //});
            //const sessionToken = this.tokenService.//generateSessionToken(
            //  user.id,
            //  user.email,
            //  user.role
            //);
            yield this.userRepository.save(user);
            return { user };
        });
    }
}
exports.UserService = UserService;
function timeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout reached")), ms));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artisan = void 0;
const user_1 = require("./user");
class Artisan extends user_1.User {
    constructor(id, email, password, fullName, businessName, rating, location, skillSet, businessHours) {
        super(id, email, password, fullName, "ARTISAN");
        this.businessName = businessName;
        this.rating = rating;
        this.location = location;
        this.skillSet = skillSet;
        this.businessHours = businessHours;
    }
    addSkill(newSkill) {
        return new Artisan(this.id, this.email, this.password, this.fullName, this.businessName, this.rating, this.location, this.skillSet.addSkill(newSkill), this.businessHours);
    }
    canProvideService(serviceType) {
        return this.skillSet.hasSkill(serviceType);
    }
}
exports.Artisan = Artisan;

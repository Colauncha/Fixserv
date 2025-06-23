"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateRequest = validateUpdateRequest;
const shared_1 = require("@fixserv-colauncha/shared");
function validateUpdateRequest(role, updates) {
    // Common validations
    if (updates.fullName && typeof updates.fullName !== "string") {
        throw new shared_1.BadRequestError("Full name must be a string");
    }
    //  if (updates.password && typeof updates.password !== "string") {
    //    throw new BadRequestError("Password must be a string");
    //  }
    // Role-specific validations
    switch (role) {
        case "CLIENT":
            if (updates.deliveryAddress) {
                const required = ["street", "city", "postalCode", "state", "country"];
                const missing = required.filter((field) => !updates.deliveryAddress[field]);
                if (missing.length > 0) {
                    throw new shared_1.BadRequestError(`Missing delivery address fields: ${missing.join(", ")}`);
                }
            }
            if (updates.servicePreferences) {
                if (!Array.isArray(updates.servicePreferences)) {
                    throw new shared_1.BadRequestError("Service preferences must be an array");
                }
                updates.servicePreferences.forEach((pref) => {
                    if (typeof pref !== "string") {
                        throw new shared_1.BadRequestError("Each service preference must be a string");
                    }
                });
            }
            break;
        case "ARTISAN":
            if (updates.businessName && typeof updates.businessName !== "string") {
                throw new shared_1.BadRequestError("Business name must be a string");
            }
            if (updates.skillSet) {
                validateSkillSet(updates.skillSet);
            }
            if (updates.businessHours) {
                validateBusinessHours(updates.businessHours);
            }
            break;
        case "ADMIN":
            if (updates.permissions && !Array.isArray(updates.permissions)) {
                throw new shared_1.BadRequestError("Permissions must be an array");
            }
            break;
    }
}
function validateBusinessHours(businessHours) {
    if (typeof businessHours !== "object" || businessHours === null) {
        throw new shared_1.BadRequestError("Business hours must be an object");
    }
    const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ];
    // Validate each day's structure
    for (const day of validDays) {
        const hours = businessHours[day];
        if (!hours)
            continue;
        if (typeof hours !== "object" || hours === null) {
            throw new shared_1.BadRequestError(`Business hours for ${day} must be an object`);
        }
        // Check for closed day
        if (hours.open === "closed" || hours.close === "closed") {
            if (hours.open !== hours.close) {
                throw new shared_1.BadRequestError(`If ${day} is closed, both open and close must be "closed"`);
            }
            continue;
        }
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(hours.open) || !timeRegex.test(hours.close)) {
            throw new shared_1.BadRequestError(`Invalid time format for ${day}. Use HH:MM (24-hour format) or "closed"`);
        }
        // Convert to Date objects for comparison
        const openTime = new Date(`2000-01-01T${hours.open}:00`);
        const closeTime = new Date(`2000-01-01T${hours.close}:00`);
        if (closeTime <= openTime) {
            throw new shared_1.BadRequestError(`Close time must be after open time for ${day}`);
        }
    }
}
function validateDeliveryAddress(address) {
    const required = ["street", "city", "postalCode", "state", "country"];
    const missing = required.filter((field) => !address[field]);
    if (missing.length > 0) {
        throw new shared_1.BadRequestError(`Missing delivery address fields: ${missing.join(", ")}`);
    }
}
function validateServicePreferences(preferences) {
    if (!Array.isArray(preferences)) {
        throw new shared_1.BadRequestError("Service preferences must be an array");
    }
}
function validateSkillSet(skillSet) {
    if (!Array.isArray(skillSet)) {
        throw new shared_1.BadRequestError("Skill set must be an array");
    }
    if (skillSet.length === 0) {
        throw new shared_1.BadRequestError("At least one skill is required");
    }
    skillSet.forEach((skill) => {
        if (typeof skill !== "string") {
            throw new shared_1.BadRequestError("Each skill must be a string");
        }
    });
}
function validatePermissions(permissions) {
    if (!Array.isArray(permissions)) {
        throw new shared_1.BadRequestError("Permissions must be an array");
    }
}

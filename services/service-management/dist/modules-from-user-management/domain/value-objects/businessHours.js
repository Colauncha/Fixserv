"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessHours = void 0;
class BusinessHours {
    constructor(schedule) {
        const defaultHours = { open: "09:00", close: "17:00" };
        this._schedule = {
            monday: schedule.monday || defaultHours,
            tuesday: schedule.tuesday || defaultHours,
            wednesday: schedule.wednesday || defaultHours,
            thursday: schedule.thursday || defaultHours,
            friday: schedule.friday || defaultHours,
            saturday: schedule.saturday || { open: "closed", close: "closed" },
            sunday: schedule.sunday || { open: "closed", close: "closed" },
        };
    }
    isOpen(day, time) {
        const hours = this._schedule[day];
        if (hours.open === "closed")
            return false;
        return time >= hours.open && time <= hours.close;
    }
    get schedule() {
        return Object.entries(this._schedule).reduce((acc, [day, hours]) => {
            acc[day] = `${hours.open}- ${hours.close}`;
            return acc;
        }, {});
    }
}
exports.BusinessHours = BusinessHours;

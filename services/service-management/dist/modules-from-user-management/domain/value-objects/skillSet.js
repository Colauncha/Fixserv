"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillSet = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class SkillSet {
    constructor(skills) {
        if (!skills || skills.length === 0) {
            throw new shared_1.BadRequestError("At least one skill is required");
        }
        this._skills = [...new Set(skills)];
    }
    toArray() {
        return [...this._skills];
    }
    get skills() {
        return [...this._skills];
    }
    hasSkill(skill) {
        return this._skills.includes(skill);
    }
    toJSON() {
        return this._skills;
    }
    addSkill(skill) {
        return new SkillSet([...this._skills, skill]);
    }
    static create(skills) {
        return new SkillSet(skills);
    }
}
exports.SkillSet = SkillSet;

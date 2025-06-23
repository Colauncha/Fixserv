"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillSet = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class SkillSet {
    constructor(skills) {
        if (!Array.isArray(skills)) {
            throw new shared_1.BadRequestError("Skills must be an array");
        }
        if (!skills || skills.length === 0) {
            throw new shared_1.BadRequestError("At least one skill is required");
        }
        skills.forEach((skill) => {
            if (typeof skill !== "string") {
                throw new shared_1.BadRequestError(`Invalid skill: ${skill}`);
            }
        });
        const sanitized = skills
            .filter((s) => typeof s === "string" && s.trim().length > 0)
            .map((s) => s.trim());
        if (sanitized.length === 0) {
            throw new shared_1.BadRequestError("At least one valid skill is required");
        }
        this._skills = [...new Set(skills)];
    }
    static fromJSON(raw) {
        return new SkillSet(Array.isArray(raw) ? raw : []);
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

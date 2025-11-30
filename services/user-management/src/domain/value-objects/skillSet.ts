import { BadRequestError } from "@fixserv-colauncha/shared";

export class SkillSet {
  private readonly _skills: string[];

  constructor(skills: any[]) {
    if (!Array.isArray(skills)) {
      throw new BadRequestError("Skills must be an array");
    }
    // if (!skills || skills.length === 0) {
    // // throw new BadRequestError("At least one skill is required");
    // }
    skills.forEach((skill) => {
      if (typeof skill !== "string") {
        throw new BadRequestError(`Invalid skill: ${skill}`);
      }
    });

    const sanitized = skills
      .filter((s) => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());

    // if (sanitized.length === 0) {
    //   throw new BadRequestError("At least one valid //skill is required");
    // }

    this._skills = [...new Set(skills)];
  }

  static fromJSON(raw: any): SkillSet {
    return new SkillSet(Array.isArray(raw) ? raw : []);
  }

  toArray(): string[] {
    return [...this._skills];
  }

  get skills(): string[] {
    return [...this._skills];
  }
  hasSkill(skill: string): boolean {
    return this._skills.includes(skill);
  }

  toJSON(): string[] {
    return this._skills;
  }

  addSkill(skill: string): SkillSet {
    return new SkillSet([...this._skills, skill]);
  }
  static create(skills: string[]): SkillSet {
    return new SkillSet(skills);
  }
}

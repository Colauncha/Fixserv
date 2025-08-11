import { BadRequestError } from "@fixserv-colauncha/shared";

export class SkillSet {
  private readonly _skills: string[];

  constructor(skills: string[]) {
    if (!skills || skills.length === 0) {
      throw new BadRequestError("At least one skill is required");
    }
    this._skills = [...new Set(skills)];
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

  toJSON() {
    return this._skills;
  }

  addSkill(skill: string): SkillSet {
    return new SkillSet([...this._skills, skill]);
  }
  static create(skills: string[]): SkillSet {
    return new SkillSet(skills);
  }
}

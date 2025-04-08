export class SkillSet {
  private readonly _skills: string[];

  constructor(skills: string[]) {
    if (!skills) {
      throw new Error("At least one skill is required");
    }
    this._skills = [...new Set(skills)];
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
}

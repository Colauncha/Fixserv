export class BaseService {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly createdBy: string, // e.g., adminId
    public readonly isActive: boolean = true
  ) {}
}

export class OfferedService {
  constructor(
    public readonly id: string,
    public readonly artisanId: string,
    public readonly baseServiceId: string,
    public readonly price: number,
    public readonly estimatedDuration: string,
    public readonly rating?: number,
    public readonly skillSet?: string[],
    public readonly isActive: boolean = true
  ) {}
}

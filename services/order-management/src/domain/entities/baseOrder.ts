export class BaseOrder {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly artisanId: string,
    public readonly offeredServiceId: string,
    public readonly baseServiceId: string,
    public readonly price: number,
    public readonly status:
      | "pending"
      | "accepted"
      | "completed"
      | "cancelled" = "pending",
    public readonly createdAt: Date = new Date()
  ) {}
}

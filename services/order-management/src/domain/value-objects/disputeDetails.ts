export class DisputeDetails {
  constructor(
    public readonly disputeId: string,
    public reason: string,
    public openedAt: Date,
    public resolvedAt?: Date,
    public resolution?: string
  ) {}
}

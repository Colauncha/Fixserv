export class ServiceDetails {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly price: number,
    public readonly estimatedDuration: string
  ) {}
}

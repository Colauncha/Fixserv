import { DisputeDetails } from "./disputeDetails";

export class EscrowDetails {
  constructor(
    public readonly escrowId: string,
    public amount: number,
    public status: "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED",
    public disputeDetails?: DisputeDetails
  ) {}
}

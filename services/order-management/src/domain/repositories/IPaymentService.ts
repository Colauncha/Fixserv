// src/domain/interfaces/IPaymentService.ts
export interface EscrowPaymentParams {
  escrowId: string;
  amount: number;
  clientId: string;
  artisanId: string;
  orderId: string;
}

export interface EscrowStatus {
  status: "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED";
  amount: number;
  orderId: string;
  clientId: string;
  artisanId: string;
  createdAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

export interface IPaymentService {
  /**
   * Creates a new escrow payment hold
   * @param params Payment details including escrow ID and amount
   */
  createEscrowPayment(params: EscrowPaymentParams): Promise<void>;

  /**
   * Releases funds from escrow to the artisan
   * @param escrowId The escrow transaction ID
   */
  releaseEscrowPayment(escrowId: string): Promise<void>;

  /**
   * Refunds funds from escrow back to the client
   * @param escrowId The escrow transaction ID
   */
  refundEscrowPayment(escrowId: string): Promise<void>;

  /**
   * Gets the current status of an escrow payment
   * @param escrowId The escrow transaction ID
   * @returns Current escrow status and details
   */
  getEscrowStatus(escrowId: string): Promise<EscrowStatus>;

  /**
   * Verifies a payment was successfully processed
   * @param paymentId The payment transaction ID
   */
  verifyPayment(paymentId: string): Promise<boolean>;
}

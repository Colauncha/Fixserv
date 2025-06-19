// src/infrastructure/services/payment-service.ts
import { v4 as uuidv4 } from "uuid";
import { IPaymentService } from "../repositories/IPaymentService";
import { EscrowStatus } from "../repositories/IPaymentService";

export class PaymentService implements IPaymentService {
  private escrowAccounts: Map<string, EscrowAccount> = new Map();

  async createEscrowPayment(params: {
    escrowId: string;
    amount: number;
    clientId: string;
    artisanId: string;
    orderId: string;
  }): Promise<void> {
    this.escrowAccounts.set(params.escrowId, {
      ...params,
      status: "HELD",
      createdAt: new Date(),
    });
    console.log(
      `Escrow created for order ${params.orderId} with amount ${params.amount}`
    );
  }

  async releaseEscrowPayment(escrowId: string): Promise<void> {
    const account = this.escrowAccounts.get(escrowId);
    if (!account) throw new Error("Escrow account not found");

    account.status = "RELEASED";
    account.releasedAt = new Date();
    console.log(`Escrow ${escrowId} released to artisan ${account.artisanId}`);
  }

  async refundEscrowPayment(escrowId: string): Promise<void> {
    const account = this.escrowAccounts.get(escrowId);
    if (!account) throw new Error("Escrow account not found");

    account.status = "REFUNDED";
    account.refundedAt = new Date();
    console.log(`Escrow ${escrowId} refunded to client ${account.clientId}`);
  }

  async getEscrowStatus(escrowId: string): Promise<EscrowStatus> {
    const account = this.escrowAccounts.get(escrowId);
    if (!account) throw new Error("Escrow account not found");

    return {
      status: account.status,
      amount: account.amount,
      orderId: account.orderId,
      clientId: account.clientId,
      artisanId: account.artisanId,
    };
  }
  async verifyPayment(paymentId: string): Promise<boolean> {
    return true;
  }
}

interface EscrowAccount {
  escrowId: string;
  amount: number;
  clientId: string;
  artisanId: string;
  orderId: string;
  status: "HELD" | "RELEASED" | "REFUNDED";
  createdAt: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

//interface EscrowStatus {
//  status: string;
//  amount: number;
//  orderId: string;
//}

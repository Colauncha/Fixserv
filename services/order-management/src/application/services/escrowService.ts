import { BadRequestError } from "@fixserv-colauncha/shared";
import { Order } from "../../domain/entities/order";
import { EscrowStatusEnum } from "../../domain/value-objects/escrowStatus";
import { EscrowPaymentModel } from "../../infrastructure/persistence/models/escrowPaymentModel";

export class EscrowService {
  public static async initiatePayment(order: Order) {
    if (order.escrowStatus !== EscrowStatusEnum.NOT_PAID) {
      throw new BadRequestError(
        "Escrow payment already initiated or completed"
      );
    }
    order.escrowStatus = EscrowStatusEnum.IN_ESCROW;

    await EscrowPaymentModel.create({
      orderId: order.id,
      paymentReference: order.paymentReference,
      amount: order.price,
      status: EscrowStatusEnum.IN_ESCROW,
    });
  }
  public static async releasePayment(order: Order): Promise<void> {
    if (order.escrowStatus !== EscrowStatusEnum.IN_ESCROW) {
      throw new BadRequestError(
        "Cannot release payment before it's in escrow."
      );
    }

    order.escrowStatus = EscrowStatusEnum.RELEASED;
    order.status = "COMPLETED";
    order.completedAt = new Date();

    await EscrowPaymentModel.updateOne(
      { orderId: order.id },
      {
        status: EscrowStatusEnum.RELEASED,
        releasedAt: new Date(),
      }
    );
  }

  public static async markAsDisputed(order: Order): Promise<void> {
    if (order.escrowStatus === EscrowStatusEnum.RELEASED) {
      throw new BadRequestError("Cannot dispute a released payment.");
    }

    order.escrowStatus = EscrowStatusEnum.DISPUTED;
    order.status = "CANCELLED";

    await EscrowPaymentModel.updateOne(
      { orderId: order.id },
      {
        status: EscrowStatusEnum.DISPUTED,
        releasedAt: new Date(),
      }
    );
  }
}

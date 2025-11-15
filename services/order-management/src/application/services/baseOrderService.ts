import { v4 as uuidv4 } from "uuid";

import { Order } from "../../domain/entities/order";
import axios from "axios";
import { NotFoundError, BadRequestError } from "@fixserv-colauncha/shared";
import { getOfferedServiceById } from "../../infrastructure/reuseableWrapper/getUserProfile";
import { BaseOrder } from "../../domain/entities/baseOrder";
import { IBaseOrderRepository } from "../../domain/repositories/baseOrderRepository";
import { WalletClient } from "../../infrastructure/reuseableWrapper/walletClient";

export class OfferedOrder {
  constructor(private baseOrderRepository: IBaseOrderRepository) {}

  async createOrder(clientId: string, id: string): Promise<BaseOrder> {
    // 1. Validate offered service from service-management

    const offeredService = await getOfferedServiceById(id);

    // 2. Create the order
    const baseOrder = new BaseOrder(
      uuidv4(),
      clientId,
      offeredService.data.artisanId,
      offeredService.data.id,
      offeredService.data.baseServiceId,
      offeredService.data.price
    );
    console.log("baseOrder", baseOrder);

    await this.baseOrderRepository.create(baseOrder);
    // Lock funds in client wallet
    await WalletClient.lockFundsForOrder(
      baseOrder.clientId,
      baseOrder.id,
      baseOrder.price
    );
    //PUBLISH Event
    //const event = new BaseOrderCreatedEvent({
    //  orderId: saveOrder.id,
    //  clientId: client.id,
    //  artisanId: service.artisanId,
    //  serviceId: service.id,
    //  price: service.details.price,
    //  clientAddress: client.deliveryAddress,
    //  createdAt: saveOrder.createdAt.toISOString(),
    //});
    // await this.eventBus.publish("base_order_events", event);
    return baseOrder;
  }

  async getBaseOrderById(id: string): Promise<BaseOrder | null> {
    const baseOrder = await this.baseOrderRepository.findById(id);
    if (!baseOrder) {
      throw new BadRequestError("Id does not belong to any base order");
    }
    return baseOrder;
  }
}

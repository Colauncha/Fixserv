import { v4 as uuidv4 } from "uuid";

import { Order } from "../../domain/entities/order";
import axios from "axios";
import { NotFoundError, BadRequestError } from "@fixserv-colauncha/shared";
import { getOfferedServiceById } from "../../infrastructure/reuseableWrapper/getUserProfile";
import { BaseOrder } from "../../domain/entities/baseOrder";
import { IBaseOrderRepository } from "../../domain/repositories/baseOrderRepository";

export class OfferedOrder {
  constructor(private baseOrderRepository: IBaseOrderRepository) {}

  async createOrder(clientId: string, id: string): Promise<BaseOrder> {
    // 1. Validate offered service from service-management

    const offeredService = await getOfferedServiceById(id);

    console.log(offeredService.data);

    // 2. Create the order
    const baseOrder = new BaseOrder(
      uuidv4(),
      clientId,
      offeredService.data.artisanId,
      offeredService.data.id,
      offeredService.data.baseServiceId,
      offeredService.data.price
    );

    await this.baseOrderRepository.create(baseOrder);
    return baseOrder;
  }
}

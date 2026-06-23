import { PlatformWalletModel } from "../../infrastructure/persistence/models/platformWalletModel";

export class PlatformWalletService {
  static async creditFee(data: {
    amount: number;
    orderId: string;
    artisanId: string;
    clientId: string;
  }) {
    await PlatformWalletModel.findOneAndUpdate(
      {
        accountId: "fixserv_platform",
      },
      {
        $inc: {
          balance: data.amount,
          totalEarned: data.amount,
        },

        $push: {
          transactions: {
            type: "CREDIT",
            purpose: "PLATFORM_FEE",
            amount: data.amount,
            orderId: data.orderId,
            artisanId: data.artisanId,
            clientId: data.clientId,
            createdAt: new Date(),
          },
        },
      },
      {
        upsert: true,
      },
    );
  }
}

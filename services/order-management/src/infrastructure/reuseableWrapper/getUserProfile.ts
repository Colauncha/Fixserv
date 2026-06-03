import { BadRequestError } from "@fixserv-colauncha/shared";
import { axiosClient } from "../clients/axiosClient";

import { safeAxiosCall } from "../clients/axiosClient";
// import { isDBReady, waitForConnection } from "@fixserv-colauncha/shared";

// Enhanced error mapping
const mapErrorToUserMessage = (error: any, serviceName: string): string => {
  if (error.status === 404) {
    return `${serviceName} not found`;
  }

  if (error.status === 429) {
    return `${serviceName} is currently busy. Please try again in a few moments.`;
  }

  if (error.status >= 500) {
    return `${serviceName} is temporarily unavailable. Please try again later.`;
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return `Request to ${serviceName} timed out. Please try again.`;
  }

  if (
    error.code === "ENOTFOUND" ||
    error.code === "ECONNRESET" ||
    error.code === "ECONNREFUSED"
  ) {
    return `Unable to connect to ${serviceName}. Please check your configuration.`;
  }

  if (error.code === "CIRCUIT_BREAKER_OPEN") {
    return `${serviceName} is temporarily unavailable due to repeated failures. Please try again later.`;
  }

  return `Unable to fetch data from ${serviceName}. Please try again later.`;
};

// Generic service call wrapper with database awareness
export const makeServiceCall = async (
  config: any,
  serviceName: string,
  resourceId?: string,
  requiresDB = false,
): Promise<any> => {
  try {
    console.log(
      `🔍 Fetching ${serviceName}${resourceId ? ` for ID: ${resourceId}` : ""}`,
    );

    // Check database connection if required
    // if (requiresDB && !isDBReady()) {
    //   console.warn(
    //     `⚠️ Database not ready for ${serviceName} call, attempting to connect...`
    //   );
    //   const dbReady = await waitForConnection(10000); // Wait up to 10 seconds

    //   if (!dbReady) {
    //     throw new BadRequestError(
    //       "Database connection is not available. Please try again in a moment."
    //     );
    //   }
    // }

    const result = await safeAxiosCall(config);

    if (result.success) {
      console.log(
        `✅ Successfully fetched ${serviceName}${
          resourceId ? ` for ID: ${resourceId}` : ""
        } (${result.duration}ms)`,
      );
      return result.data;
    }

    // Handle different error scenarios
    const error: any = result.error;
    const userMessage = mapErrorToUserMessage(error, serviceName);

    console.warn(`⚠️ ${serviceName} call failed:`, {
      resourceId,
      status: error.status,
      code: error.code,
      message: error.message,
      duration: result.duration,
    });

    throw new BadRequestError(userMessage);
  } catch (error: any) {
    // This catch handles BadRequestError and unexpected errors
    if (error instanceof BadRequestError) {
      throw error; // Re-throw managed errors
    }

    console.error(
      `❌ Unexpected error calling ${serviceName}${
        resourceId ? ` for ID: ${resourceId}` : ""
      } (service continues):`,
      {
        message: error.message,
        stack: error.stack?.split("\n")[0], // Only log first line of stack
      },
    );

    throw new BadRequestError(
      "An unexpected error occurred. Please try again later.",
    );
  }
};

export async function getServiceById(serviceId: string) {
  return makeServiceCall(
    {
      method: "get",
      url: `${process.env.SERVICE_MANAGEMENT_URL}/${serviceId}`,
    },
    "Service",
    serviceId,
  );
}

export async function getClientById(clientId: string) {
  return makeServiceCall(
    {
      method: "get",
      url: `${process.env.USER_MANAGEMENT_URL}/user/${clientId}`,
    },
    "Client",
    clientId,
  );
}

export async function getUserById(userId: string) {
  return makeServiceCall(
    {
      method: "get",
      url: `${process.env.USER_MANAGEMENT_URL}/user/${userId}`,
    },
    "User",
    userId,
  );
}

export async function getOfferedServiceById(id: string) {
  return makeServiceCall(
    {
      method: "get",
      url: `${process.env.BASESERVICE_MANAGEMENT_URL}/getOffered/${id}`,
    },
    "Offered Service",
    id,
  );
}

// Wallet service calls with database awareness
export class WalletClient {
  static async getTransactionHistory(clientId: string): Promise<any> {
    return makeServiceCall(
      {
        method: "get",
        url: `${process.env.WALLET_SERVICE_URL}/get-transaction/${clientId}`,
      },
      "Wallet Transaction History",
      clientId,
      true, // Requires database connection
    );
  }

  static async createWallet(
    clientId: string,
    initialBalance = 0,
  ): Promise<any> {
    return makeServiceCall(
      {
        method: "post",
        url: `${process.env.WALLET_SERVICE_URL}/create`,
        data: { clientId, initialBalance },
      },
      "Wallet Creation",
      clientId,
      true,
    );
  }

  static async getWalletBalance(clientId: string): Promise<any> {
    return makeServiceCall(
      {
        method: "get",
        url: `${process.env.WALLET_SERVICE_URL}/balance/${clientId}`,
      },
      "Wallet Balance",
      clientId,
      true,
    );
  }
}

// Enhanced testing endpoint with better error handling

// Health check for services
export async function checkServicesHealth(): Promise<any> {
  const services = [
    { name: "Service Management", url: process.env.SERVICE_MANAGEMENT_URL },
    { name: "User Management", url: process.env.USER_MANAGEMENT_URL },
    {
      name: "Base Service Management",
      url: process.env.BASESERVICE_MANAGEMENT_URL,
    },
    { name: "Wallet Service", url: process.env.WALLET_SERVICE_URL },
  ];

  const healthChecks = services.map(async (service) => {
    if (!service.url) {
      return {
        name: service.name,
        status: "error",
        message: "URL not configured",
      };
    }

    try {
      const result = await safeAxiosCall({
        method: "get",
        url: `${service.url}/health`,
        timeout: 5000,
      });

      return {
        name: service.name,
        status: result.success ? "healthy" : "unhealthy",
        responseTime: result.duration,
        ...(result.error && { error: result.error.message }),
      };
    } catch (error: any) {
      return {
        name: service.name,
        status: "error",
        message: error.message,
      };
    }
  });

  const results = await Promise.allSettled(healthChecks);

  return {
    timestamp: new Date().toISOString(),
    database: "connected",
    services: results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : { status: "error", message: "Health check failed" },
    ),
  };
}

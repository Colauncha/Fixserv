import { BadRequestError } from "@fixserv-colauncha/shared";
import { axiosClient } from "../clients/axiosClient";

/*
export async function getServiceById(serviceId: string) {
  try {
    const response = await axiosClient({
      method: "get",
      url: `${process.env.SERVICE_MANAGEMENT_URL}/${serviceId}`,
    });

    return response.data;
  } catch (error: any) {
    console.error(`❌ Failed to fetch service ${serviceId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });
    // throw new BadRequestError("Unable to fetch service details");
  }
}

export async function getClientById(clientId: string) {
  try {
    const response = await axiosClient({
      method: "get",
      url: `${process.env.USER_MANAGEMENT_URL}/user/${clientId}`,
    });

    return response.data;
  } catch (err) {
    console.error("Failed to fetch Client from user-management:", err);
    throw new BadRequestError("Unable to fetch Client details");
  }
}
export async function getOfferedServiceById(id: string) {
  try {
    const response = await axiosClient({
      method: "get",
      url: `${process.env.BASESERVICE_MANAGEMENT_URL}/getOffered/${id}`,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch OfferedService from service-management:",
      error
    );
    throw new BadRequestError("Unable to fetch OfferedService details");
  }
}
*/

/*
import { safeAxiosCall } from "../clients/axiosClient";

export async function getServiceById(serviceId: string) {
  try {
    console.log(`🔍 Fetching service by ID: ${serviceId}`);

    const result = await safeAxiosCall({
      method: "get",
      url: `${process.env.SERVICE_MANAGEMENT_URL}/${serviceId}`,
    });

    if (result.success) {
      console.log(`✅ Successfully fetched service: ${serviceId}`);
      return result.data;
    }

    // Handle different error scenarios without crashing
    const error: any = result.error;

    if (error.status === 404) {
      console.warn(`⚠️ Service ${serviceId} not found`);
      throw new BadRequestError(`Service with ID ${serviceId} not found`);
    }

    if (error.status === 429) {
      console.warn(`⚠️ Rate limited when fetching service ${serviceId}`);
      throw new BadRequestError(
        "Service management is currently busy. Please try again in a few moments."
      );
    }

    if (error.status >= 500) {
      console.warn(`⚠️ Service management server error for ${serviceId}`);
      throw new BadRequestError(
        "Service management is temporarily unavailable. Please try again later."
      );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      console.warn(`⚠️ Timeout when fetching service ${serviceId}`);
      throw new BadRequestError(
        "Request to service management timed out. Please try again."
      );
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNRESET") {
      console.warn(`⚠️ Network error when fetching service ${serviceId}`);
      throw new BadRequestError(
        "Unable to connect to service management. Please check your configuration."
      );
    }

    // Generic fallback
    console.warn(`⚠️ Unknown error when fetching service ${serviceId}:`, error);
    throw new BadRequestError(
      "Unable to fetch service details. Please try again later."
    );
  } catch (error: any) {
    // This catch block handles any unexpected errors to prevent service crash
    if (error instanceof BadRequestError) {
      throw error; // Re-throw our managed errors
    }

    console.error(
      `❌ Unexpected error fetching service ${serviceId} (service continues):`,
      error
    );
    throw new BadRequestError(
      "An unexpected error occurred. Please try again later."
    );
  }
}

export async function getClientById(clientId: string) {
  try {
    console.log(`🔍 Fetching client by ID: ${clientId}`);

    const result = await safeAxiosCall({
      method: "get",
      url: `${process.env.USER_MANAGEMENT_URL}/user/${clientId}`,
    });

    if (result.success) {
      console.log(`✅ Successfully fetched client: ${clientId}`);
      return result.data;
    }

    const error: any = result.error;

    if (error.status === 404) {
      console.warn(`⚠️ Client ${clientId} not found`);
      throw new BadRequestError(`Client with ID ${clientId} not found`);
    }

    if (error.status === 429) {
      console.warn(`⚠️ Rate limited when fetching client ${clientId}`);
      throw new BadRequestError(
        "User management is currently busy. Please try again in a few moments."
      );
    }

    if (error.status >= 500) {
      console.warn(`⚠️ User management server error for ${clientId}`);
      throw new BadRequestError(
        "User management is temporarily unavailable. Please try again later."
      );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      console.warn(`⚠️ Timeout when fetching client ${clientId}`);
      throw new BadRequestError(
        "Request to user management timed out. Please try again."
      );
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNRESET") {
      console.warn(`⚠️ Network error when fetching client ${clientId}`);
      throw new BadRequestError(
        "Unable to connect to user management. Please check your configuration."
      );
    }

    console.warn(`⚠️ Unknown error when fetching client ${clientId}:`, error);
    throw new BadRequestError(
      "Unable to fetch client details. Please try again later."
    );
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    console.error(
      `❌ Unexpected error fetching client ${clientId} (service continues):`,
      error
    );
    throw new BadRequestError(
      "An unexpected error occurred. Please try again later."
    );
  }
}

export async function getOfferedServiceById(id: string) {
  try {
    console.log(`🔍 Fetching offered service by ID: ${id}`);

    const result = await safeAxiosCall({
      method: "get",
      url: `${process.env.BASESERVICE_MANAGEMENT_URL}/getOffered/${id}`,
    });

    if (result.success) {
      console.log(`✅ Successfully fetched offered service: ${id}`);
      return result.data;
    }

    const error: any = result.error;

    if (error.status === 404) {
      console.warn(`⚠️ Offered service ${id} not found`);
      throw new BadRequestError(`Offered service with ID ${id} not found`);
    }

    if (error.status === 429) {
      console.warn(`⚠️ Rate limited when fetching offered service ${id}`);
      throw new BadRequestError(
        "Base service management is currently busy. Please try again in a few moments."
      );
    }

    if (error.status >= 500) {
      console.warn(`⚠️ Base service management server error for ${id}`);
      throw new BadRequestError(
        "Base service management is temporarily unavailable. Please try again later."
      );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      console.warn(`⚠️ Timeout when fetching offered service ${id}`);
      throw new BadRequestError(
        "Request to base service management timed out. Please try again."
      );
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNRESET") {
      console.warn(`⚠️ Network error when fetching offered service ${id}`);
      throw new BadRequestError(
        "Unable to connect to base service management. Please check your configuration."
      );
    }

    console.warn(
      `⚠️ Unknown error when fetching offered service ${id}:`,
      error
    );
    throw new BadRequestError(
      "Unable to fetch offered service details. Please try again later."
    );
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    console.error(
      `❌ Unexpected error fetching offered service ${id} (service continues):`,
      error
    );
    throw new BadRequestError(
      "An unexpected error occurred. Please try again later."
    );
  }
}
*/
import { safeAxiosCall } from "../clients/axiosClient";
import { isDBReady, waitForConnection } from "@fixserv-colauncha/shared";

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
  requiresDB = false
): Promise<any> => {
  try {
    console.log(
      `🔍 Fetching ${serviceName}${resourceId ? ` for ID: ${resourceId}` : ""}`
    );

    // Check database connection if required
    if (requiresDB && !isDBReady()) {
      console.warn(
        `⚠️ Database not ready for ${serviceName} call, attempting to connect...`
      );
      const dbReady = await waitForConnection(10000); // Wait up to 10 seconds

      if (!dbReady) {
        throw new BadRequestError(
          "Database connection is not available. Please try again in a moment."
        );
      }
    }

    const result = await safeAxiosCall(config);

    if (result.success) {
      console.log(
        `✅ Successfully fetched ${serviceName}${
          resourceId ? ` for ID: ${resourceId}` : ""
        } (${result.duration}ms)`
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
      }
    );

    throw new BadRequestError(
      "An unexpected error occurred. Please try again later."
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
    serviceId
  );
}

export async function getClientById(clientId: string) {
  return makeServiceCall(
    {
      method: "get",
      url: `${process.env.USER_MANAGEMENT_URL}/user/${clientId}`,
    },
    "Client",
    clientId
  );
}

export async function getOfferedServiceById(id: string) {
  return makeServiceCall(
    {
      method: "get",
      url: `${process.env.BASESERVICE_MANAGEMENT_URL}/getOffered/${id}`,
    },
    "Offered Service",
    id
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
      true // Requires database connection
    );
  }

  static async createWallet(
    clientId: string,
    initialBalance = 0
  ): Promise<any> {
    return makeServiceCall(
      {
        method: "post",
        url: `${process.env.WALLET_SERVICE_URL}/create`,
        data: { clientId, initialBalance },
      },
      "Wallet Creation",
      clientId,
      true
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
      true
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
    database: isDBReady() ? "connected" : "disconnected",
    services: results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : { status: "error", message: "Health check failed" }
    ),
  };
}

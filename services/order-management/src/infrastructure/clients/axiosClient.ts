import axios from "axios";
import axiosRetry from "axios-retry";
//import CircuitBreaker from "opossum";
//import { BadRequestError } from "@fixserv-colauncha/shared";

// Create base client with optimized configuration
const axiosClient = axios.create({
  timeout: 15000, // Reduced from 20s to 15s
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "true",
    "X-Service-Name": "order-management-service",
    "User-Agent": "OrderService/1.0",
    Accept: "application/json",
  },
  validateStatus: () => true, // Accept all status codes
});

// Configure retries with more conservative settings
axiosRetry(axiosClient, {
  retries: 2, // Reduced from 3 to 2
  retryDelay: (retryCount, error) => {
    // Handle rate limiting with longer delays
    if (error.response?.status === 429) {
      const delay = Math.min(30000, Math.pow(2, retryCount) * 3000); // Max 30s delay, reduced base
      console.log(`⏱️ Rate limited. Waiting ${delay}ms before retry...`);
      return delay;
    }

    // Exponential backoff for other errors - more conservative
    const delay = Math.min(15000, Math.pow(2, retryCount) * 1000); // Max 15s instead of 30s
    console.log(
      `🔄 Retry attempt ${retryCount} for ${error.config?.url} in ${delay}ms`,
    );
    return delay;
  },
  retryCondition: (error: any) => {
    // Only retry specific conditions
    const shouldRetry =
      // Server errors (5xx) - but not 501 (Not Implemented)
      (error.response &&
        error.response.status >= 500 &&
        error.response.status !== 501) ||
      // Network errors
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND" ||
      error.code === "EAI_AGAIN" ||
      // Rate limiting
      (error.response && error.response.status === 429) ||
      // Specific gateway errors
      (error.response && error.response.status === 502) ||
      (error.response && error.response.status === 503) ||
      (error.response && error.response.status === 504);

    // Don't retry on authentication/authorization errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false;
    }

    if (shouldRetry) {
      console.log(
        `🔄 Will retry request to ${error.config?.url}. Status: ${
          error.response?.status || error.code
        }`,
      );
    } else if (error.response?.status) {
      console.log(
        `⏭️ Not retrying request to ${error.config?.url}. Status: ${error.response.status}`,
      );
    }

    return shouldRetry;
  },
});

// Request interceptor with better logging
axiosClient.interceptors.request.use(
  (config) => {
    console.log(
      `📤 [${new Date().toISOString()}] ${config.method?.toUpperCase()} ${
        config.url
      }`,
    );
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error.message);
    return Promise.reject(error);
  },
);

// Response interceptor with improved error handling
axiosClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [${new Date().toISOString()}] ${response.status} ${
        response.config.url
      } (${response.headers["content-length"] || "unknown"} bytes)`,
    );
    return response;
  },
  (error) => {
    try {
      const url = error.config?.url || "unknown";
      const method = error.config?.method?.toUpperCase() || "unknown";
      const status = error.response?.status || "no response";
      const timestamp = new Date().toISOString();

      // Create structured error info
      const errorInfo = {
        timestamp,
        method,
        url,
        status,
        statusText: error.response?.statusText || "Unknown",
        message: error.message,
        code: error.code || "UNKNOWN",
        // Only log response data if it's not too large
        responseData:
          error.response?.data &&
          JSON.stringify(error.response.data).length < 500
            ? error.response.data
            : "[Response too large to log]",
      };

      console.error(`❌ [${timestamp}] ${method} ${url} failed:`, errorInfo);

      // Create enhanced error object
      const enhancedError = {
        ...error,
        isAxiosError: true,
        config: error.config,
        response: error.response,
        request: error.request,
        _errorInfo: errorInfo,
      };

      return Promise.reject(enhancedError);
    } catch (interceptorError) {
      console.error("❌ Response interceptor error:", interceptorError);
      return Promise.reject(error);
    }
  },
);

// Circuit breaker pattern for failing services
const circuitBreakers = new Map<
  string,
  {
    failures: number;
    lastFailureTime: number;
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
  }
>();

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

function getCircuitBreakerKey(config: any): string {
  const url = new URL(config.url);
  return `${url.hostname}:${
    url.port || (url.protocol === "https:" ? 443 : 80)
  }`;
}

function checkCircuitBreaker(config: any): boolean {
  const key = getCircuitBreakerKey(config);
  const breaker = circuitBreakers.get(key);

  if (!breaker || breaker.state === "CLOSED") {
    return true; // Allow request
  }

  if (breaker.state === "OPEN") {
    if (Date.now() - breaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      breaker.state = "HALF_OPEN";
      console.log(`🔄 Circuit breaker for ${key} switching to HALF_OPEN`);
      return true;
    }
    return false; // Block request
  }

  // HALF_OPEN state - allow one request
  return true;
}

function updateCircuitBreaker(config: any, success: boolean) {
  const key = getCircuitBreakerKey(config);
  let breaker = circuitBreakers.get(key);

  if (!breaker) {
    breaker = { failures: 0, lastFailureTime: 0, state: "CLOSED" };
    circuitBreakers.set(key, breaker);
  }

  if (success) {
    breaker.failures = 0;
    breaker.state = "CLOSED";
  } else {
    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      breaker.state = "OPEN";
      console.warn(
        `⚡ Circuit breaker OPENED for ${key} after ${breaker.failures} failures`,
      );
    }
  }
}

// Enhanced safe axios call with circuit breaker
const safeAxiosCall = async (config: any) => {
  const startTime = Date.now();

  try {
    // Check circuit breaker
    if (!checkCircuitBreaker(config)) {
      const key = getCircuitBreakerKey(config);
      console.warn(`⚡ Circuit breaker OPEN - blocking request to ${key}`);
      return {
        success: false,
        error: {
          status: 503,
          statusText: "Service Temporarily Unavailable",
          data: null,
          message: "Circuit breaker is open - service temporarily unavailable",
          code: "CIRCUIT_BREAKER_OPEN",
        },
        response: null,
      };
    }

    const response = await axiosClient(config);
    const duration = Date.now() - startTime;

    // Update circuit breaker on success
    if (response.status < 500) {
      updateCircuitBreaker(config, true);
    }

    // Check if response indicates an error
    if (response.status >= 400) {
      // Update circuit breaker on server errors
      if (response.status >= 500) {
        updateCircuitBreaker(config, false);
      }

      console.warn(
        `⚠️ HTTP ${response.status} for ${config.url} (${duration}ms)`,
      );

      return {
        success: false,
        error: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: `HTTP_${response.status}`,
        },
        response: response,
        duration,
      };
    }

    // Success case
    return {
      success: true,
      data: response.data,
      response: response,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Update circuit breaker on failure
    updateCircuitBreaker(config, false);

    console.error(`❌ Request failed (${duration}ms):`, {
      url: config.url,
      method: config.method,
      error: error.message,
      status: error.response?.status,
      code: error.code,
    });

    return {
      success: false,
      error: {
        status: error.response?.status || 0,
        statusText: error.response?.statusText || "Network Error",
        data: error.response?.data || null,
        message: error.message || "Unknown error",
        code: error.code || "UNKNOWN",
      },
      response: error.response,
      duration,
    };
  }
};

// Health check utility
const healthCheck = async (url: string, timeoutMs = 5000): Promise<boolean> => {
  try {
    const response = await axios.get(`${url}/health`, {
      timeout: timeoutMs,
      validateStatus: (status) => status < 500,
    });
    return response.status < 400;
  } catch (error) {
    return false;
  }
};

export { axiosClient, safeAxiosCall, healthCheck };

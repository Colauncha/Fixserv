import axios from "axios";
import axiosRetry from "axios-retry";
//import CircuitBreaker from "opossum";
//import { BadRequestError } from "@fixserv-colauncha/shared";

/*
const baseClient = axios.create({
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

// Retry faild requests

axiosRetry(baseClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      (error.response &&
        typeof error.response.status === "number" &&
        error.response.status >= 500) ||
      error.code === "ECONNABORTED"
    );
  },
});

// ⚡ Circuit breaker fallback
function fallback(error: any) {
  const message = error?.message || "Unknown error in circuit fallback";
  console.warn("⚠️ Circuit breaker fallback triggered:", message);
  throw new BadRequestError("Service temporarily unavailable");
}

// 🔌 Wrap requests in circuit breaker
const breaker = new CircuitBreaker((options: any) => baseClient(options), {
  timeout: 5000, // timeout per call
  errorThresholdPercentage: 50,
  resetTimeout: 10000, // try again after 10 sec
});

breaker.fallback(fallback);

export const axiosClient = breaker.fire.bind(breaker);
*/

/*
const baseClient = axios.create({
  timeout: 15000, // Increased timeout for service-to-service calls
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "true", // Add internal service header
  },
});

// Retry failed requests with better configuration
axiosRetry(baseClient, {
  retries: 2, // Reduced retries to avoid overwhelming services
  retryDelay: (retryCount, error) => {
    // Custom delay logic
    if (error.response?.status === 429) {
      // Longer delay for rate limiting
      return Math.min(30000, Math.pow(2, retryCount) * 5000);
    }
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error: any) => {
    return (
      // Retry on server errors
      (error.response && error.response.status >= 500) ||
      // Retry on network errors
      error.code === "ECONNABORTED" ||
      // Retry on rate limiting with backoff
      (error.response && error.response.status === 429)
    );
  },
});

// Enhanced fallback function with better error handling
function fallback(error: any) {
  const message = error?.message || "Unknown error in circuit fallback";
  console.warn("⚠️ Circuit breaker fallback triggered:", {
    message,
    status: error?.response?.status,
    service: error?.config?.baseURL || error?.config?.url,
    stack: error?.stack,
  });

  // Provide more specific error messages based on the original error
  if (error?.response?.status === 429) {
    throw new BadRequestError(
      "Service is rate limited. Please try again later."
    );
  }

  if (error?.response?.status >= 500) {
    throw new BadRequestError(
      "Service is temporarily down. Please try again later."
    );
  }

  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    throw new BadRequestError("Service request timed out. Please try again.");
  }

  if (error?.response?.status === 404) {
    throw new BadRequestError("Requested resource not found.");
  }

  // Generic fallback
  throw new BadRequestError(
    "Service temporarily unavailable. Please try again later."
  );
}

// Circuit breaker with better configuration
const breaker = new CircuitBreaker((options: any) => baseClient(options), {
  timeout: 12000, // Slightly less than axios timeout
  errorThresholdPercentage: 60, // More tolerant threshold
  resetTimeout: 30000, // Wait 30 seconds before trying again
  rollingCountTimeout: 60000, // 1 minute rolling window
  rollingCountBuckets: 6, // 6 buckets of 10 seconds each
  volumeThreshold: 5, // Need at least 5 requests before circuit can open
});

// Enhanced event logging
breaker.on("open", () => {
  console.warn("🔴 Circuit breaker opened - service calls will be blocked");
});

breaker.on("halfOpen", () => {
  console.warn("🟡 Circuit breaker half-open - testing service availability");
});

breaker.on("close", () => {
  console.info("🟢 Circuit breaker closed - service calls resumed");
});

breaker.on("fallback", (error: any) => {
  console.warn("⚠️ Circuit breaker fallback executed:", {
    error: error.message,
    timestamp: new Date().toISOString(),
  });
});

breaker.fallback(fallback);

export const axiosClient = breaker.fire.bind(breaker);
*/

/*
// Create base client with better configuration
const axiosClient = axios.create({
  timeout: 15000, // 15 second timeout for service-to-service calls
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "true",
    "X-Service-Name": "order-management-service", // Identify your service
    "User-Agent": "OrderService/1.0",
    Accept: "application/json",
  },
  validateStatus: () => true,
});

// Configure retries with exponential backoff
axiosRetry(axiosClient, {
  retries: 2,
  retryDelay: (retryCount, error) => {
    console.log(`🔄 Retry attempt ${retryCount} for ${error.config?.url}`);

    // Handle rate limiting with longer delays
    if (error.response?.status === 429) {
      const delay = Math.min(30000, Math.pow(2, retryCount) * 5000); // Max 60s delay
      console.log(`⏱️ Rate limited. Waiting ${delay}ms before retry...`);
      return delay;
    }

    // Exponential backoff for other errors
    // return axiosRetry.exponentialDelay(retryCount);

    // / Default exponential backoff
    const delay = Math.min(30000, Math.pow(2, retryCount) * 1000);
    console.log(
      `🔄 Retry attempt ${retryCount} for ${error.config?.url} in ${delay}ms`
    );
    return delay;
  },
  retryCondition: (error) => {
    const shouldRetry =
      // Retry on server errors (5xx)
      (error.response && error.response.status >= 500) ||
      // Retry on network errors
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND" ||
      // Retry on rate limiting
      (error.response && error.response.status === 429) ||
      // Retry on service unavailable
      (error.response && error.response.status === 503) ||
      // Retry on bad gateway
      (error.response && error.response.status === 502) ||
      // Retry on gateway timeout
      (error.response && error.response.status === 504);

    if (shouldRetry) {
      console.log(
        `🔄 Will retry request to ${error.config?.url}. Status: ${
          error.response?.status || error.code
        }`
      );
    }

    return !!shouldRetry;
  },
});

// Request interceptor for logging
axiosClient.interceptors.request.use(
  (config) => {
    console.log(
      `📤 Making request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for detailed error logging
axiosClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ Response received: ${response.status} from ${response.config.url}`
    );
    return response;
  },
  (error) => {
    // const url = error.config?.url || "unknown";
    // const method = error.config?.method?.toUpperCase() || "unknown";
    // const status = error.response?.status || "no response";
    //
    // console.error(`❌ Request failed: ${method} ${url}`, {
    //   status: status,
    //   statusText: error.response?.statusText,
    //   data: error.response?.data,
    //   message: error.message,
    //   code: error.code,
    // });
    //
    // return Promise.reject(error);
    try {
      const url = error.config?.url || "unknown";
      const method = error.config?.method?.toUpperCase() || "unknown";
      const status = error.response?.status || "no response";

      console.error(`❌ Internal request failed: ${method} ${url}`, {
        status: status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      // Transform error into a manageable format
      const managedError = {
        ...error,
        isAxiosError: true,
        config: error.config,
        response: error.response,
        request: error.request,
        // Add additional context
        _timestamp: new Date().toISOString(),
        _url: url,
        _method: method,
        _status: status,
      };

      return Promise.reject(managedError);
    } catch (interceptorError) {
      console.error("❌ Response interceptor error:", interceptorError);
      return Promise.reject(error); // Return original error if interceptor fails
    }
  }
);

// Wrapper function that NEVER crashes the service
const safeAxiosCall = async (config: any) => {
  try {
    const response = await axiosClient(config);

    // Check if response indicates an error (since we accept all status codes)
    if (response.status >= 400) {
      console.warn(`⚠️ HTTP error status ${response.status} for ${config.url}`);

      // Create a managed error object instead of throwing
      return {
        success: false,
        error: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
        response: response,
      };
    }

    // Success case
    return {
      success: true,
      data: response.data,
      response: response,
    };
  } catch (error: any) {
    console.error("❌ Axios call failed (service continues):", {
      url: config.url,
      method: config.method,
      error: error.message,
      status: error.response?.status,
    });

    // Return error object instead of throwing
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
    };
  }
};

export { axiosClient, safeAxiosCall };
*/

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
      `🔄 Retry attempt ${retryCount} for ${error.config?.url} in ${delay}ms`
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
        }`
      );
    } else if (error.response?.status) {
      console.log(
        `⏭️ Not retrying request to ${error.config?.url}. Status: ${error.response.status}`
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
      }`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling
axiosClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [${new Date().toISOString()}] ${response.status} ${
        response.config.url
      } (${response.headers["content-length"] || "unknown"} bytes)`
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
  }
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
        `⚡ Circuit breaker OPENED for ${key} after ${breaker.failures} failures`
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
        `⚠️ HTTP ${response.status} for ${config.url} (${duration}ms)`
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

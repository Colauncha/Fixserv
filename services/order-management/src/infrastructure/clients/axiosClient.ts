import { BadRequestError } from "@fixserv-colauncha/shared";
import axios from "axios";
import axiosRetry from "axios-retry";
import CircuitBreaker from "opossum";

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

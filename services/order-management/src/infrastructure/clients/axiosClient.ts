import { BadRequestError } from "@fixserv-colauncha/shared";
import axios from "axios";
import axiosRetry from "axios-retry";
import CircuitBreaker from "opossum";

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

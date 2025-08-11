import axios, { AxiosInstance } from "axios";

export function createAxiosClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 8000,
    headers: {
      "Content-Type": "application/json",
      "Service-Name": "review-and-feedback",
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: any) => {
      if (error.response) {
        // Handle specific status codes
        if (error.response.status === 404) {
          return Promise.reject(new Error("Resource not found"));
        }
        if (error.response.status === 401) {
          return Promise.reject(new Error("Unauthorized"));
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

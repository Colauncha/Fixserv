"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAxiosClient = void 0;
const axios_1 = __importDefault(require("axios"));
function createAxiosClient(baseURL) {
    const instance = axios_1.default.create({
        baseURL,
        timeout: 5000,
        headers: {
            "Content-Type": "application/json",
            "Service-Name": "review-service",
        },
    });
    instance.interceptors.response.use((response) => response, (error) => {
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
    });
    return instance;
}
exports.createAxiosClient = createAxiosClient;

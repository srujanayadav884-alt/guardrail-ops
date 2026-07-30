import axios from "axios";
import streamChat from "../../api/client";
// 1. Point directly to your active backend deployment on Render
const API_BASE_URL = "https://guardrail-ops-1.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Automatically attach the JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("guardrail_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Handle auth failures gracefully without breaking session loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear local storage if a protected request specifically returns 401 Unauthorized
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url?.includes("/auth/login") || 
                             error.config.url?.includes("/auth/admin-login");

      // Don't wipe session if the user simply typed wrong credentials on the login screen
      if (!isAuthEndpoint) {
        localStorage.removeItem("guardrail_token");
        localStorage.removeItem("guardrail_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
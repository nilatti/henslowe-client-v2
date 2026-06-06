import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s globally — only redirect if there was a stored token (expired session).
// Guest users hitting auth-required endpoints get the error propagated, not a redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem("auth_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (hadToken) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

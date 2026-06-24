import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

// Handle 401s globally — clear stored user and redirect to home if they had a session.
// Guest users hitting auth-required endpoints get the error propagated, not a redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadUser = !!localStorage.getItem("auth_user");
      localStorage.removeItem("auth_user");
      if (hadUser) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

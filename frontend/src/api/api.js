import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (email, name, password) =>
    api.post("/auth/register", { email, name, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
  getCurrentUser: () => api.get("/auth/me"),
};

export const logsApi = {
  createLog: (data) => api.post("/logs", data),
  getMyLogs: (limit = 50, offset = 0) =>
    api.get("/logs/my-logs", { params: { limit, offset } }),
  getLog: (logId) => api.get(`/logs/${logId}`),
  updateLog: (logId, data) => api.put(`/logs/${logId}`, data),
  deleteLog: (logId) => api.delete(`/logs/${logId}`),
};

export default api;

export const adminApi = {
  getAllUsers: () => api.get("/admin/users"),
  getUserLogs: (userId) => api.get(`/admin/users/${userId}/logs`),
  updateUserTeam: (userId, team) =>
    api.put(`/admin/users/${userId}/team`, { team }),
};

export const analyticsApi = {
  getMyStats: () => api.get("/analytics/me"),
  getAllStats: () => api.get("/analytics/all"),
  getTeamStats: (team) => api.get(`/analytics/team/${team}`),
};

export const teamsApi = {
  getTeams: () => api.get("/teams"),
  createTeam: (name) => api.post("/teams", { name }),
};

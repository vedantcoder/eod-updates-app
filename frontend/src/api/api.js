import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (email, name, password, team_id = null) => {
    const data = { email, name, password };
    if (team_id) data.team_id = team_id;
    return api.post("/auth/register", data);
  },
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

export const analyticsApi = {
  getMyStats: (weekStart) =>
    api.get("/analytics/my-stats", { params: weekStart ? { week_start: weekStart } : {} }),
  getMyTags: () => api.get("/analytics/my-tags"),
  getUserStats: (userId, weekStart) =>
    api.get(`/admin/users/${userId}/stats`, { params: weekStart ? { week_start: weekStart } : {} }),
  getGlobalStats: (teamId = null, weekStart = null) =>
    api.get("/admin/stats", {
      params: {
        ...(teamId ? { team_id: teamId } : {}),
        ...(weekStart ? { week_start: weekStart } : {}),
      },
    }),
};

export const adminApi = {
  getUsers: () => api.get("/admin/users"),
  getUserLogs: (userId, dateFrom, dateTo) =>
    api.get(`/admin/users/${userId}/logs`, { params: { date_from: dateFrom, date_to: dateTo } }),
};

export const teamsApi = {
  getTeams: () => api.get("/teams"),
};

export default api;

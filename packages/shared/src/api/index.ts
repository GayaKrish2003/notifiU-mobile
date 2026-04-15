import axios from "axios";
import { getToken } from "../utils/tokenStorage";


export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Payload = Record<string, unknown>;
type ApiData = Payload | FormData;

export const BASE_URL =
  // Expo injects EXPO_PUBLIC_* vars at build-time for React Native
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
  "http://localhost:5005/api";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sendChatMessage = (messages: ChatMessage[]) =>
  api.post("/chat", { messages });

export const login = (data: Payload) => api.post("/users/login", data);
export const register = (role: string | null, data: Payload) =>
  api.post(`/users/register/${role}`, data);

// ─── User Profile ─────────────────────────────────────────────
export const getUserProfile = () => api.get("/users/profile");
export const updateUserProfile = (data: Payload) => api.put("/users/profile", data);

// ─── Lecturer Profile (separate endpoint) ────────────────────
export const getLecturerProfile = () => api.get("/lecturer/profile");
export const updateLecturerProfile = (data: Payload) => api.put("/lecturer/profile", data);

// ─── Admin / User Management ──────────────────────────────────
export const getAllUsers = () => api.get("/users");
export const getUserById = (id: string) => api.get(`/users/${id}`);
export const updateUserByAdmin = (id: string, data: Payload) =>
  api.patch(`/users/${id}`, data);
export const updateAccountStatus = (id: string, status: string) =>
  api.patch(`/users/${id}/status`, { accountStatus: status });
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const exportUsersCSV = () =>
  api.get("/users/export/csv", { responseType: "blob" });
export const exportUsersExcel = () =>
  api.get("/users/export/excel", { responseType: "blob" });
export const getUserActivity = (id?: string) =>
  api.get(id ? `/users/${id}/activity` : "/users/activity");

// ─── Auth ─────────────────────────────────────────────────────
export const forgotPassword = (data: Payload) =>
  api.post("/auth/forgot-password", data);
export const verifyOTP = (data: Payload) => api.post("/auth/verify-otp", data);
export const resetPassword = (data: Payload) =>
  api.post("/auth/reset-password", data);

// ─── Tickets ──────────────────────────────────────────────────
export const getTickets = () => api.get("/tickets");
export const getTicketById = (id: string) => api.get(`/tickets/${id}`);
export const createTicket = (data: Payload) => api.post("/tickets", data);
export const updateTicket = (id: string, data: Payload) =>
  api.patch(`/tickets/${id}`, data);
export const deleteTicket = (id: string) => api.delete(`/tickets/${id}`);
export const addTicketResponse = (id: string, message: string) =>
  api.post(`/tickets/${id}/responses`, { response_message: message });

// ─── Announcements ────────────────────────────────────────────
export const getAnnouncements = (params?: Record<string, string>) =>
  api.get("/announcements", { params });
export const getAnnouncementById = (id: string) =>
  api.get(`/announcements/${id}`);
export const createAnnouncement = (data: ApiData) =>
  api.post("/announcements", data);
export const updateAnnouncement = (id: string, data: ApiData) =>
  api.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id: string) =>
  api.delete(`/announcements/${id}`);
export const deleteAnnouncementAttachment = (id: string, attachmentId: string) =>
  api.delete(`/announcements/${id}/attachments/${attachmentId}`);


export default api;
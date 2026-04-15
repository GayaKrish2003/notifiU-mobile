import axios from "axios";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Payload = Record<string, unknown>;
type ApiData = Payload | FormData;

const api = axios.create({
  baseURL: "http://localhost:5005/api",
});

const sanitizeToken = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};

const getAccessToken = (): string | null => {
  const directToken = localStorage.getItem("token");
  if (directToken) {
    return sanitizeToken(directToken);
  }

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser) as {
      accessToken?: string;
      token?: string;
    };
    const fallbackToken = parsed.accessToken || parsed.token;
    return fallbackToken ? sanitizeToken(fallbackToken) : null;
  } catch {
    return null;
  }
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Chat Bot API - Do not change the function
export const sendChatMessage = (messages: ChatMessage[]) =>
  api.post("/chat", { messages });

export const login = (data: Payload) => api.post("/users/login", data);
export const register = (role: string | null, data: Payload) =>
  api.post(`/users/register/${role}`, data);

export const getUserProfile = () => api.get("/users/profile");
export const updateUserProfile = (data: Payload) =>
  api.put("/users/profile", data);
export const getEditProfileRequest = () => api.get("/users/profile");
export const updateEditProfileRequest = (data: Payload) =>
  api.put("/users/profile", data);
export const getLecturerProfile = () => api.get("/users/lecturer-profile");
export const updateLecturerProfile = (data: Payload) =>
  api.put("/users/lecturer-profile", data);
export const getStudentProfile = () => api.get("/users/student-profile");
export const updateStudentProfile = (data: Payload) =>
  api.put("/users/student-profile", data);

export const getAllUsers = () => api.get("/users");
export const getUserById = (id: string) => api.get(`/users/${id}`);
export const getUsersByRole = (role: string) => api.get(`/users/role/${role}`);
export const updateUserByAdmin = (id: string, data: Payload) =>
  api.patch(`/users/${id}`, data);
export const updateAccountStatus = (id: string, status: string) =>
  api.patch(`/users/${id}/status`, { accountStatus: status }); // 
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const exportUsersCSV = () =>
  api.get("/users/export/csv", { responseType: "blob" });
export const exportUsersExcel = () =>
  api.get("/users/export/excel", { responseType: "blob" });
export const getUserActivity = (id?: string) =>
  api.get(id ? `/users/${id}/activity` : "/users/activity");

export const forgotPassword = (data: Payload) =>
  api.post("/auth/forgot-password", data);
export const verifyOTP = (data: Payload) => api.post("/auth/verify-otp", data);
export const resetPassword = (data: Payload) =>
  api.post("/auth/reset-password", data);

export const getTickets = () => api.get("/tickets");
export const getTicketById = (id: string) => api.get(`/tickets/${id}`);
export const createTicket = (data: Payload) => api.post("/tickets", data);
export const updateTicket = (id: string, data: Payload) =>
  api.patch(`/tickets/${id}`, data);
export const deleteTicket = (id: string) => api.delete(`/tickets/${id}`);
export const addTicketResponse = (id: string, message: string) =>
  api.post(`/tickets/${id}/responses`, { response_message: message });

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
export const deleteAnnouncementAttachment = (
  id: string,
  attachmentId: string,
) => api.delete(`/announcements/${id}/attachments/${attachmentId}`);

export default api;

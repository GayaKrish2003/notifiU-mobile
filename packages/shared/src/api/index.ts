import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, removeToken } from "../utils/tokenStorage";


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

/** Returns the server root URL without the /api suffix */
export const getServerURL = () => BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // Important for refresh token cookie
});

// Avoid circular imports or issues with the singleton by fetching token on each request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token Refresh Logic ──────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;
    const originalRequest = config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't refresh if the error is from the login or refresh endpoint itself
      const url = originalRequest.url || "";
      if (url.includes("/login") || url.includes("/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to get a new access token using the refresh token cookie
        const res = await axios.get(`${BASE_URL}/users/refresh`, { withCredentials: false });
        const { accessToken } = res.data;

        if (accessToken) {
          await setToken(accessToken);
          onTokenRefreshed(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired or missing)
        await removeToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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
  api.put(`/users/${id}`, data);
export const updateAccountStatus = (id: string, status: string) =>
  api.patch(`/users/${id}/status`, { accountStatus: status });
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const exportUsersCSV = () =>
  api.get("/users/export/csv", { responseType: "blob" });
export const exportUsersExcel = () =>
  api.get("/users/export/excel", { responseType: "blob" });
export const getUserActivity = (id: string) =>
  api.get(`/users/${id}/activity`);

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


// ─── Job Posts ─────────────────────────────────────────────────

// Job Provider
export const createJobPost = (data: Payload) =>
  api.post('/jobs', data);
export const getMyJobPosts = () =>
  api.get('/jobs/my-posts');
export const deleteJobPost = (id: string) =>
  api.delete(`/jobs/${id}`);

// Student
export const getApprovedJobPosts = (params?: Record<string, string>) =>
  api.get('/jobs', { params });
export const getBookmarkedJobs = () =>
  api.get('/jobs/bookmarks');
export const getAppliedJobs = () =>
  api.get('/jobs/applied');
export const toggleBookmark = (id: string) =>
  api.patch(`/jobs/${id}/bookmark`);
export const toggleMarkApplied = (id: string) =>
  api.patch(`/jobs/${id}/mark-applied`);
export const incrementViewCount = (id: string) =>
  api.patch(`/jobs/${id}/view`);

// SuperAdmin
export const getAllJobPostsAdmin = (params?: Record<string, string>) =>
  api.get('/jobs/admin', { params });
export const approveJobPost = (id: string) =>
  api.patch(`/jobs/${id}/approve`);
export const rejectJobPost = (id: string, rejectionReason: string) =>
  api.patch(`/jobs/${id}/reject`, { rejectionReason });
export const updateJobPost = (id: string, data: Partial<import("../types/auth").JobPost>) =>
  api.patch(`/jobs/${id}/edit`, data);
export const getJobAttachmentUrl = (id: string): string =>
  `${BASE_URL}/jobs/${id}/attachment`;
export const downloadJobAttachment = (id: string) =>
  api.get(`/jobs/${id}/attachment`, { responseType: "blob" });


export default api;

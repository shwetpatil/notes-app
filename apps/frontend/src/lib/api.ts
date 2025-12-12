import axios from "axios";
import { Note, CreateNoteInput, UpdateNoteInput, LoginInput, ApiResponse } from "@notes/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for better error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  register: async (data: LoginInput) => {
    const response = await apiClient.post<ApiResponse<{ user: any; message: string }>>(
      "/api/auth/register",
      data
    );
    return response.data;
  },

  login: async (data: LoginInput) => {
    const response = await apiClient.post<ApiResponse<{ user: any; message: string }>>(
      "/api/auth/login",
      data
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse>("/api/auth/logout");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<{ user: any }>>("/api/auth/me");
    return response.data;
  },
};

// ============================================================================
// Notes API
// ============================================================================

export const notesApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Note[]>>("/api/notes");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Note>>(`/api/notes/${id}`);
    return response.data;
  },

  create: async (data: CreateNoteInput) => {
    const response = await apiClient.post<ApiResponse<Note>>("/api/notes", data);
    return response.data;
  },

  update: async (id: string, data: UpdateNoteInput) => {
    const response = await apiClient.patch<ApiResponse<Note>>(`/api/notes/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/api/notes/${id}`);
    return response.data;
  },
};

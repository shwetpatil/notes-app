import axios from "axios";
import { Note, CreateNoteInput, UpdateNoteInput, LoginInput, ApiResponse } from "@notes/types";
import { trackAPICall } from "./monitoring";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to track timing
apiClient.interceptors.request.use(
  (config) => {
    // Store start time
    (config as any).metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error logging and performance tracking
apiClient.interceptors.response.use(
  (response) => {
    // Track API call performance
    const config = response.config as any;
    const duration = config.metadata ? Date.now() - config.metadata.startTime : 0;
    trackAPICall(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      duration,
      response.status
    );
    
    return response;
  },
  (error) => {
    // Track failed API calls
    const config = error.config as any;
    const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
    trackAPICall(
      config?.method?.toUpperCase() || 'GET',
      config?.url || '',
      duration,
      error.response?.status || 0
    );

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
  getAll: async (params?: { search?: string; tags?: string; archived?: boolean; trashed?: boolean; sortBy?: string; order?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.tags) queryParams.append("tags", params.tags);
    if (params?.archived !== undefined) queryParams.append("archived", String(params.archived));
    if (params?.trashed !== undefined) queryParams.append("trashed", String(params.trashed));
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.order) queryParams.append("order", params.order);
    
    const url = `/api/notes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get<ApiResponse<Note[]>>(url);
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

  togglePin: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Note>>(`/api/notes/${id}/pin`);
    return response.data;
  },

  toggleArchive: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Note>>(`/api/notes/${id}/archive`);
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Note>>(`/api/notes/${id}/favorite`);
    return response.data;
  },

  moveToTrash: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Note>>(`/api/notes/${id}/trash`);
    return response.data;
  },

  restoreFromTrash: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Note>>(`/api/notes/${id}/restore`);
    return response.data;
  },

  permanentDelete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/api/notes/${id}/permanent`);
    return response.data;
  },
};

// API Client utilities for frontend integration
// This file can be copied to the frontend project

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DocumentData {
  id: string;
  title: string;
  roomId: string;
  createdBy: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export class JourneeDocsApiClient {
  private baseUrl: string;
  private getAuthToken: () => Promise<string | null>;

  constructor(baseUrl: string, getAuthToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.getAuthToken = getAuthToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = (await response.json()) as ApiResponse<T>;
    return data;
  }

  // Authentication methods
  async verifyToken(): Promise<ApiResponse> {
    return this.makeRequest("/api/auth/verify");
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.makeRequest("/api/auth/me");
  }

  async authenticateWithLiveblocks(): Promise<ApiResponse> {
    return this.makeRequest("/api/auth/liveblocks", { method: "POST" });
  }

  // Document methods
  async getDocuments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PaginatedResponse<DocumentData>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/documents${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async getDocument(id: string): Promise<ApiResponse<DocumentData>> {
    return this.makeRequest(`/api/documents/${id}`);
  }

  async createDocument(title: string): Promise<ApiResponse<DocumentData>> {
    return this.makeRequest("/api/documents", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  async updateDocument(
    id: string,
    updates: { title?: string; collaborators?: string[] }
  ): Promise<ApiResponse<DocumentData>> {
    return this.makeRequest(`/api/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteDocument(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/documents/${id}`, {
      method: "DELETE",
    });
  }

  async renameDocument(
    id: string,
    title: string
  ): Promise<ApiResponse<DocumentData>> {
    return this.makeRequest(`/api/documents/${id}/rename`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  }

  async inviteCollaborator(
    id: string,
    email: string,
    permission: "room:read" | "room:write" = "room:write"
  ): Promise<ApiResponse> {
    return this.makeRequest(`/api/documents/${id}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, permission }),
    });
  }

  async removeCollaborator(id: string, userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/documents/${id}/collaborators/${userId}`, {
      method: "DELETE",
    });
  }

  async getDocumentAccess(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/documents/${id}/access`);
  }

  async updateDocumentAccess(
    id: string,
    usersAccesses: Record<string, string[]>
  ): Promise<ApiResponse> {
    return this.makeRequest(`/api/documents/${id}/access`, {
      method: "PATCH",
      body: JSON.stringify({ usersAccesses }),
    });
  }

  // User methods
  async searchUsers(query: string, limit?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append("limit", limit.toString());

    return this.makeRequest(`/api/users/search?${params.toString()}`);
  }

  async getUser(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/users/${id}`);
  }

  // Upload methods
  async uploadFile(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/api/upload/file`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return response.json() as Promise<ApiResponse>;
  }

  async uploadBase64Image(base64Data: string): Promise<ApiResponse> {
    return this.makeRequest("/api/upload/image/base64", {
      method: "POST",
      body: JSON.stringify({ base64Data }),
    });
  }

  async deleteFile(publicId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/upload/${publicId}`, {
      method: "DELETE",
    });
  }

  // Notification methods
  async getNotifications(page?: number, limit?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    const endpoint = `/api/notifications${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/notifications/mark-read/${id}`, {
      method: "POST",
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.makeRequest("/api/notifications/mark-all-read", {
      method: "POST",
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  }

  // Activity methods
  async getDocumentActivity(roomId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/activity/documents/${roomId}`);
  }

  async updatePresence(roomId: string, presence: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/activity/documents/${roomId}/presence`, {
      method: "POST",
      body: JSON.stringify(presence),
    });
  }

  async getUserActivity(limit?: number, days?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (days) params.append("days", days.toString());

    const endpoint = `/api/activity/user/activity${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }
}

// Usage example for frontend:
/*
import { useAuth } from '@clerk/nextjs';

export const useJourneeDocsApi = () => {
  const { getToken } = useAuth();

  const apiClient = new JourneeDocsApiClient(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    getToken
  );

  return apiClient;
};
*/

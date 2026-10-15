import { apiClient } from './client';
import { User, ApiResponse } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(email: string, password?: string): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    if (res.success && res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res;
  },

  async register(params: {
    name: string;
    email: string;
    password?: string;
    role: 'manager' | 'member';
    department: string;
    title: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<AuthResponse>('/auth/register', params);
    if (res.success && res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  },

  async logout(): Promise<void> {
    apiClient.setToken(null);
  },

  async switchUser(userId: string): Promise<ApiResponse<AuthResponse>> {
    const res = await apiClient.post<AuthResponse>('/auth/switch-user', { userId });
    if (res.success && res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res;
  },
};

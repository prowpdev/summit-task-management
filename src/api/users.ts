import { apiClient } from './client';
import { User, ApiResponse } from '../types';

export const usersApi = {
  async getAll(): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>('/users');
  },

  async getById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/users/${id}`);
  },
};

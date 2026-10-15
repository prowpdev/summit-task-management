import { apiClient } from './client';
import { NotificationItem, ApiResponse } from '../types';

export const notificationsApi = {
  async getAll(): Promise<ApiResponse<NotificationItem[]>> {
    return apiClient.get<NotificationItem[]>('/notifications');
  },

  async markAsRead(id: string): Promise<ApiResponse<NotificationItem>> {
    return apiClient.put<NotificationItem>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.post<{ count: number }>('/notifications/read-all');
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>('/notifications/unread-count');
  },

  async create(data: {
    userId: string;
    taskId: string;
    taskTitle: string;
    type: 'assignment' | 'status_change' | 'due_reminder' | 'comment';
    message: string;
  }): Promise<ApiResponse<NotificationItem>> {
    return apiClient.post<NotificationItem>('/notifications', data);
  },
};

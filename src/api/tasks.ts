import { apiClient } from './client';
import { Task, TaskStatus, ApiResponse, FilterState } from '../types';

export const tasksApi = {
  async getAll(filters?: Partial<FilterState>): Promise<ApiResponse<Task[]>> {
    const params = new URLSearchParams();
    if (filters?.searchQuery) params.append('q', filters.searchQuery);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters?.dateFilter && filters.dateFilter !== 'all') params.append('dateFilter', filters.dateFilter);
    if (filters?.assigneeId && filters.assigneeId !== 'all') params.append('assigneeId', filters.assigneeId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Task[]>(`/tasks${queryString}`);
  },

  async getById(id: string): Promise<ApiResponse<Task>> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>('/tasks', taskData);
  },

  async update(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/tasks/${id}`, updates);
  },

  async updateStatus(id: string, status: TaskStatus): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/tasks/${id}/status`, { status });
  },

  async toggleSubtask(taskId: string, subtaskId: string): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
  },

  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    return apiClient.delete<{ id: string }>(`/tasks/${id}`);
  },
};

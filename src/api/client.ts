import { ApiResponse } from '../types';

/**
 * Centralized API Client
 * Single point of configuration for headers, base URL, authentication tokens,
 * response parsing, and unified error handling.
 */
class ApiClient {
  private baseUrl: string = '/api';
  private authToken: string | null = null;

  constructor() {
    // Restore token from localStorage if available in browser
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('taskflow_auth_token');
    }
  }

  public setToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('taskflow_auth_token', token);
      } else {
        localStorage.removeItem('taskflow_auth_token');
      }
    }
  }

  public getToken(): string | null {
    return this.authToken;
  }

  /**
   * Centralized HTTP Request Method
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      let data: any = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
        console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        data: (data?.data !== undefined ? data.data : data) as T,
        message: data?.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network request failed';
      console.error(`[Network Error] ${options.method || 'GET'} ${endpoint}:`, message);
      return {
        success: false,
        error: message,
      };
    }
  }

  // Convenience verbs
  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();

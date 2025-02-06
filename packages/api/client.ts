import { storage } from './storage';
import { ApiConfig, ApiResponse } from './types';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await storage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log("[API] Starting request to:", endpoint);
      const authHeaders = await this.getAuthHeader();
      console.log("[API] Full URL:", `${this.baseUrl}${endpoint}`);
  
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          ...options.headers,
        },
      });
      
      console.log("[API] Response received");
      console.log("[API] Response status:", response.status);
      console.log("[API] Content-Type:", response.headers.get("content-type"));
  
      // Always try to get the response text first
      const responseText = await response.text();
      console.log("[API] Raw response text:", responseText);
  
      // Then parse it as JSON if it's not empty
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
        console.log("[API] Parsed JSON data:", data);
      } catch (parseError) {
        console.error("[API] JSON parse error:", parseError);
        throw new Error(`Failed to parse response: ${responseText}`);
      }
  
      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }
  
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error("[API] Error in fetchWithAuth:", error);
      throw error;
    }
  }
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { method: 'DELETE' });
  }
}
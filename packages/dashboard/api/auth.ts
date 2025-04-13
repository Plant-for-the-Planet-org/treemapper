import { storage } from './storage';

export class AuthManager {
  static async setToken(token: string): Promise<void> {
    await storage.setItem('auth_token', token);
  }

  static async getToken(): Promise<string | null> {
    return storage.getItem('auth_token');
  }

  static async removeToken(): Promise<void> {
    await storage.removeItem('auth_token');
  }
}

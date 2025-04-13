// packages/api/src/storage/web.ts
export class WebStorage implements Storage {
    async getItem(key: string): Promise<string | null> {
      return localStorage.getItem(key);
    }
  
    async setItem(key: string, value: string): Promise<void> {
      localStorage.setItem(key, value);
    }
  
    async removeItem(key: string): Promise<void> {
      localStorage.removeItem(key);
    }
  }
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optimized API configuration with caching and better performance
function deriveLanIpFromDebuggerHost(): string | null {
  try {
    const host = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
    if (!host || typeof host !== 'string') return null;
    const ip = host.split(':')[0];
    if (!ip) return null;
    return ip;
  } catch {
    return null;
  }
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Production URL for deployed backend
  const productionUrl = 'https://sahaja-krushi-backend-h0t1.onrender.com';
  
  // Development URLs
  if (__DEV__) {
    // Android emulator special hostname
    if (Platform.OS === 'android') {
      const lan = deriveLanIpFromDebuggerHost();
      if (lan && lan !== 'localhost') {
        return `http://${lan}:3000`;
      }
      return 'http://10.0.2.2:3000';
    }

    // iOS simulator or device: prefer LAN IP if available
    const lan = deriveLanIpFromDebuggerHost();
    if (lan && lan !== 'localhost') {
      return `http://${lan}:3000`;
    }

    // Development fallback
    return 'http://localhost:3000';
  }

  // Production fallback
  return productionUrl;
}

export const API_V1 = `${getApiBaseUrl()}/api/V1`;
export const FARMERS_BASE = `${API_V1}/farmers`;
export const NEWS_BASE = `${API_V1}/news`;
export const QUERIES_BASE = `${API_V1}/queries`;
export const CROP_REPORTS_BASE = `${API_V1}/crop-reports`;

// Optimized API client with caching and better error handling
export class OptimizedApiClient {
  private static instance: OptimizedApiClient;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  public static getInstance(): OptimizedApiClient {
    if (!OptimizedApiClient.instance) {
      OptimizedApiClient.instance = new OptimizedApiClient();
    }
    return OptimizedApiClient.instance;
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    return `${url}_${JSON.stringify(options || {})}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private async getCachedData(key: string): Promise<any | null> {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    useCache: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this.getCacheKey(url, options);
    
    // Check cache first for GET requests
    if (useCache && options.method === 'GET' || !options.method) {
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached data for:', endpoint);
        return cachedData;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful GET requests
      if (useCache && (options.method === 'GET' || !options.method)) {
        this.setCachedData(cacheKey, data);
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw error;
      }
    }
  }

  public async get<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, useCache);
  }

  public async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  public async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, false);
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, false);
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public clearCacheForEndpoint(endpoint: string): void {
    const url = `${this.baseUrl}${endpoint}`;
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(url));
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const apiClient = OptimizedApiClient.getInstance();

import { useAuthStore } from '@/store/authStore';

// Get the API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  skipRefreshToken?: boolean; // Skip refresh token flow
}

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * API Client for making authenticated requests to the backend
 */
class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private requestsQueue: Array<() => void> = [];

  /**
   * Get the current auth token from the store
   */
  private getAuthToken(): string | null {
    const authState = useAuthStore.getState();
    return authState.tokens?.accessToken || null;
  }

  /**
   * Get the current refresh token from the store
   */
  private getRefreshToken(): string | null {
    const authState = useAuthStore.getState();
    return authState.tokens?.refreshToken || null;
  }

  /**
   * Update tokens in the auth store
   */
  private updateTokens(tokens: { accessToken: string; refreshToken: string }) {
    const authState = useAuthStore.getState();
    const { user, isAuthenticated } = authState;
    useAuthStore.setState({
      tokens,
      user,
      isAuthenticated,
    });
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(success: boolean) {
    this.requestsQueue.forEach(callback => callback());
    this.requestsQueue = [];
  }

  /**
   * Format API endpoint URL
   */
  private formatUrl(endpoint: string): string {
    // If it's a full URL, use it as is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Ensure API_URL doesn't end with a slash
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    
    return `${baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise as Promise<boolean>;
    }

    this.isRefreshing = true;
    this.refreshPromise = new Promise<boolean>(async (resolve) => {
      try {
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token available, logout
          useAuthStore.getState().logout();
          resolve(false);
          return;
        }

        const response = await fetch(this.formatUrl('users/refresh-token'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          // Refresh token is invalid, logout
          useAuthStore.getState().logout();
          resolve(false);
          return;
        }

        const data = await response.json();
        
        // Update tokens in auth store
        this.updateTokens(data.tokens);
        
        resolve(true);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        useAuthStore.getState().logout();
        resolve(false);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    });

    const success = await this.refreshPromise;
    this.processQueue(success);
    return success;
  }

  /**
   * Make an API request with authentication handling
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requiresAuth = true,
      skipRefreshToken = false,
    } = options;

    // Prepare URL
    const url = this.formatUrl(endpoint);

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else {
        return {
          data: null,
          error: 'Authentication required',
          status: 401,
        };
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body if provided
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      // Make the request
      let response = await fetch(url, requestOptions);
      let status = response.status;

      // Debug the request (remove in production)
      console.debug('API Request:', {
        url,
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : null,
        status,
      });

      // Debug the full response headers
      const responseHeadersObj = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      
      console.debug('API Response Headers:', responseHeadersObj);

      // Clone the response to be able to read text/json from it multiple times
      const responseClone = response.clone();
      let responseText;
      try {
        responseText = await responseClone.text();
        console.debug('API Response Text:', responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''));
      } catch (e) {
        console.debug('Could not read response text');
      }

      // Handle token refresh if unauthorized
      if (status === 401 && requiresAuth && !skipRefreshToken) {
        console.debug('Received 401, attempting token refresh...');
        
        // Try to refresh the token
        const refreshSuccess = await this.refreshToken();
        
        if (!refreshSuccess) {
          console.debug('Token refresh failed');
          return {
            data: null,
            error: 'Authentication failed. Please log in again.',
            status: 401,
          };
        }
        
        console.debug('Token refresh successful, retrying request');
        
        // Retry the request with the new token
        const token = this.getAuthToken();
        if (token) {
          // Create fresh headers with the new token
          const newHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...headers,
          };
          
          // Create fresh request options
          const newRequestOptions: RequestInit = {
            method,
            headers: newHeaders,
          };
          
          // Add body if it was in the original request
          if (body) {
            newRequestOptions.body = JSON.stringify(body);
          }
          
          console.debug('Retrying request with new token:', {
            url,
            method,
            headers: newHeaders,
          });
          
          // Make the new request
          response = await fetch(url, newRequestOptions);
          status = response.status;
          
          console.debug('Retry response status:', status);
        }
      }

      // Parse response
      let data = null;
      let error = null;

      // Try to parse JSON response if available
      try {
        // Check if the response has JSON content
        const contentType = response.headers.get('Content-Type');
        
        if (contentType && (
          contentType.includes('application/json') || 
          contentType.includes('text/json') ||
          // Sometimes APIs return JSON without proper content type
          (responseText && responseText.trim().startsWith('{'))
        )) {
          try {
            // If we already have the text response, parse it
            if (responseText) {
              data = JSON.parse(responseText);
            } else {
              // Otherwise get JSON directly from the response
              data = await response.json();
            }
            console.debug('API Response Data:', data);
          } catch (e) {
            console.error('Error parsing JSON response:', e);
            error = 'Invalid JSON response';
          }
        } else {
          // For non-JSON responses, just store the text
          data = responseText ? { message: responseText } : null;
        }
      } catch (e) {
        console.error('Error processing response:', e);
      }

      // Check if response is not ok
      if (!response.ok) {
        error = data?.message || data?.error || response.statusText || 'An error occurred';
      }

      return { data, error, status };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Convenience methods for common HTTP methods
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient; 
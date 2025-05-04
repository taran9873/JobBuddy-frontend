import { useState, useCallback } from 'react';
import apiClient from '@/services/apiClient';

/**
 * Custom hook for making API requests in React components
 * Provides loading, error, and data states
 */
export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generic request function that handles common patterns
   */
  const request = useCallback(async <T>(
    apiCall: () => Promise<{ data: T | null; error: string | null; status: number }>,
    onSuccess?: (data: T) => void
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error, status } = await apiCall();
      
      if (error) {
        setError(error);
        return { data: null, error, status };
      }
      
      if (data && onSuccess) {
        onSuccess(data);
      }
      
      return { data, error: null, status };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { data: null, error: errorMessage, status: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Convenience methods for common HTTP methods
   */
  const get = useCallback(<T>(endpoint: string, options?: any, onSuccess?: (data: T) => void) => {
    return request<T>(() => apiClient.get(endpoint, options), onSuccess);
  }, [request]);
  
  const post = useCallback(<T>(endpoint: string, body: any, options?: any, onSuccess?: (data: T) => void) => {
    return request<T>(() => apiClient.post(endpoint, body, options), onSuccess);
  }, [request]);
  
  const put = useCallback(<T>(endpoint: string, body: any, options?: any, onSuccess?: (data: T) => void) => {
    return request<T>(() => apiClient.put(endpoint, body, options), onSuccess);
  }, [request]);
  
  const patch = useCallback(<T>(endpoint: string, body: any, options?: any, onSuccess?: (data: T) => void) => {
    return request<T>(() => apiClient.patch(endpoint, body, options), onSuccess);
  }, [request]);
  
  const del = useCallback(<T>(endpoint: string, options?: any, onSuccess?: (data: T) => void) => {
    return request<T>(() => apiClient.delete(endpoint, options), onSuccess);
  }, [request]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    clearError,
    request,
    get,
    post,
    put,
    patch,
    delete: del, // Renamed to avoid conflicts with JavaScript reserved keyword
  };
}

export default useApi; 
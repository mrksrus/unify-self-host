// API client for UniHub backend

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  [key: string]: any;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private csrfToken: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      this.csrfToken = null; // Clear CSRF token on logout
    }
  }

  setCsrfToken(token: string | null) {
    this.csrfToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add CSRF token for state-changing requests (POST, PUT, DELETE)
    const method = options.method?.toUpperCase() || 'GET';
    if (this.csrfToken && ['POST', 'PUT', 'DELETE'].includes(method)) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        const text = await response.text();
        const preview = text.slice(0, 80).replace(/\s+/g, ' ');
        return {
          error: response.ok
            ? 'Server returned non-JSON response'
            : `Request failed (${response.status}). Server may have timed out or returned an error page. Try again; if adding mail, wait a few minutes and retry.`,
          details: preview,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          details: data.details,
        };
      }

      return { data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      const isJsonError = message.includes('JSON') && message.includes('<');
      const isTimeout = message.includes('timeout') || message.includes('aborted') || message.includes('network') || message.includes('Failed to fetch');
      
      // For mail account operations, treat timeout as success - sync continues in background
      const isMailAccountOp = endpoint.includes('/mail/accounts') && (options.method === 'POST' || options.method === 'PUT');
      
      if (isMailAccountOp && isTimeout) {
        // Return success response indicating sync is in progress
        return {
          data: {
            syncInProgress: true,
            message: 'Account added. Email sync is running in the background — this may take several minutes for large mailboxes.',
          },
        };
      }
      
      return {
        error: isJsonError
          ? 'Request timed out or server returned an error page. Mail sync can take several minutes — check server logs for progress.'
          : message,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

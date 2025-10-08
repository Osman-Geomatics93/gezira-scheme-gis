// API Service Layer for Backend Communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper to set auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  console.log('🌐 API Request:', url, config);

  try {
    const response = await fetch(url, config);
    console.log('📡 API Response status:', response.status, response.statusText);

    const data = await response.json();
    console.log('📦 API Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetchAPI<{
      success: boolean;
      data: {
        user: {
          id: number;
          username: string;
          email: string;
          fullName: string;
          role: 'admin' | 'editor' | 'viewer';
        };
        token: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Store token in localStorage
    if (response.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }) => {
    return fetchAPI<{ success: boolean; data: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    return fetchAPI<{
      success: boolean;
      data: {
        user: {
          id: number;
          username: string;
          email: string;
          full_name: string;
          role: string;
          is_active: boolean;
          created_at: string;
        };
      };
    }>('/auth/profile');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return fetchAPI<{ success: boolean; message: string }>(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
  },
};

// Sectors API
export const sectorsAPI = {
  getAll: async (params?: {
    division?: string;
    search?: string;
    minArea?: number;
    maxArea?: number;
    office?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/sectors${queryString ? `?${queryString}` : ''}`;

    return fetchAPI<{
      success: boolean;
      data: {
        type: 'FeatureCollection';
        features: any[];
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    }>(endpoint);
  },

  getById: async (id: number) => {
    return fetchAPI<{
      success: boolean;
      data: {
        type: 'Feature';
        id: number;
        geometry: any;
        properties: any;
      };
    }>(`/sectors/${id}`);
  },

  getByDivision: async (division: string) => {
    return fetchAPI<{
      success: boolean;
      data: {
        type: 'FeatureCollection';
        features: any[];
      };
    }>(`/sectors/division/${division}`);
  },

  create: async (sectorData: any) => {
    return fetchAPI<{ success: boolean; data: { id: number } }>('/sectors', {
      method: 'POST',
      body: JSON.stringify(sectorData),
    });
  },

  update: async (id: number, updates: any) => {
    return fetchAPI<{ success: boolean; message: string }>(`/sectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  batchUpdate: async (updates: Array<{ id: number; [key: string]: any }>) => {
    return fetchAPI<{
      success: boolean;
      message: string;
      data: { updatedCount: number };
    }>('/sectors/batch-update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  },

  delete: async (id: number) => {
    return fetchAPI<{ success: boolean; message: string }>(`/sectors/${id}`, {
      method: 'DELETE',
    });
  },

  getHistory: async (id: number) => {
    return fetchAPI<{
      success: boolean;
      data: {
        history: Array<{
          id: number;
          action: string;
          field_name: string;
          old_value: string;
          new_value: string;
          changed_at: string;
          username: string;
          full_name: string;
        }>;
      };
    }>(`/sectors/${id}/history`);
  },
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user has required role
export const hasRole = (requiredRoles: string[]): boolean => {
  const user = getCurrentUser();
  return user && requiredRoles.includes(user.role);
};

export default {
  auth: authAPI,
  sectors: sectorsAPI,
  isAuthenticated,
  getCurrentUser,
  hasRole,
};

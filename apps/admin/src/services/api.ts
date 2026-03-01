// API Client - Handles all HTTP requests with proper authentication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

interface ApiOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

// Get token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('adminToken');
}

// Create URL with query parameters
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Generic API request handler
async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' = 'GET',
  body?: any,
  options: ApiOptions = {}
): Promise<T> {
  const url = buildUrl(endpoint, options.params);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  const timeout = options.timeout || API_TIMEOUT;

  try {
    const response = await fetchWithTimeout(url, requestOptions, timeout);

    // Handle 304 Not Modified - return empty data
    if (response.status === 304) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Unwrap API response format { success: true, data: T }
    // If response has this structure, return only the data property
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      return data.data as T;
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// API Client object with all endpoints
const apiClient = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ accessToken: string }>(
        '/auth/login',
        'POST',
        credentials,
        { headers: { 'Content-Type': 'application/json' } }
      ),
    logout: () =>
      request<void>('/auth/logout', 'POST'),
    getProfile: () =>
      request<any>('/users/me', 'GET'),
  },
  // Dashboard endpoints
  dashboard: {
    getStats: () =>
      request<{
        totalUsers: number;
        activeUsers: number;
        totalTransactions: number;
        totalRevenue: number;
        monthlyGrowth: number;
      }>('/admin/dashboard/stats'),

    getRecentActivity: () =>
      request<{
        activities: Array<{
          id: string;
          type: string;
          description: string;
          user: string;
          timestamp: string;
          amount: number | null;
        }>;
      }>('/admin/dashboard/recent-activity'),

    getUsers: (page?: number, limit?: number, search?: string, status?: string, role?: string) =>
      request<{
        data: Array<{
          id: number;
          avatar: string;
          name: string;
          email: string;
          role: string;
          balance: number;
          status: string;
          created: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        totalRecords: number;
      }>('/admin/dashboard/users', 'GET', undefined, {
        params: { page, limit, search, status, role },
      }),
  },

  // Transaction endpoints
  transactions: {
    getAll: (page?: number, limit?: number, status?: string, search?: string) =>
      request<{
        data: Array<{
          id: number;
          user: string;
          userId: number;
          amount: number;
          currency: string;
          method: string;
          status: 'paid' | 'unpaid';
          date: string;
          userNote: string | null;
          proofImageUrl: string | null;
          verificationNote: string | null;
        }>;
        total: number;
        page: number;
        limit: number;
      }>('/admin/transactions', 'GET', undefined, {
        params: { page, limit, status, search },
      }),

    getById: (transactionId: string | number) =>
      request<{
        id: number;
        user: string;
        userId: number;
        amount: number;
        currency: string;
        method: string;
        status: 'paid' | 'unpaid';
        date: string;
        userNote: string | null;
        proofImageUrl: string | null;
        verificationNote: string | null;
      }>(`/admin/transactions/${transactionId}`),

    verifyByHash: (transactionHash: string, amount: number, userId: number) =>
      request<{ message: string }>('/admin/transactions/verify-by-hash', 'POST', {
        transactionHash,
        amount,
        userId,
      }),

    markAsPaid: (transactionId: string | number, verificationNote?: string) =>
      request<{ message: string }>(`/admin/transactions/${transactionId}/verify`, 'POST', {
        verificationNote,
      }),

    reject: (transactionId: string | number, reason: string, verificationNote?: string) =>
      request<{ message: string }>(`/admin/transactions/${transactionId}/reject`, 'POST', {
        reason,
        verificationNote,
      }),
  },

  // User endpoints
  users: {
    getAll: (page?: number, limit?: number, status?: string, search?: string) =>
      request<{
        data: Array<{
          id: number;
          firstName: string;
          lastName: string | null;
          gender?: string | null;
          dob?: string | null;
          email: string;
          phoneNumber?: string | null;
          profilePictureUrl?: string | null;
          isVerified: boolean;
          status: string;
          role?: string;
          credits?: number;
          joinDate?: string;
          lastActivity?: string;
          totalPurchased?: number;
        }>;
        total: number;
        page: number;
        limit: number;
      }>('/admin/users', 'GET', undefined, {
        params: { page, limit, status, search },
      }),

    getById: (userId: number) =>
      request<{
        id: number;
        firstName: string;
        lastName: string | null;
        gender?: string | null;
        dob?: string | null;
        email: string;
        phoneNumber?: string | null;
        profilePictureUrl?: string | null;
        isVerified: boolean;
        status: string;
        role?: string;
        credits?: number;
        joinDate?: string;
        lastActivity?: string;
        totalPurchased?: number;
      }>(`/admin/users/${userId}`),

    addCredits: (userId: number, amount: number, reason: string, adminNote?: string) =>
      request<{ message: string; creditBalance: number }>(`/admin/users/${userId}/credits/add`, 'POST', {
        amount,
        reason,
        adminNote,
      }),

    deductCredits: (userId: number, amount: number, reason: string, adminNote?: string) =>
      request<{ message: string; creditBalance: number }>(`/admin/users/${userId}/credits/deduct`, 'POST', {
        amount,
        reason,
        adminNote,
      }),

    updateStatus: (userId: number, status: 'active' | 'suspended', reason?: string) =>
      request<{ message: string }>(`/admin/users/${userId}/status`, 'PATCH', {
        status,
        reason,
      }),

    delete: (userId: number) =>
      request<{ message: string }>(`/admin/users/${userId}`, 'DELETE'),
  },

  // Evaluation endpoints
  evaluations: {
    getAll: (page?: number, limit?: number, status?: string, search?: string) =>
      request<{
        data: Array<{
          id: number;
          name: string;
          description: string;
          status: string;
          createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
      }>('/admin/evaluations', 'GET', undefined, {
        params: { page, limit, status, search },
      }),
  },

  // Wallet endpoints (Admin)
  wallet: {
    // Credit packages
    createPackage: (data: { name: string; description: string; credits: number; price: number; currency: string; bonusCredits?: number; sortOrder?: number; isActive?: boolean }) =>
      request<{
        id: number;
        name: string;
        description: string;
        credits: number;
        bonusCredits: number;
        price: number;
        currency: string;
        discountInPercent: number;
        isActive: boolean;
        sortOrder: number;
        created_at: string;
        updated_at: string;
      }>('/admin/wallet/packages', 'POST', data),

    getAllPackages: () =>
      request<Array<{
        id: number;
        name: string;
        description: string;
        credits: number;
        bonusCredits: number;
        price: number;
        currency: string;
        discountInPercent: number;
        isActive: boolean;
        sortOrder: number;
        created_at: string;
        updated_at: string;
      }>>('/admin/wallet/packages', 'GET'),

    togglePackage: (packageId: number) =>
      request<{
        id: number;
        name: string;
        description: string;
        credits: number;
        bonusCredits: number;
        price: number;
        currency: string;
        discountInPercent: number;
        isActive: boolean;
        sortOrder: number;
        created_at: string;
        updated_at: string;
      }>(`/admin/wallet/packages/${packageId}/toggle`, 'PATCH'),

    // Manual wallet adjustment
    adjustWallet: (data: { userId: number; amount: number; type: 'CREDIT' | 'DEBIT'; reason: string; description?: string }) =>
      request<{
        id?: number;
        creditBalance?: number;
        updated_at: string;
        success?: boolean;
      }>('/admin/wallet/adjust', 'POST', data),
  },
};

export { request, apiClient };
export default apiClient;

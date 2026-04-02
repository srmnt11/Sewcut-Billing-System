const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Token management
const getToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// API client with automatic token refresh
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If token expired, try to refresh
  if (response.status === 401 && getRefreshToken()) {
    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: getRefreshToken() }),
    });

    if (refreshResponse.ok) {
      const { access } = await refreshResponse.json();
      setTokens(access, getRefreshToken()!);
      
      // Retry original request with new token
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${access}`,
        },
      });
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    console.error('API Error Details:');
    console.error('URL:', `${API_BASE_URL}${endpoint}`);
    console.error('Status:', response.status);
    console.error('Status Text:', response.statusText);
    console.error('Error Object:', error);
    console.error('Error JSON:', JSON.stringify(error, null, 2));
    
    const apiError: any = new Error(error.message || `HTTP ${response.status}`);
    apiError.response = { data: error, status: response.status };
    throw apiError;
  }

  // Handle empty responses (e.g., 204 No Content from DELETE)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

// Generic CRUD operations
function createCrudApi<T>(baseEndpoint: string) {
  return {
    list: (sort?: string) => {
      const url = sort ? `${baseEndpoint}?_sort=${sort}` : baseEndpoint;
      return apiRequest<T[]>(url);
    },
    get: (id: string | number) => 
      apiRequest<T>(`${baseEndpoint}${id}/`),
    create: (data: Partial<T>) =>
      apiRequest<T>(baseEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: Partial<T>) =>
      apiRequest<T>(`${baseEndpoint}${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string | number) =>
      apiRequest<void>(`${baseEndpoint}${id}/`, {
        method: 'DELETE',
      }),
  };
}

// API endpoints
export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiRequest<{ access: string; refresh: string }>('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }).then((data) => {
        setTokens(data.access, data.refresh);
        return data;
      }),
    register: (data: any) =>
      apiRequest('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () => {
      clearTokens();
      return Promise.resolve();
    },
    currentUser: () => apiRequest('/api/auth/me/'),
  },
  
  // Generic GET/POST methods for custom endpoints
  get: (endpoint: string) => apiRequest(endpoint),
  post: (endpoint: string, data: any) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  entities: {
    Client: createCrudApi('/api/clients/'),
    Supplier: createCrudApi('/api/suppliers/'),
    Quotation: createCrudApi('/api/quotations/'),
    Billing: createCrudApi('/api/billings/'),
    DeliveryReceipt: createCrudApi('/api/delivery-receipts/'),
    User: createCrudApi('/api/auth/users/'),
    Draft: createCrudApi('/api/drafts/'),
  },
  
  analytics: {
    dashboard: () => apiRequest('/api/analytics/dashboard/'),
    revenueChart: () => apiRequest('/api/analytics/revenue-chart/'),
    topClients: () => apiRequest('/api/analytics/top-clients/'),
    invoiceStatus: () => apiRequest('/api/analytics/invoice-status/'),
  },
};

export { getToken, clearTokens, setTokens };

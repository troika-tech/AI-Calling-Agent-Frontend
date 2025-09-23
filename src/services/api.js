const API_BASE_URL = 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('accessToken');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } else {
          throw new Error('Authentication failed');
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { access } = await response.json();
        localStorage.setItem('accessToken', access);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/me/whoami');
  }

  // Phone management
  async getPhones(page = 1, pageSize = 50, search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    return this.request(`/admin/phones?${params}`);
  }

  async importPhones(phones) {
    return this.request('/admin/phones/import', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    });
  }

  async setPhoneAgent(phone, agentId) {
    return this.request(`/admin/phones/${phone}/set_agent`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  async updatePhoneTags(phone, tags) {
    return this.request(`/admin/phones/${phone}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    });
  }

  // Campaign management
  async approveCampaign(campaignId, approve, reason = '') {
    return this.request(`/admin/campaigns/${campaignId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approve, reason }),
    });
  }

  // Call logs and sessions
  async getCallLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/admin/call_logs?${params}`);
  }

  async getSessions(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/admin/sessions?${params}`);
  }

  // User management
  async getUsers(page = 1, pageSize = 50, search = '', role = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    return this.request(`/admin/users?${params}`);
  }

  async getUser(userId) {
    return this.request(`/admin/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

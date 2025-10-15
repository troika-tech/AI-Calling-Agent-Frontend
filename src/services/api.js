const API_BASE_URL = 'http://localhost:5000/api/v1';
const DASHBOARD_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.dashboardBaseURL = DASHBOARD_BASE_URL;
    this.isRefreshing = false;
  }

  async request(endpoint, options = {}) {
    const { baseURL, ...fetchOptions } = options;
    const url = `${baseURL || this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'include', // Include HTTP-only cookies
      ...fetchOptions,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !this.isRefreshing) {
        // Token expired, try to refresh
        this.isRefreshing = true;
        const refreshed = await this.refreshToken();
        this.isRefreshing = false;

        if (refreshed) {
          // Retry the original request
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, redirect to login
          console.log('Authentication failed, redirecting to login');
          window.location.href = '/';
          throw new Error('Authentication failed');
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      // Only log errors that are not authentication-related
      if (!error.message.includes('Authentication failed')) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    // Handle 204 No Content responses
    if (response.status === 204) {
      return null;
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }
    
    return response.json();
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include HTTP-only cookies
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      // Don't log refresh failures - they're expected when not logged in
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

  async getUserProfile() {
    return this.request('/me');
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

  // Call logs
  async getCallLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/admin/call_logs?${params}`);
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

  // Agent management
  async getAgents(page = 1, pageSize = 50, search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    return this.request(`/admin/agents?${params}`);
  }

  async assignAgentToUser(userId, agentId) {
    return this.request(`/admin/users/${userId}/agents`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  async unassignAgentFromUser(userId, agentId) {
    return this.request(`/admin/users/${userId}/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  // User Dashboard endpoints (read-only)
  async getUserAgents(page = 1, pageSize = 25, search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    return this.request(`/agents?${params}`, { baseURL: this.dashboardBaseURL });
  }

  async getUserCallLogs(limit = 25, from = '', to = '', agentId = '', status = '', cursor = '') {
    const params = new URLSearchParams({ limit });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (agentId) params.append('agent_id', agentId);
    if (status) params.append('status', status);
    if (cursor) params.append('cursor', cursor);
    return this.request(`/call-logs?${params}`, { baseURL: this.dashboardBaseURL });
  }

  async getCallDetail(sessionId) {
    return this.request(`/call-logs/${sessionId}`, { baseURL: this.dashboardBaseURL });
  }

  async getCallRecording(sessionId) {
    return this.request(`/call-logs/${sessionId}/recording`, { baseURL: this.dashboardBaseURL });
  }

  async getUserCampaigns(page = 1, pageSize = 25, search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    return this.request(`/campaigns?${params}`, { baseURL: this.dashboardBaseURL });
  }

  async getCampaignDetail(id) {
    return this.request(`/campaigns/${id}`, { baseURL: this.dashboardBaseURL });
  }

  async getCampaignInfo(id) {
    return this.request(`/campaigns/${id}/info`, { baseURL: this.dashboardBaseURL });
  }

  async getUserPhones(page = 1, pageSize = 25, search = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.append('search', search);
    return this.request(`/phones?${params}`, { baseURL: this.dashboardBaseURL });
  }

  async getPhoneDetail(phone) {
    return this.request(`/phones/${phone}`, { baseURL: this.dashboardBaseURL });
  }

  async exportCallLogsCSV(from = '', to = '', agentId = '', status = '', cursor = '') {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (agentId) params.append('agent_id', agentId);
    if (status) params.append('status', status);
    if (cursor) params.append('cursor', cursor);

    const response = await fetch(`${this.dashboardBaseURL}/exports/calls.csv?${params}`, {
      method: 'GET',
      credentials: 'include', // For HTTP-only cookies
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }
}

export const api = new ApiService();

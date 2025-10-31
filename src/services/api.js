// Use environment variables with fallback for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const DASHBOARD_BASE_URL = import.meta.env.VITE_DASHBOARD_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.dashboardBaseURL = DASHBOARD_BASE_URL;
    this.isRefreshing = false;
    this.requestQueue = new Map();
    this.lastRequestTime = new Map();
    // Performance: Simple cache for GET requests (5 minute TTL)
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async request(endpoint, options = {}) {
    const { baseURL, ...fetchOptions } = options;
    const url = `${baseURL || this.baseURL}${endpoint}`;
    const isGetRequest = !fetchOptions.method || fetchOptions.method === 'GET';
    const cacheKey = `${url}${JSON.stringify(fetchOptions.body || {})}`;

    // Performance: Check cache for GET requests
    if (isGetRequest && !fetchOptions.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        return cached.data;
      }
    }

    // Rate limiting: prevent duplicate requests within 1 second
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(url);
    if (lastRequest && (now - lastRequest) < 1000) {
      // If there's a pending request for the same URL, return it
      if (this.requestQueue.has(url)) {
        return this.requestQueue.get(url);
      }
    }

    this.lastRequestTime.set(url, now);

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'include', // Include HTTP-only cookies
      ...fetchOptions,
    };

    // Create a promise for this request
    const requestPromise = this.makeRequest(url, config);
    this.requestQueue.set(url, requestPromise);

    try {
      const response = await requestPromise;
      this.requestQueue.delete(url);
      
      // Performance: Cache GET responses
      if (isGetRequest && !fetchOptions.skipCache && response) {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
        // Clean old cache entries periodically
        if (this.cache.size > 100) {
          const oldestKey = Array.from(this.cache.keys())[0];
          this.cache.delete(oldestKey);
        }
      }
      
      return response;
    } catch (error) {
      this.requestQueue.delete(url);
      // Only log errors that are not authentication-related
      if (!error.message.includes('Authentication failed')) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  async makeRequest(url, config) {
    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !this.isRefreshing) {
        // Check if we're already on login page or logging out
        if (window.location.pathname === '/' || url.includes('/auth/logout')) {
          // Already on login page or logging out, don't try to refresh
          return this.handleResponse(response);
        }
        
        // Token expired, try to refresh
        this.isRefreshing = true;
        const refreshed = await this.refreshToken();
        this.isRefreshing = false;

        if (refreshed) {
          // Retry the original request
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, redirect to login (only if not already there)
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
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
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const message = retryAfter 
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Too many requests, please try again later.';
        throw new Error(message);
      }
      
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
    // Don't try to refresh if we're on login page or logging out
    if (window.location.pathname === '/') {
      return false;
    }
    
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

  async register(email, name, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
  }

  async logout() {
    try {
      // Clear refresh flag to prevent refresh attempts after logout
      this.isRefreshing = false;
      
      // Try to call logout endpoint, but don't throw errors
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore errors - cookies will be cleared by backend or browser
      });
      
      return { success: true };
    } catch (error) {
      // Always return success on logout, even if API call fails
      return { success: true };
    }
  }

  async getCurrentUser() {
    return this.request('/me/whoami');
  }

  async getUserProfile() {
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

  async importExotelPhoneToMillis(phoneData) {
    console.log('Importing Exotel phone to Millis:', phoneData);
    return this.request('/admin/phones/import', {
      method: 'POST',
      body: JSON.stringify({
        phone: phoneData.phone_number,
        country: phoneData.country || 'IN',
        region: phoneData.region || 'IN',
        provider: 'exotel',
        api_key: phoneData.api_key || '',
        api_token: phoneData.api_token || '',
        sid: phoneData.account_sid || '',
        subdomain: phoneData.subdomain || ''
      }),
    });
  }

  // Get user's assigned phone numbers from user model
  async getAssignedPhoneNumbers() {
    try {
      console.log('Fetching assigned phone numbers from user model...');
      
      const response = await this.request('/user/assigned-phones', {
        method: 'GET',
      });

      console.log('Assigned phone numbers response:', response);

      if (response.success && response.items) {
        console.log('All assigned phone numbers:', response.items);
        return response.items;
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching assigned phone numbers:', err);
      return [];
    }
  }

  // Exotel API endpoints
  async getExotelPhoneNumbers() {
    try {
      console.log('Fetching Exotel phone numbers from backend...');
      
      // Fetch real phone numbers from the backend API
      const response = await this.request('/user/exotel-phones', {
        method: 'GET',
      });

      console.log('Exotel phone numbers response:', response);

      // Transform the response to match the expected format
      if (response.success && response.items) {
        console.log('All phone numbers from backend:', response.items);
        
        // Filter phone numbers to only show live status and correct format
        const filteredPhones = response.items
          .filter(phone => {
            console.log(`Checking phone: ${phone.phone_number}, status: ${phone.status}`);
            
            // Only show phones with 'live' or 'active' status
            if (phone.status !== 'active' && phone.status !== 'live') {
              console.log(`Filtered out ${phone.phone_number}: status is ${phone.status}, not active or live`);
              return false;
            }
            
            // Only show phones with correct format (starting with +91)
            if (!phone.phone_number || !phone.phone_number.startsWith('+91')) {
              console.log(`Filtered out ${phone.phone_number}: doesn't start with +91`);
              return false;
            }
            
            console.log(`Including phone: ${phone.phone_number}`);
            return true;
          })
          .map(phone => ({
            id: phone._id,
            number: phone.phone_number,
            name: phone.provider === 'exotel' ? 'Exotel Phone' : phone.provider,
            status: phone.status,
            tags: phone.tags || [],
            created_at: phone.created_at,
            last_used: phone.last_used,
            call_count: phone.call_count || 0,
            integration_status: phone.integration_status,
            metadata: phone.metadata || {}
          }));

        console.log('Filtered phone numbers (live/active status, +91 format):', filteredPhones);
        return filteredPhones;
      }

      // Fallback to empty array if no phones found
      return [];
    } catch (error) {
      console.error('Error fetching Exotel phone numbers:', error);
      
      // If API fails, return empty array instead of throwing
      // This allows the UI to still function
      return [];
    }
  }

  async getAgentDocuments(page = 1, limit = 25, campaignId = '', fileType = '') {
    const params = new URLSearchParams({ page, limit });
    if (campaignId) params.append('campaignId', campaignId);
    if (fileType) params.append('fileType', fileType);
    return this.request(`/agent-documents?${params}`);
  }

  async deleteAgentDocument(documentId) {
    return this.request(`/agent-documents/${documentId}`, {
      method: 'DELETE'
    });
  }

  async uploadKnowledgeBaseDocument(formData, campaignId) {
    console.log('Uploading knowledge base document...');
    return this.request(`/campaigns/${campaignId}/knowledge-base/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary for FormData
      }
    });
  }

  async getKnowledgeBaseDocuments(campaignId) {
    console.log('Getting knowledge base documents for campaign:', campaignId);
    return this.request(`/campaigns/${campaignId}/knowledge-base/documents`);
  }

  async deleteKnowledgeBaseDocument(campaignId, documentId) {
    console.log('Deleting knowledge base document:', { campaignId, documentId });
    return this.request(`/campaigns/${campaignId}/knowledge-base/documents/${documentId}`, {
      method: 'DELETE'
    });
  }

  async getCampaignCallerPhone(campaignId) {
    console.log('Getting caller phone for campaign:', campaignId);
    return this.request(`/campaigns/${campaignId}/caller-phone`);
  }

  async setCampaignCallerPhone(campaignId, phoneNumber, phoneData = {}, selectedDocuments = []) {
    console.log('Setting caller phone:', { campaignId, phoneNumber, phoneData, selectedDocuments });
    
    const payload = {
      caller_number: phoneNumber,
      caller_status: phoneData.status || 'live',
      objectid: phoneData.objectid || phoneData.id || '',
      metadata: {
        name: phoneData.name || 'Exotel Phone',
        tags: phoneData.tags || [],
        integration_status: phoneData.integration_status || 'success',
        provider: 'exotel',
        ...phoneData
      },
      selected_documents: selectedDocuments // Include selected documents
    };

    console.log('Caller phone payload:', payload);

    return this.request(`/campaigns/${campaignId}/caller-phone`, {
      method: 'POST',
      body: JSON.stringify(payload),
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

  // New Phase 1 methods
  async updateUserStatus(userId, status, reason = '') {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async updateUserSubscription(userId, subscriptionData) {
    return this.request(`/admin/users/${userId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(subscriptionData),
    });
  }

  async getUserUsage(userId) {
    return this.request(`/admin/users/${userId}/usage`);
  }

  // Admin Dashboard APIs
  async getAdminOverview() {
    return this.request('/admin/stats/overview');
  }

  async getAdminSystemHealth() {
    return this.request('/admin/stats/system-health');
  }

  async getAdminCallStats(period = 'month') {
    return this.request(`/admin/stats/calls?period=${period}`);
  }

  async getPendingCampaigns() {
    return this.request('/admin/campaigns/pending');
  }

  async getCampaignDetails(campaignId) {
    return this.request(`/admin/campaigns/${campaignId}`);
  }

  async approveCampaign(campaignId, approvalData) {
    return this.request(`/admin/campaigns/${campaignId}/approve`, {
      method: 'POST',
      body: JSON.stringify(approvalData),
    });
  }

  async rejectCampaign(campaignId, reason) {
    return this.request(`/admin/campaigns/${campaignId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAdminLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/admin/logs?${params}`);
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

  // Voice Agents APIs
  async getVoiceAgents(page = 1, pageSize = 25, search = '') {
    const params = new URLSearchParams({ page, limit: pageSize });
    if (search) params.append('search', search);
    return this.request(`/user/voice-agents?${params}`);
  }

  async syncVoiceAgentsFromMillis() {
    return this.request('/user/voice-agents/sync-from-millis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async createVoiceAgent(agentData) {
    return this.request('/user/voice-agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async updateVoiceAgent(id, agentData) {
    return this.request(`/user/voice-agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async deleteVoiceAgent(id) {
    return this.request(`/user/voice-agents/${id}`, {
      method: 'DELETE'
    });
  }

  async getUserCallLogs(limit = 25, from = '', to = '', agentId = '', status = '', cursor = '', direction = '', type = '') {
    const params = new URLSearchParams({ limit, page: 1 });
    if (from) params.append('date_from', from);
    if (to) params.append('date_to', to);
    if (status) params.append('status', status);
    if (direction) params.append('direction', direction);
    if (type) params.append('type', type);
    // Note: Using inbound calls endpoint - adjust based on user role
    return this.request(`/inbound/calls?${params}`);
  }

  async getCallDetail(callId) {
    return this.request(`/inbound/calls/${callId}`);
  }

  async getCallRecording(sessionId) {
    return this.request(`/call-logs/${sessionId}/recording`, { baseURL: this.dashboardBaseURL });
  }

  async getUserCampaigns(page = 1, pageSize = 25, search = '') {
    const params = new URLSearchParams({ page, limit: pageSize });
    if (search) params.append('search', search);
    // Use outbound campaigns endpoint for user campaigns
    return this.request(`/outbound/campaigns?${params}`);
  }

  async getCampaignDetail(id) {
    return this.request(`/outbound/campaigns/${id}`);
  }

  async getCampaignInfo(id) {
    return this.request(`/outbound/campaigns/${id}`);
  }

  async syncCampaignRecords(id) {
    return this.request(`/outbound/campaigns/${id}/sync-records`);
  }

  async syncCampaignsFromMillis() {
    return this.request('/outbound/campaigns/sync-from-millis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async createCampaign(campaignData) {
    return this.request('/outbound/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async updateCampaign(id, campaignData) {
    return this.request(`/outbound/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(campaignData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async launchCampaign(id) {
    return this.request(`/outbound/campaigns/${id}/launch`, {
      method: 'POST'
    });
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

  // Phase 3 - Inbound APIs
  async getInboundCalls(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/inbound/calls?${params}`);
  }

  async syncInboundCallsFromExotel(from = '', to = '') {
    return this.request('/inbound/calls/sync-exotel', {
      method: 'POST',
      body: JSON.stringify({ date_from: from, date_to: to })
    });
  }

  async getInboundCall(callId) {
    return this.request(`/inbound/calls/${callId}`);
  }

  async exportInboundCalls(filters = {}) {
    const response = await fetch(`${this.baseURL}/inbound/calls/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      credentials: 'include',
      body: JSON.stringify(filters)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  async getInboundLeads(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/inbound/leads?${params}`);
  }

  async getInboundLead(leadId) {
    return this.request(`/inbound/leads/${leadId}`);
  }

  async updateInboundLead(leadId, data) {
    return this.request(`/inbound/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async exportInboundLeads(filters = {}) {
    const response = await fetch(`${this.baseURL}/inbound/leads/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      credentials: 'include',
      body: JSON.stringify(filters)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  async getInboundAnalytics(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/inbound/analytics/overview?${params}`);
  }

  async getInboundTrends(period = 'day', filters = {}) {
    const params = new URLSearchParams({ period });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/inbound/analytics/trends?${params}`);
  }

  async getInboundPhoneNumbers() {
    return this.request('/inbound/analytics/phone-numbers');
  }

  // Outbound Campaign APIs
  async getOutboundCampaigns(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/outbound/campaigns?${params}`);
  }

  async getOutboundCampaign(campaignId) {
    return this.request(`/outbound/campaigns/${campaignId}`);
  }

  async createOutboundCampaign(formData) {
    return fetch(`${this.baseURL}/outbound/campaigns`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Failed to create campaign: ${response.status}`);
      }
      return response.json();
    });
  }

  async updateOutboundCampaign(campaignId, data) {
    return this.request(`/outbound/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteOutboundCampaign(campaignId) {
    return this.request(`/outbound/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  async pauseOutboundCampaign(campaignId) {
    return this.request(`/outbound/campaigns/${campaignId}/pause`, {
      method: 'POST',
    });
  }

  async resumeOutboundCampaign(campaignId) {
    return this.request(`/outbound/campaigns/${campaignId}/resume`, {
      method: 'POST',
    });
  }

  async launchOutboundCampaign(campaignId) {
    return this.request(`/outbound/campaigns/${campaignId}/launch`, {
      method: 'POST',
    });
  }

  async getOutboundCampaignAnalytics(campaignId) {
    return this.request(`/outbound/campaigns/${campaignId}/analytics`);
  }

  async getOutboundCalls(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/outbound/campaigns/${filters.campaignId || ''}/calls?${params}`);
  }

  async getOutboundLeads(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/outbound/campaigns/${filters.campaignId || ''}/leads?${params}`);
  }

  async updateOutboundLead(leadId, data) {
    return this.request(`/outbound/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getOutboundPhoneNumbers() {
    return this.request('/outbound/phones');
  }

  async getUserUsage() {
    return this.request('/me/usage');
  }

  async changePassword(data) {
    return this.request('/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Exotel Phone Management APIs
  async getExotelPhones(page = 1, limit = 25, search = '', status = '') {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return this.request(`/user/exotel-phones?${params}`);
  }

  async createExotelPhone(phoneData) {
    return this.request('/user/exotel-phones', {
      method: 'POST',
      body: JSON.stringify(phoneData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getExotelPhone(id) {
    return this.request(`/user/exotel-phones/${id}`);
  }

  async updateExotelPhone(id, phoneData) {
    return this.request(`/user/exotel-phones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(phoneData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async linkExotelPhoneAgent(phoneId, agentId) {
    return this.request(`/user/exotel-phones/${phoneId}/link-agent`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async deleteExotelPhone(id) {
    return this.request(`/user/exotel-phones/${id}`, {
      method: 'DELETE'
    });
  }

  async importExotelPhone(id) {
    return this.request(`/user/exotel-phones/${id}/import`, {
      method: 'POST'
    });
  }

  async getLiveExotelCalls(from = '', to = '') {
    // Map Exotel status to normalized status
    const normalizeExotelStatus = (exotelStatus) => {
      if (!exotelStatus) return 'failed';
      const status = String(exotelStatus).toLowerCase().trim();
      
      // Exotel status mappings to our status values
      const statusMap = {
        'completed': 'completed',
        'success': 'completed',
        'finished': 'completed',
        'answered': 'completed',
        'failed': 'failed',
        'error': 'failed',
        'busy': 'busy',
        'no-answer': 'no-answer',
        'no answer': 'no-answer',
        'noanswer': 'no-answer',
        'voicemail': 'voicemail',
        'ringing': 'ringing',
        'in-progress': 'ringing',
        'queued': 'ringing',
        'pending': 'ringing'
      };
      
      return statusMap[status] || 'failed';
    };

    const params = new URLSearchParams();
    if (from) params.append('start', from);
    if (to) params.append('end', to);
    params.append('_ts', Date.now());
    const resp = await this.request(`/inbound/calls/exotel/incoming?${params.toString()}`, { skipCache: true });
    const calls = Array.isArray(resp?.calls) ? resp.calls : [];
    // Normalize to table shape
    const items = calls.map(c => ({
      id: c.Sid || c.sid || c.CallSid,
      type: 'inbound',
      direction: 'incoming',
      phone_from: c.From || c.from,
      phone_to: c.To || c.to,
      agent_name: c.To || c.to || 'Unknown Agent',
      duration_seconds: Number(c.Duration || 0),
      status: normalizeExotelStatus(c.Status || 'failed'),
      cost: 0,
      created_at: c.StartTime ? new Date(c.StartTime).toISOString() : new Date().toISOString(),
      recording_url: c.RecordingUrl || c.recording_url || ''
    }));
    return { items };
  }
}

export const api = new ApiService();

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { convertToIST } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const UserPhones = () => {
  const { showSuccess, showError, showConfirm } = useToast();
  const [phones, setPhones] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);

  // Exotel form states
  const [showExotelForm, setShowExotelForm] = useState(false);
  const [exotelForm, setExotelForm] = useState({
    provider: 'exotel',
    phone_number: '',
    api_key: '',
    api_token: '',
    account_sid: '',
    subdomain: '',
    app_id: '',
    region: 'us-west',
    country: 'United States (+1)',
    tags: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Exotel phones states
  const [importing, setImporting] = useState(false);

  // Link to agent modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [linking, setLinking] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-refresh phones list every 10 seconds to detect new agent assignments
  // Only refresh if not currently loading to prevent overload
  useEffect(() => {
    let intervalId;
    
    const checkForUpdates = async () => {
      // Circuit breaker: Stop auto-refresh after 3 consecutive failures
      if (consecutiveErrors >= 3) {
        console.warn('⚠️ Auto-refresh paused due to repeated API failures. Refresh page manually to resume.');
        if (intervalId) clearInterval(intervalId);
        return;
      }
      
      // Don't auto-refresh if already loading or if user is actively searching
      if (!loading && !searchTerm) {
        try {
          await loadPhones();
          setConsecutiveErrors(0); // Reset on success
        } catch (err) {
          console.log('Auto-refresh skipped due to error:', err.message);
          setConsecutiveErrors(prev => prev + 1);
        }
      }
    };
    
    // Check every 10 seconds (reduced from 3s to prevent overload)
    intervalId = setInterval(checkForUpdates, 10000);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentPage, searchTerm, loading, consecutiveErrors]);

  useEffect(() => {
    loadPhones();
  }, [currentPage, searchTerm, tagFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load voice agents for agent name lookup
      const agentsResponse = await api.getVoiceAgents(1, 100);
      setAgents(agentsResponse.data?.items || agentsResponse.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPhones = async (showNotification = false) => {
    try {
      setLoading(true);
      setConsecutiveErrors(0); // Reset error count on manual load
      
      // Load both regular phones and Exotel phones
      const [phonesResponse, exotelPhonesResponse] = await Promise.all([
        api.getUserPhones(currentPage, pageSize, searchTerm),
        api.getExotelPhones(1, 100, searchTerm)
      ]);
      
      const regularPhones = phonesResponse.items || [];
      const exotelPhones = exotelPhonesResponse.items || [];
      
      // Combine both phone types into one unified list
      const combinedPhones = [
        ...regularPhones.map(phone => ({
          ...phone,
          phone_type: 'regular',
          display_number: phone.id || phone.phone_number || phone.number,
          display_agent: getAgentName(phone.agent_id),
          display_status: phone.status || 'active',
          display_tags: phone.tags || [],
          display_created: phone.created_at
        })),
        ...exotelPhones.map(phone => {
          // Extract agent name from populated assigned_agent_id
          let agentName = null; // Default to null instead of 'Exotel Phone'
          let agentId = null;
          
          if (phone.assigned_agent_id) {
            // Check if it's populated as an object with name
            if (typeof phone.assigned_agent_id === 'object') {
              if (phone.assigned_agent_id.name) {
                agentName = phone.assigned_agent_id.name;
                agentId = phone.assigned_agent_id._id || phone.assigned_agent_id.id;
                console.log(`✓ Exotel phone ${phone.phone_number} has agent: ${agentName}`);
              }
            }
            // If it's just a string ID, try to find it in agents list
            else if (typeof phone.assigned_agent_id === 'string') {
              agentId = phone.assigned_agent_id;
              const foundAgent = agents.find(a => 
                a._id === agentId || 
                a.id === agentId || 
                a.millis_agent_id === phone.millis_agent_id
              );
              if (foundAgent) {
                agentName = foundAgent.name;
                console.log(`✓ Found agent in list: ${agentName}`);
              } else {
                agentName = getAgentName(agentId);
              }
            }
          }
          
          // If still no agent found, check millis_agent_id
          if (!agentName && phone.millis_agent_id) {
            const foundAgent = agents.find(a => a.millis_agent_id === phone.millis_agent_id);
            if (foundAgent) {
              agentName = foundAgent.name;
              agentId = foundAgent._id || foundAgent.id;
              console.log(`✓ Found agent by millis_agent_id: ${agentName}`);
            }
          }
          
          return {
            ...phone,
            phone_type: 'exotel',
            display_number: phone.phone_number,
            display_agent: agentName, // Will be null if no agent linked
            assigned_agent_id: agentId || phone.assigned_agent_id,
            display_status: phone.status,
            display_tags: phone.tags || [],
            display_created: phone.created_at,
            integration_status: phone.integration_status
          };
        })
      ];
      
      setPhones(combinedPhones);
      setTotalPages(phonesResponse.totalPages || 1);
      
      // Show success notification if auto-linked
      if (showNotification) {
        const linkedCount = combinedPhones.filter(p => p.display_agent && p.display_agent !== 'Unknown Agent').length;
        if (linkedCount > 0) {
          console.log('Auto-linked phones detected');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTagFilter = (tag) => {
    setTagFilter(tag === tagFilter ? '' : tag);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'inactive':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getAgentName = (agentId) => {
    if (!agentId) return 'Unknown Agent';
    const agent = agents.find(a => (a.id === agentId) || (a._id === agentId));
    return agent ? agent.name : 'Unknown Agent';
  };

  const handleLinkAgentClick = async (phoneId) => {
    setSelectedPhoneId(phoneId);
    setSelectedAgentId('');
    setShowLinkModal(true);
    
    // Refresh agents list to get latest voice agents from Millis
    try {
      const agentsResponse = await api.getVoiceAgents(1, 100);
      const updatedAgents = agentsResponse.data?.items || agentsResponse.items || [];
      setAgents(updatedAgents);
      console.log('Refreshed agents list:', updatedAgents);
    } catch (err) {
      console.error('Error refreshing agents:', err);
    }
  };

  const handleLinkAgent = async () => {
    if (!selectedAgentId || !selectedPhoneId) return;
    
    try {
      setLinking(true);
      const phone = phones.find(p => (p.id === selectedPhoneId) || (p._id === selectedPhoneId));
      
      console.log(`Linking agent ${selectedAgentId} to phone ${phone.display_number}...`);
      
      // Update the phone with the agent
      if (phone.phone_type === 'exotel') {
        // For Exotel phones, use the link-agent endpoint that updates Millis
        console.log(`Using Exotel link-agent endpoint for phone ID: ${phone._id}`);
        await api.linkExotelPhoneAgent(phone._id || phone.id, selectedAgentId);
        console.log('✅ Exotel phone agent linked successfully (Millis updated)');
      } else {
        // For regular phones, use the phone agent assignment endpoint
        console.log(`Using regular setPhoneAgent endpoint for phone: ${phone.display_number}`);
        await api.setPhoneAgent(phone.display_number, selectedAgentId);
        console.log('✅ Regular phone agent linked successfully (Millis updated)');
      }
      
      // Reload phones to show the updated assignment
      await loadPhones();
      setShowLinkModal(false);
      setSelectedPhoneId(null);
      setSelectedAgentId('');
      
      showSuccess('Agent linked successfully! Check Millis dashboard to verify.');
    } catch (err) {
      console.error('❌ Error linking agent:', err);
      showError(`Failed to link agent: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLinking(false);
    }
  };

  const getAllTags = () => {
    const allTags = new Set();
    phones.forEach(phone => {
      if (phone.display_tags && Array.isArray(phone.display_tags)) {
        phone.display_tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags);
  };

  // Exotel form handlers
  const handleExotelFormChange = (field, value) => {
    setExotelForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExotelFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number format
    if (!exotelForm.phone_number.startsWith('+91')) {
      setError('Phone number must start with +91 (e.g., +919876543210)');
      return;
    }
    
    // Additional validation for Indian phone numbers
    if (exotelForm.phone_number.length !== 13) {
      setError('Indian phone number must be 13 digits including +91 (e.g., +919876543210)');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null); // Clear any previous errors
      setSuccessMessage(''); // Clear any previous success messages
      await api.createExotelPhone(exotelForm);
      setSuccessMessage(`Phone number ${exotelForm.phone_number} added successfully!`);
      setShowExotelForm(false);
      setExotelForm({
        provider: 'exotel',
        phone_number: '',
        api_key: '',
        api_token: '',
        account_sid: '',
        subdomain: '',
        app_id: '',
        region: 'us-west',
        country: 'United States (+1)',
        tags: []
      });
      // Reload the combined phone list to show the new Exotel phone
      loadPhones();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      // Handle specific error cases
      if (err.message.includes('already exists')) {
        setError('This phone number is already added to your account. Please use a different number or check your existing phone numbers.');
      } else if (err.message.includes('must start with +91')) {
        setError('Phone number must start with +91 for Indian numbers (e.g., +919876543210)');
      } else if (err.message.includes('13 digits')) {
        setError('Indian phone number must be 13 digits including +91 (e.g., +919876543210)');
      } else {
        setError(err.message || 'Failed to add phone number. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };


  const handleImportExotelPhones = async () => {
    // Refresh the main phone list to show any new Exotel phones
    await loadPhones();
  };

  const getExotelStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredPhones = phones.filter(phone => {
    if (tagFilter && (!phone.display_tags || !phone.display_tags.includes(tagFilter))) {
      return false;
    }
    return true;
  });

  if (loading && phones.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Phone Numbers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View your phone numbers and their assignments. These are managed by administrators.
          </p>
        </div>
        <button
          onClick={async () => {
            showConfirm(
              'Sync all phone-agent assignments to Millis dashboard? This will update any changes made in your custom dashboard to the Millis platform.',
              'Confirm Sync',
              async () => {
                try {
                  // Call the sync endpoint
                  const response = await fetch(`${api.baseURL}/user/voice-agents/sync-to-millis`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  const data = await response.json();
                  console.log('Sync response:', data);
                  showSuccess(`Sync completed! ${data.results?.successful || 0} successful, ${data.results?.failed || 0} failed.`);
                  loadPhones();
                } catch (err) {
                  console.error('Sync error:', err);
                  showError('Failed to sync. Check backend logs for details.');
                }
              }
            );
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync to Millis
        </button>
      </div>

      {/* Admin Notice */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Managed by Administrators
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Phone number assignments and configurations are managed by your administrators. Contact them for any changes.
            </p>
          </div>
        </div>
      </div>

      {/* Exotel Phone Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exotel Phone Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add and manage your Exotel phone numbers for campaign calling.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowExotelForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Exotel Phone
            </button>
            <button
              onClick={handleImportExotelPhones}
              disabled={importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Phone Numbers
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by phone number..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    tagFilter === tag
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {tagFilter && (
                <button
                  onClick={() => setTagFilter('')}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phones Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assigned Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPhones.map((phone) => (
                <tr key={phone.id || phone._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {phone.display_number}
                        </div>
                        {phone.phone_type === 'exotel' && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Exotel Phone
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(() => {
                      // Check if phone has an agent assigned
                      const hasAgent = phone.display_agent && phone.display_agent !== 'Unknown Agent' && phone.display_agent !== 'Exotel Phone';
                      
                      if (hasAgent) {
                        // Show linked agent with edit option
                        return (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{phone.display_agent}</span>
                            <button 
                              onClick={() => handleLinkAgentClick(phone.id || phone._id)}
                              className="ml-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              title="Edit Agent"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        );
                      } else {
                        // Show "Link to Agent" button for unlinked phones
                        return (
                          <button 
                            onClick={() => handleLinkAgentClick(phone.id || phone._id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center font-medium"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Link to Agent
                          </button>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(phone.display_status)}`}>
                        {getStatusIcon(phone.display_status)}
                        <span className="ml-1">{phone.display_status}</span>
                      </span>
                      {phone.phone_type === 'exotel' && phone.integration_status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          phone.integration_status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          phone.integration_status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {phone.integration_status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {phone.display_tags && phone.display_tags.length > 0 ? (
                        phone.display_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No tags</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {convertToIST(phone.display_created)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPhones.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No phone numbers found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || tagFilter ? 'Try adjusting your search or filter criteria.' : 'No phone numbers are currently available.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Success!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Link to Agent Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Link to Agent
                </h3>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={linking}
                >
                  <option value="">Choose an agent...</option>
                  {agents.length > 0 ? (
                    agents.map((agent) => (
                      <option key={agent._id || agent.id} value={agent._id || agent.id}>
                        {agent.name || agent.agent_name || 'Unnamed Agent'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading agents...</option>
                  )}
                </select>
                {agents.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No agents available. Please create a voice agent first in the Voice Agents section.
                  </p>
                )}
                {agents.length > 0 && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ {agents.length} agent(s) available
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  disabled={linking}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLinkAgent}
                  disabled={!selectedAgentId || linking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {linking ? 'Linking...' : 'Link Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exotel Form Modal */}
      {showExotelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Exotel Phone</h3>
                <button
                  onClick={() => setShowExotelForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Show existing Exotel phone numbers */}
              {phones.filter(phone => phone.phone_type === 'exotel').length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Your Existing Exotel Phone Numbers:
                  </h4>
                  <div className="space-y-1">
                    {phones.filter(phone => phone.phone_type === 'exotel').map(phone => (
                      <div key={phone.id || phone._id} className="text-sm text-blue-700 dark:text-blue-300">
                        • {phone.display_number} ({phone.display_status})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleExotelFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Provider
                  </label>
                  <select
                    value={exotelForm.provider}
                    onChange={(e) => handleExotelFormChange('provider', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="exotel">Exotel</option>
                    <option value="twilio">Twilio</option>
                    <option value="vonage">Vonage</option>
                    <option value="plivo">Plivo</option>
                    <option value="telnyx">Telnyx</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <select
                    value={exotelForm.region}
                    onChange={(e) => handleExotelFormChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="us-west">us-west</option>
                    <option value="eu-west">eu-west</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={exotelForm.country}
                    onChange={(e) => handleExotelFormChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="United States (+1)">United States (+1)</option>
                    <option value="India (+91)">India (+91)</option>
                    <option value="United Kingdom (+44)">United Kingdom (+44)</option>
                    <option value="Canada (+1)">Canada (+1)</option>
                    <option value="Australia (+61)">Australia (+61)</option>
                    <option value="Germany (+49)">Germany (+49)</option>
                    <option value="France (+33)">France (+33)</option>
                    <option value="Italy (+39)">Italy (+39)</option>
                    <option value="Spain (+34)">Spain (+34)</option>
                    <option value="Netherlands (+31)">Netherlands (+31)</option>
                    <option value="Belgium (+32)">Belgium (+32)</option>
                    <option value="Switzerland (+41)">Switzerland (+41)</option>
                    <option value="Austria (+43)">Austria (+43)</option>
                    <option value="Sweden (+46)">Sweden (+46)</option>
                    <option value="Norway (+47)">Norway (+47)</option>
                    <option value="Denmark (+45)">Denmark (+45)</option>
                    <option value="Finland (+358)">Finland (+358)</option>
                    <option value="Poland (+48)">Poland (+48)</option>
                    <option value="Brazil (+55)">Brazil (+55)</option>
                    <option value="Mexico (+52)">Mexico (+52)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exotelForm.phone_number}
                    onChange={(e) => handleExotelFormChange('phone_number', e.target.value)}
                    placeholder="+919876543210"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                      exotelForm.phone_number && !exotelForm.phone_number.startsWith('+91')
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {exotelForm.phone_number && !exotelForm.phone_number.startsWith('+91') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Phone number must start with +91 for Indian numbers
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter Indian phone number starting with +91 (e.g., +919876543210)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={exotelForm.api_key}
                    onChange={(e) => handleExotelFormChange('api_key', e.target.value)}
                    placeholder="Provider API Key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Token
                  </label>
                  <input
                    type="text"
                    value={exotelForm.api_token}
                    onChange={(e) => handleExotelFormChange('api_token', e.target.value)}
                    placeholder="API Token"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account SID
                  </label>
                  <input
                    type="text"
                    value={exotelForm.account_sid}
                    onChange={(e) => handleExotelFormChange('account_sid', e.target.value)}
                    placeholder="Account SID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subdomain
                  </label>
                  <input
                    type="text"
                    value={exotelForm.subdomain}
                    onChange={(e) => handleExotelFormChange('subdomain', e.target.value)}
                    placeholder="Subdomain"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={exotelForm.app_id}
                    onChange={(e) => handleExotelFormChange('app_id', e.target.value)}
                    placeholder="App ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowExotelForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Phone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserPhones;

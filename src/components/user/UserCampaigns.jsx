import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { convertToIST, getRelativeTime } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const UserCampaigns = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [campaignInfo, setCampaignInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    target_numbers: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, [currentPage, searchTerm]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.getUserCampaigns(currentPage, pageSize, searchTerm);
      setCampaigns(response.campaigns || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromMillis = async () => {
    try {
      setSyncing(true);
      const response = await api.syncCampaignsFromMillis();
      console.log('Sync response:', response);
      
      if (response.campaignsAdded > 0) {
        showSuccess(`Synced ${response.campaignsAdded} campaigns from Millis!`);
        // Reload campaigns
        await loadCampaigns();
      } else {
        showInfo('All campaigns are up to date. No new campaigns to sync.');
      }
    } catch (err) {
      console.error('Sync error:', err);
      showError('Failed to sync campaigns from Millis. Check backend logs for details.');
    } finally {
      setSyncing(false);
    }
  };

  const loadCampaignDetails = async (campaignId) => {
    if (!campaignId) {
      setError('Campaign ID is required');
      return;
    }
    
    try {
      setDetailLoading(true);
      const [detailResponse, infoResponse] = await Promise.all([
        api.getCampaignDetail(campaignId),
        api.getCampaignInfo(campaignId)
      ]);
      setCampaignDetail(detailResponse);
      setCampaignInfo(infoResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCampaignClick = (campaign) => {
    const campaignId = campaign.id || campaign._id;
    console.log('Campaign clicked:', campaign, 'ID:', campaignId);
    
    // Cache the campaigns data for the detail page
    try {
      localStorage.setItem('campaigns', JSON.stringify(campaigns));
    } catch (e) {
      console.warn('Failed to cache campaigns:', e);
    }
    
    // Navigate to campaign detail page
    if (user?.role === 'admin') {
      navigate(`/admin/campaigns/${campaignId}`);
    } else {
      navigate(`/inbound/campaigns/${campaignId}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      console.log('File selected:', file.name);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      
      let targetNumbers = [];
      
      // Check if file is uploaded
      if (uploadedFile) {
        console.log('Processing CSV file:', uploadedFile.name);
        
        // Read and parse CSV file
        const fileContent = await uploadedFile.text();
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        // Parse CSV (simple format: phone numbers in first column)
        targetNumbers = lines.map(line => {
          const phone = line.split(',')[0].trim();
          return phone ? { phone } : null;
        }).filter(item => item !== null);
        
        console.log(`Parsed ${targetNumbers.length} numbers from CSV`);
      }
      
      // If no file or empty file, use manual textarea input
      if (targetNumbers.length === 0 && createForm.target_numbers) {
        targetNumbers = createForm.target_numbers
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(phone => ({ phone }));
      }

      // Validation
      if (targetNumbers.length === 0) {
        showWarning('Please enter phone numbers manually or upload a CSV file.');
        setCreating(false);
        return;
      }

      const campaignData = {
        name: createForm.name,
        description: createForm.description,
        target_numbers: targetNumbers
      };

      console.log('Creating campaign with data:', campaignData);
      
      await api.createCampaign(campaignData);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        target_numbers: ''
      });
      setUploadedFile(null);
      loadCampaigns(); // Reload campaigns
      showSuccess(`Campaign created successfully with ${targetNumbers.length} phone numbers!`);
    } catch (err) {
      setError(err.message);
      showError(`Error creating campaign: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleFormChange = (field, value) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '✅'; // Green checkmark for active
      case 'paused':
        return '⏸️'; // Pause icon for paused
      case 'completed':
        return '🎉'; // Celebration for completed
      case 'pending_approval':
        return '⏳'; // Hourglass for pending
      case 'draft':
        return '📝'; // Draft document for draft
      default:
        return '⚪'; // Default circle
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'running':
        return '🟢';
      case 'paused':
        return '🟡';
      case 'completed':
        return '🔵';
      case 'pending_approval':
        return '🟠';
      case 'draft':
        return '⚪';
      default:
        return '⚪';
    }
  };

  if (loading && campaigns.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Create and manage your outbound calling campaigns.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleSyncFromMillis}
            disabled={syncing}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm sm:text-base">{syncing ? 'Syncing...' : 'Sync from Millis'}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Campaigns
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by campaign name..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-sm sm:text-base"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Campaigns List - Card Style */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {campaigns.map((campaign) => {
          const callerCount = (() => {
            const count = campaign.target_numbers?.filter(r => r.metadata?.is_caller).length || 0;
            return count || (campaign.assigned_phone_number ? 1 : 0);
          })();
          const recordCount = campaign.target_numbers?.filter(r => !r.metadata?.is_caller).length || 0;
          
          return (
            <div
              key={campaign.id || campaign._id}
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden group cursor-pointer transform hover:-translate-y-1 active:scale-[0.98]"
              onClick={() => handleCampaignClick(campaign)}
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  {/* Left Section - Campaign Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{getStatusEmoji(campaign.status)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCampaignClick(campaign);
                        }}
                        className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate flex-1"
                      >
                        {campaign.name || 'Unnamed Campaign'}
                      </button>
                    </div>
                    {campaign.description && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-7 sm:ml-10 line-clamp-2 break-words">
                        {campaign.description}
                      </p>
                    )}
                  </div>

                  {/* Right Section - Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCampaignClick(campaign);
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-all duration-200 flex items-center justify-center sm:justify-start gap-2 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:shadow-md text-sm sm:text-base flex-shrink-0"
                  >
                    <span>View Details</span>
                    <span className="hidden sm:inline">→</span>
                  </button>
                </div>

                {/* Bottom Section - Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2 sm:gap-4">
                  {/* Caller Count */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-lg sm:text-xl flex-shrink-0">📞</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Caller</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{callerCount}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-lg sm:text-xl flex-shrink-0">{getStatusIcon(campaign.status)}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Status</p>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)} truncate`}>
                        {campaign.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Records */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-lg sm:text-xl flex-shrink-0">📊</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Records</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{recordCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {campaigns.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md p-8 sm:p-12 text-center">
          <div className="text-4xl sm:text-6xl mb-4">📭</div>
          <h3 className="mt-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">No campaigns found</h3>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'No campaigns are currently available. Create your first campaign to get started!'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedCampaign(null)} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Campaign Details
                  </h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {detailLoading ? (
                  <LoadingSpinner />
                ) : campaignDetail && campaignInfo ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        {campaignDetail.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaignDetail.status)} mt-1`}>
                            {getStatusIcon(campaignDetail.status)}
                            <span className="ml-1">{campaignDetail.status}</span>
                          </span>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Created</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">
                            {convertToIST(campaignDetail.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Target Audience</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">
                            {campaignDetail.target_audience || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Call Volume</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">
                            {campaignDetail.call_volume || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    {campaignInfo.metrics && (
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Performance Metrics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600">Total Calls</p>
                            <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                              {campaignInfo.metrics.total_calls || 0}
                            </p>
                          </div>
                          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                            <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                              {campaignInfo.metrics.completed_calls || 0}
                            </p>
                          </div>
                          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
                            <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                              {((campaignInfo.metrics.success_rate || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    {campaignInfo.settings && (
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Campaign Settings</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs sm:text-sm text-gray-600">Max Retries</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">
                              {campaignInfo.settings.max_retries || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs sm:text-sm text-gray-600">Call Timeout</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">
                              {campaignInfo.settings.call_timeout ? `${campaignInfo.settings.call_timeout}s` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Failed to load campaign details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateModal(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Create New Campaign
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCampaign} className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Campaign Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter campaign name"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter campaign description"
                    />
                  </div>

                  {/* Target Numbers */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Target Phone Numbers *
                    </label>
                    <textarea
                      value={createForm.target_numbers}
                      onChange={(e) => handleFormChange('target_numbers', e.target.value)}
                      required={!uploadedFile}
                      rows={6}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter phone numbers, one per line&#10;Example:&#10;+1234567890&#10;+1987654321"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter one phone number per line. Include country code (e.g., +1 for US).
                    </p>
                  </div>

                  {/* File Upload for Bulk Import */}
                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Or Upload CSV File for Bulk Import
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-4 sm:pb-6 px-4">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {uploadedFile ? (
                            <p className="text-xs sm:text-sm text-gray-600 text-center">
                              <span className="font-semibold text-blue-600">{uploadedFile.name}</span>
                            </p>
                          ) : (
                            <>
                              <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-500 text-center">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 text-center">CSV file with phone numbers</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    {uploadedFile && (
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove file
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      CSV format: One phone number per line. Example: +1234567890
                    </p>
                  </div>

                </div>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    {creating ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
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
                Error loading campaigns
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCampaigns;

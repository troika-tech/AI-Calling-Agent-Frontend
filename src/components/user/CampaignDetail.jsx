import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { convertToIST } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';
import SetCallerPhoneModal from './SetCallerPhoneModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const CampaignDetail = ({ campaignId: propCampaignId }) => {
  const { campaignId: paramCampaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useToast();
  
  // Use prop campaignId if available, otherwise fall back to params
  const campaignId = propCampaignId || paramCampaignId;
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCallerPhoneModal, setShowCallerPhoneModal] = useState(false);
  const [callerPhone, setCallerPhone] = useState('');
  const [callerDocuments, setCallerDocuments] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({ completed: 0, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingRecordings, setDownloadingRecordings] = useState(new Set());

  // Performance: Memoize filtered arrays to avoid recalculating on every render
  const nonCallerRecords = useMemo(() => {
    if (!campaign?.target_numbers) return [];
    return campaign.target_numbers.filter(record => !record.metadata?.is_caller);
  }, [campaign?.target_numbers]);

  const callerRecords = useMemo(() => {
    if (!campaign?.target_numbers) return [];
    return campaign.target_numbers.filter(record => record.metadata?.is_caller);
  }, [campaign?.target_numbers]);

  const completedCallsCount = useMemo(() => {
    return nonCallerRecords.filter(r => 
      r.call_status && r.call_status !== 'pending' && r.call_status !== 'idle'
    ).length;
  }, [nonCallerRecords]);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
      loadCallerPhoneData();
    } else {
      // If no campaign ID, show error
      setLoading(false);
      setError('No campaign ID provided');
    }
    
    // Cleanup function
    return () => {
      setLoading(false);
    };
  }, [campaignId]);

  // Poll campaign status when active or running
  useEffect(() => {
    let intervalId;
    
    if (campaign && (campaign.status === 'active' || campaign.status === 'running')) {
      
      const pollCampaignStatus = async () => {
        try {
          // First sync records from Millis to get latest call statuses
          if (campaign.millis_campaign_id) {
            try {
              const syncResponse = await api.syncCampaignRecords(campaignId);
              if (syncResponse.statusUpdates > 0 || syncResponse.newRecordsAdded > 0) {
              }
            } catch (syncErr) {
              console.warn('Sync skipped:', syncErr.message);
            }
          }
          
          // Then fetch updated campaign details (which also syncs caller phone from Millis)
          const updatedCampaign = await api.getCampaignDetail(campaignId);
          
          // Update campaign state
          setCampaign(updatedCampaign);
          
          // Reload caller phone data if it changed
          if (updatedCampaign.assigned_phone_number && updatedCampaign.assigned_phone_number !== callerPhone) {
            await loadCallerPhoneData();
            setCallerPhone(updatedCampaign.assigned_phone_number);
          }
          
          // Calculate progress - optimized version
          if (updatedCampaign.target_numbers) {
            const filtered = updatedCampaign.target_numbers.filter(r => !r.metadata?.is_caller);
            const completed = filtered.filter(r => 
              r.call_status && r.call_status !== 'pending' && r.call_status !== 'idle'
            ).length;
            
            setCampaignProgress({
              completed,
              total: filtered.length
            });
            
          }
          
          // If campaign completed, stop polling
          if (updatedCampaign.status === 'completed' || updatedCampaign.status === 'paused') {
            if (intervalId) clearInterval(intervalId);
          }
        } catch (err) {
          console.warn('Failed to poll campaign status:', err.message);
        }
      };
      
      // Performance: Poll every 10 seconds (reduced from 5s to reduce server load)
      intervalId = setInterval(pollCampaignStatus, 10000);
      
      // Initial poll
      pollCampaignStatus();
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [campaign?.status, campaign?.millis_campaign_id, campaignId]);

  const loadCallerPhoneData = async () => {
    try {
      const response = await api.getCampaignCallerPhone(campaignId);
      
      if (response.success && response.caller_phone) {
        setCallerPhone(response.caller_phone.caller_number);
        
        // Load knowledge base documents associated with this caller phone
        if (response.caller_phone.knowledge_base && response.caller_phone.knowledge_base.documents) {
          const documentIds = response.caller_phone.knowledge_base.documents.map(doc => doc.document_id || doc._id || doc);
          setCallerDocuments(documentIds);
        }
        
        // Update campaign with caller phone data
        setCampaign(prev => ({
          ...prev,
          assigned_phone_number: response.caller_phone.caller_number
        }));
      } else {
      }
    } catch (err) {
      console.warn('Failed to load caller phone data:', err);
    }
  };

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to get campaign from localStorage (if available from navigation)
      const cachedCampaigns = localStorage.getItem('campaigns');
      if (cachedCampaigns) {
        try {
          const campaigns = JSON.parse(cachedCampaigns);
          const cachedCampaign = campaigns.find(c => (c.id || c._id) === campaignId);
          if (cachedCampaign) {
            setCampaign(cachedCampaign);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to parse cached campaigns:', e);
        }
      }
      
      // If no cached data, create a basic campaign object immediately
      const basicCampaign = {
        _id: campaignId,
        id: campaignId,
        name: `Campaign ${campaignId.slice(-6)}`, // Show last 6 chars of ID
        status: 'idle',
        description: 'Campaign details',
        created_at: new Date().toISOString(),
        stats: { total_numbers: 0 }
      };
      
      setCampaign(basicCampaign);
      setLoading(false);
      
      // Try to load more details in the background (non-blocking)
      try {
        const detailResponse = await api.getCampaignDetail(campaignId);
        setCampaign(detailResponse);
        
        // Auto-sync records from Millis if campaign has millis_campaign_id
        if (detailResponse.millis_campaign_id) {
          try {
            const syncResponse = await api.syncCampaignRecords(campaignId);
            
            // Reload campaign data if any updates (new records OR status updates)
            if (syncResponse.newRecordsAdded > 0 || syncResponse.statusUpdates > 0) {
              const updatedCampaign = await api.getCampaignDetail(campaignId);
              setCampaign(updatedCampaign);
            }
          } catch (syncError) {
            console.warn('Auto-sync from Millis skipped:', syncError.message);
            // Don't show error to user - auto-sync is optional
          }
        }
      } catch (err) {
        console.warn('Failed to load additional campaign details:', err);
        // Keep the basic campaign data
      }
      
    } catch (err) {
      console.error('Error loading campaign data:', err);
      
      // Create a fallback campaign object with basic info
      const fallbackCampaign = {
        _id: campaignId,
        id: campaignId,
        name: 'Campaign Details',
        status: 'idle',
        description: 'Campaign details could not be loaded',
        created_at: new Date().toISOString(),
        stats: { total_numbers: 0 }
      };
      
      setCampaign(fallbackCampaign);
      setError('Unable to load full campaign details, showing basic information');
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin/campaigns');
    } else {
      navigate('/inbound/campaigns');
    }
  };

  const handleSetCallerPhone = () => {
    setShowCallerPhoneModal(true);
  };

  const handleCallerPhoneSelect = async (phoneNumber, phoneData = {}, selectedDocuments = []) => {
    try {
      // Update the campaign's caller phone with complete phone data and documents
      const response = await api.setCampaignCallerPhone(campaignId, phoneNumber, phoneData, selectedDocuments);
      
      // Update local state immediately
      setCallerPhone(phoneNumber);
      setCallerDocuments(selectedDocuments);
      
      // Reload caller phone data to get the updated knowledge base documents
      await loadCallerPhoneData();
      
      // Sync campaign status from Millis after setting caller phone
      // This ensures the status is correctly synced (e.g., should be 'draft' or 'idle', not 'active')
      if (campaign?.millis_campaign_id) {
        try {
          await api.syncCampaignRecords(campaignId);
        } catch (syncErr) {
          console.warn('Failed to sync campaign status from Millis after setting caller phone:', syncErr.message);
          // Continue even if sync fails
        }
      }
      
      // Update campaign object with the response data (including synced status from Millis)
      if (response.success && response.campaign) {
        setCampaign(prev => ({
          ...prev,
          assigned_phone_number: response.campaign.assigned_phone_number,
          target_numbers: response.campaign.target_numbers || prev.target_numbers,
          status: response.campaign.status || prev.status // Use synced status from backend
        }));
      } else {
        setCampaign(prev => ({
          ...prev,
          assigned_phone_number: phoneNumber
        }));
      }
      
      // Reload full campaign data to get the correct status from Millis (after a short delay to allow sync)
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for sync
        const updatedCampaign = await api.getCampaignDetail(campaignId);
        setCampaign(updatedCampaign);
      } catch (reloadErr) {
        console.warn('Failed to reload campaign after setting caller phone:', reloadErr.message);
        // Already updated from response above, so continue
      }
      
      // Show success message
      showSuccess(`Caller phone set successfully: ${phoneNumber}`);
      
      // Close the modal
      setShowCallerPhoneModal(false);
    } catch (err) {
      console.error('Error setting caller phone:', err);
      showError(`Error setting caller phone: ${err.message || 'Please try again.'}`);
    }
  };

  const handleDownloadRecording = async (recordingUrl, phone) => {
    // Create a unique key for this download
    const downloadKey = `${phone}-${recordingUrl}`;
    
    // Check if already downloading
    if (downloadingRecordings.has(downloadKey)) {
      return;
    }
    
    try {
      // Add to downloading set
      setDownloadingRecordings(prev => new Set(prev).add(downloadKey));
      
      // Fetch the recording as a blob
      const response = await fetch(recordingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg, audio/mp3, audio/wav, audio/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download recording: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${phone.replace(/[^0-9]/g, '')}_${new Date().getTime()}.mp3`;
      document.body.appendChild(a);
      
      // Trigger download
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading recording:', error);
      showError(`Failed to download recording: ${error.message}`);
    } finally {
      // Remove from downloading set
      setDownloadingRecordings(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadKey);
        return newSet;
      });
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      
      // Sync records from Millis with cache-busting (this also syncs caller phone)
      const syncResponse = await api.syncCampaignRecords(campaignId);
      
      // Add a small delay to ensure backend processing is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload campaign data (which also syncs caller phone from Millis)
      const updatedCampaign = await api.getCampaignDetail(campaignId);
      setCampaign(updatedCampaign);
      
      // Reload caller phone data to reflect any changes from Millis
      await loadCallerPhoneData();
      
      // Show result
      let hasUpdates = false;
      const updates = [];
      
      if (syncResponse.recordingUpdates > 0) {
        updates.push(`${syncResponse.recordingUpdates} recording URL(s)`);
        hasUpdates = true;
      }
      if (syncResponse.statusUpdates > 0) {
        updates.push(`${syncResponse.statusUpdates} call status(es)`);
        hasUpdates = true;
      }
      if (syncResponse.newRecordsAdded > 0) {
        updates.push(`${syncResponse.newRecordsAdded} new record(s)`);
        hasUpdates = true;
      }
      
      // Check if caller phone was synced (from sync response or campaign data)
      const callerPhoneFromSync = syncResponse.assigned_phone_number || syncResponse.callerPhoneSynced ? updatedCampaign.assigned_phone_number : null;
      const callerPhoneFromCampaign = updatedCampaign.assigned_phone_number;
      const newCallerPhone = callerPhoneFromCampaign || callerPhoneFromSync;
      
      if (newCallerPhone && newCallerPhone !== callerPhone) {
        updates.push('caller phone synced');
        hasUpdates = true;
        // Update local caller phone state
        setCallerPhone(newCallerPhone);
      } else if (syncResponse.callerPhoneSynced) {
        updates.push('caller phone synced');
        hasUpdates = true;
      }
      
      if (hasUpdates) {
        showSuccess('✅ Refreshed! Updated ' + updates.join(', ') + '.');
      } else {
        showInfo(syncResponse.message || 'Status is already up to date.');
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
      showError(`Error refreshing status: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartCampaign = async () => {
    // If campaign is completed, don't allow restart
    if (campaign?.status === 'completed') {
      showWarning('This campaign has been completed. Please create a new campaign to continue.');
      return;
    }
    
    // If campaign is already running, stop it
    if (campaign?.status === 'active' || campaign?.status === 'running') {
      try {
        setIsStarting(true);
        
        // Call pause/stop campaign API
        const response = await api.pauseOutboundCampaign(campaignId);
        
        if (response) {
          setCampaign(prev => ({ ...prev, status: 'paused' }));
          localStorage.removeItem('campaigns');
          showSuccess('Campaign stopped successfully!');
        }
      } catch (err) {
        console.error('Error stopping campaign:', err);
        showError(err.message || 'Failed to stop campaign. Please try again.');
      } finally {
        setIsStarting(false);
      }
      return;
    }

    // If campaign is not running, start it
    // Validate that caller phone is set
    if (!callerPhone && !campaign?.assigned_phone_number) {
      showWarning('Please set a caller phone before starting the campaign');
      return;
    }

    // Validate that there are target numbers - use memoized value
    if (!nonCallerRecords || nonCallerRecords.length === 0) {
      showWarning('Please add campaign records before starting the campaign');
      return;
    }

    try {
      setIsStarting(true);
      
      // Call the launch campaign API
      const response = await api.launchOutboundCampaign(campaignId);
      
      if (response) {
        // Update the campaign state with the response directly
        setCampaign(response);
        // Clear cached data to force fresh fetch
        localStorage.removeItem('campaigns');
        showSuccess('Campaign started successfully! Calls will be made to all campaign records.');
      }
    } catch (err) {
      console.error('Error starting campaign:', err);
      showError(err.message || 'Failed to start campaign. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !campaign) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading campaign
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleBackClick}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Campaign not found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">The requested campaign could not be found.</p>
        <button
          onClick={handleBackClick}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Partial data loaded
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <button
            onClick={handleBackClick}
            className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Campaigns - List</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
            + Import
          </button>
          <button className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
            + Add Record
          </button>
          {campaign?.millis_campaign_id && (
            <button 
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              title="Refresh call statuses from Millis"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
              <span className="sm:hidden">{isRefreshing ? '...' : 'Refresh'}</span>
            </button>
          )}
          <button 
            onClick={handleStartCampaign}
            disabled={isStarting || campaign?.status === 'completed'}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm text-white rounded-lg transition-colors duration-200 ${
              isStarting || campaign?.status === 'completed'
                ? 'bg-gray-400 cursor-not-allowed'
                : campaign?.status === 'active' || campaign?.status === 'running'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title={
              campaign?.status === 'completed'
                ? 'Campaign has been completed'
                : campaign?.status === 'active' || campaign?.status === 'running'
                ? 'Stop the running campaign'
                : !callerPhone && !campaign?.assigned_phone_number
                ? 'Please set caller phone first'
                : 'Start the campaign'
            }
          >
            {isStarting 
              ? 'Processing...' 
              : campaign?.status === 'active' || campaign?.status === 'running'
                ? 'Stop' 
                : '+ Start'}
          </button>
        </div>
      </div>

      {/* Campaign Title */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
          Campaign: {campaign.name}
        </h1>
      </div>

      {/* Campaign Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Status */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">STATUS</h3>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              campaign.status === 'active' || campaign.status === 'running'
                ? 'bg-green-100 text-green-800'
                : campaign.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : campaign.status === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status || 'idle'}
            </span>
          </div>
        </div>

        {/* Records Count */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">CAMPAIGN RECORDS</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {nonCallerRecords.length}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
            Target contacts
          </p>
        </div>
      </div>

      {/* Caller Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">CALLER</h3>
          <button
            onClick={handleSetCallerPhone}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base"
          >
            {callerPhone || campaign?.assigned_phone_number ? 'Change Caller Phone' : 'Set Caller Phone'}
          </button>
        </div>
        
        {/* Desktop Table View (screens >= 412px) */}
        <div className="hidden min-[412px]:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Knowledge Base
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {callerPhone || campaign?.assigned_phone_number ? (
                <tr className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {callerPhone || campaign?.assigned_phone_number}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Caller Phone
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {callerDocuments && callerDocuments.length > 0 ? (
                        callerDocuments.map((docId) => (
                          <span
                            key={docId}
                            className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            KB Doc
                          </span>
                        ))
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-500">No documents</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Caller Phone
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="3" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900">No caller phone set</h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        Set a caller phone to start making calls.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (screens < 412px) */}
        <div className="min-[412px]:hidden">
          {callerPhone || campaign?.assigned_phone_number ? (
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate mb-1">
                    {callerPhone || campaign?.assigned_phone_number}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Caller Phone</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {callerDocuments && callerDocuments.length > 0 ? (
                      callerDocuments.map((docId) => (
                        <span
                          key={docId}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          KB Doc
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No documents</span>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Caller Phone
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-gray-200 rounded-lg">
              <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No caller phone set</h3>
              <p className="mt-1 text-xs text-gray-500">
                Set a caller phone to start making calls.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Include extra metadata in agent prompt
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              This will include additional context in the AI agent's prompts
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <button className="text-xs sm:text-sm text-blue-600 hover:underline">
              Learn more
            </button>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                defaultChecked={true}
              />
              <div className="w-10 h-5 sm:w-12 sm:h-6 bg-green-500 rounded-full shadow-inner"></div>
              <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out translate-x-5 sm:translate-x-6"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Campaign Records</h3>
        </div>
        
        {/* Desktop Table View (screens >= 412px) */}
        <div className="hidden min-[412px]:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Status
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Recording
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nonCallerRecords.length > 0 ? (
                nonCallerRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {record.phone}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {record.name || 'Contact'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {(() => {
                          const status = record.call_status || 'pending';
                          const statusColors = {
                            'pending': 'bg-gray-100 text-gray-800',
                            'ringing': 'bg-blue-100 text-blue-800',
                            'answered': 'bg-green-100 text-green-800',
                            'completed': 'bg-green-100 text-green-800',
                            'no-answer': 'bg-yellow-100 text-yellow-800',
                            'busy': 'bg-red-100 text-red-800',
                            'failed': 'bg-red-100 text-red-800',
                            'voicemail': 'bg-purple-100 text-purple-800'
                          };
                          
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors['pending']}`}>
                              {status === 'pending' && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              )}
                              {(status === 'answered' || status === 'completed') && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {status === 'ringing' && (
                                <svg className="w-3 h-3 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                              )}
                              {(status === 'failed' || status === 'busy' || status === 'no-answer') && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                              {(status || 'pending').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {record.call_recording_url ? (
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <audio 
                            controls 
                            preload="none"
                            crossOrigin="anonymous"
                            className="h-6 sm:h-8 w-32 sm:w-48"
                            style={{ maxWidth: '200px' }}
                            onError={(e) => {
                              console.error('Audio playback error:', e);
                              console.error('Recording URL:', record.call_recording_url);
                              console.error('Audio error details:', {
                                error: e.target.error,
                                code: e.target.error?.code,
                                message: e.target.error?.message,
                                networkState: e.target.networkState,
                                readyState: e.target.readyState
                              });
                              
                              // Show user-friendly error
                              if (e.target.error) {
                                const errorMsg = e.target.error.code === e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED
                                  ? 'Recording format not supported'
                                  : e.target.error.code === e.target.error.MEDIA_ERR_NETWORK
                                  ? 'Network error loading recording'
                                  : 'Failed to load recording';
                                console.error('Error:', errorMsg);
                              }
                            }}
                            onLoadStart={() => {}}
                            onLoadedMetadata={() => {}}
                            onLoadedData={() => {}}
                            onCanPlay={() => {}}
                            onProgress={() => {}}
                          >
                            <source src={record.call_recording_url} type="audio/mpeg" />
                            <source src={record.call_recording_url} type="audio/wav" />
                            <source src={record.call_recording_url} type="audio/mp3" />
                            Your browser does not support the audio element.
                          </audio>
                          <button
                            onClick={() => handleDownloadRecording(record.call_recording_url, record.phone)}
                            disabled={downloadingRecordings.has(`${record.phone}-${record.call_recording_url}`)}
                            className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${
                              downloadingRecordings.has(`${record.phone}-${record.call_recording_url}`) ? 'animate-pulse' : ''
                            }`}
                            title={downloadingRecordings.has(`${record.phone}-${record.call_recording_url}`) ? 'Downloading...' : 'Download recording'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          {record.call_status === 'pending' || record.call_status === 'not_started' ? 'Not available' : 'No recording'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No campaign record found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by adding records to this campaign.
                      </p>
                      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                        + Add Record
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (screens < 412px) */}
        <div className="min-[412px]:hidden divide-y divide-gray-200">
          {nonCallerRecords.length > 0 ? (
            nonCallerRecords.map((record, index) => (
              <div key={index} className="p-3 hover:bg-gray-50">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate mb-1">
                      {record.phone}
                    </div>
                    <div className="text-xs text-gray-500 truncate mb-2">
                      {record.name || 'Contact'}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const status = record.call_status || 'pending';
                        const statusColors = {
                          'pending': 'bg-gray-100 text-gray-800',
                          'ringing': 'bg-blue-100 text-blue-800',
                          'answered': 'bg-green-100 text-green-800',
                          'completed': 'bg-green-100 text-green-800',
                          'no-answer': 'bg-yellow-100 text-yellow-800',
                          'busy': 'bg-red-100 text-red-800',
                          'failed': 'bg-red-100 text-red-800',
                          'voicemail': 'bg-purple-100 text-purple-800'
                        };
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors['pending']}`}>
                            {(status || 'pending').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        );
                      })()}
                    </div>
                    {record.call_recording_url ? (
                      <div className="flex items-center gap-2">
                        <audio controls preload="none" className="h-6 w-full max-w-[200px]" style={{ maxWidth: '200px' }}>
                          <source src={record.call_recording_url} type="audio/mpeg" />
                          <source src={record.call_recording_url} type="audio/wav" />
                          <source src={record.call_recording_url} type="audio/mp3" />
                        </audio>
                        <button
                          onClick={() => handleDownloadRecording(record.call_recording_url, record.phone)}
                          disabled={downloadingRecordings.has(`${record.phone}-${record.call_recording_url}`)}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Download recording"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {record.call_status === 'pending' || record.call_status === 'not_started' ? 'Not available' : 'No recording'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaign record found</h3>
              <p className="mt-1 text-xs text-gray-500">
                Get started by adding records to this campaign.
              </p>
              <button className="mt-4 px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                + Add Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Details */}
      {campaign && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Status</h4>
              <p className="text-sm text-gray-900 dark:text-white">
                {campaign.status || 'idle'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Count of Campaign Records</h4>
              <p className="text-sm text-gray-900 dark:text-white">
                {nonCallerRecords.length}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Count of CALLER</h4>
              <p className="text-sm text-gray-900 dark:text-white">
                {callerRecords.length || (campaign.assigned_phone_number ? 1 : 0)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Campaign Name</h4>
              <p className="text-sm text-gray-900 dark:text-white">
                {campaign.name || 'Unnamed Campaign'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Set Caller Phone Modal */}
          <SetCallerPhoneModal
            isOpen={showCallerPhoneModal}
            onClose={() => setShowCallerPhoneModal(false)}
            onSelect={handleCallerPhoneSelect}
            currentPhone={callerPhone || campaign?.assigned_phone_number}
          />
    </div>
  );
};

export default CampaignDetail;

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { convertToIST, formatDuration, formatCurrency, getRelativeTime } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';

const UserCalls = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [callDetail, setCallDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showLive, setShowLive] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    timePeriod: '' // 24hr, 7days, 14days, 28days
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const recordsPerPage = 10;

  useEffect(() => {
    loadInitialData(true); // Reset to page 1 when filters or mode changes
  }, [showLive, filters.timePeriod]);

  // Calculate date range from time period
  const getDateRange = (period) => {
    const now = new Date();
    let startDate = null;
    
    switch(period) {
      case '24hr':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '14days':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '28days':
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        break;
      default:
        // No filter - fetch all calls
        return { start: null, end: null };
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  const [allCallsData, setAllCallsData] = useState([]);

  const loadInitialData = async (resetPage = false) => {
    try {
      setLoading(true);
      if (resetPage) {
        setCurrentPage(1);
      }
      
      if (showLive) {
        // Calculate date range from time period filter
        const dateRange = getDateRange(filters.timePeriod);
        
        // Fetch ALL calls (no date limit if no timePeriod filter)
        const live = await api.getLiveExotelCalls(dateRange.start, dateRange.end);
        const fetchedCalls = live.items || [];
        setAllCallsData(fetchedCalls);
        setTotalCalls(fetchedCalls.length);
      } else {
        // DB logic as before
        try { await api.syncInboundCallsFromExotel(); } catch (e) { /* ignore */ }
        const callsResponse = await api.getUserCallLogs(1000); // Get more for pagination
        const fetchedCalls = callsResponse.items || [];
        setAllCallsData(fetchedCalls);
        setTotalCalls(fetchedCalls.length);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply pagination whenever allCallsData or currentPage changes
  useEffect(() => {
    if (allCallsData.length > 0) {
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = startIndex + recordsPerPage;
      setCalls(allCallsData.slice(startIndex, endIndex));
    } else {
      setCalls([]);
    }
  }, [allCallsData, currentPage]);

  const loadCalls = async (cursor = '') => {
    try {
      setLoading(true);
      const response = await api.getUserCallLogs(
        25,
        filters.from,
        filters.to,
        filters.agentId,
        filters.status,
        cursor,
        filters.direction,
        filters.type
      );

      if (cursor) {
        setCalls(prev => [...prev, ...(response.items || [])]);
      } else {
        setCalls(response.items || []);
      }
      
      setNextCursor(response.next_cursor || '');
      setHasMore(response.has_more || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCallDetail = async (sessionId) => {
    try {
      setDetailLoading(true);
      const response = await api.getCallDetail(sessionId);
      setCallDetail(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };


  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalCalls / recordsPerPage);

  const handleCallClick = (call) => {
    setSelectedCall(call);
    loadCallDetail(call.id || call._id);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await api.exportCallLogsCSV(
        filters.from,
        filters.to,
        filters.agentId,
        filters.status
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'no-answer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'busy': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'voicemail': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading && calls.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
            View and analyze your call history and performance.
          </p>
        </div>
        <div className="flex items-center w-full sm:w-auto">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Time Period Filter Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl shadow-lg border border-blue-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Filter by Time Period</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Select a time range to filter your calls</p>
            </div>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <select
              value={filters.timePeriod}
              onChange={(e) => {
                handleFilterChange('timePeriod', e.target.value);
                loadInitialData(true); // Auto-apply on change
              }}
              className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium bg-white border-2 border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <option value="">All Time</option>
              <option value="24hr">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="14days">Last 14 Days</option>
              <option value="28days">Last 28 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calls Table - Responsive */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop Table View (screens >= 412px) */}
        <div className="hidden min-[412px]:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr key={call.id || call._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                    {convertToIST(call.created_at)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                      call.direction === 'incoming' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {call.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {showLive ? (call.agent_name || 'Unknown Agent') : (call.agent_id || 'Unknown Agent')}
                      </span>
                      <span className="font-mono text-xs text-gray-500 truncate">
                        {showLive ? (call.phone_to || 'Unassigned') : (call.agent_id || 'Unassigned')}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap truncate max-w-[100px] sm:max-w-none">
                    {call.phone_from}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap truncate max-w-[100px] sm:max-w-none">
                    {call.phone_to}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-blue-600 whitespace-nowrap">
                    {showLive && call.recording_url ? (
                      <a href={call.recording_url} target="_blank" rel="noreferrer" className="hover:underline">Play</a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (screens < 412px) */}
        <div className="min-[412px]:hidden divide-y divide-gray-200">
          {calls.map((call) => (
            <div key={call.id || call._id} className="p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      call.direction === 'incoming' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {call.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{convertToIST(call.created_at)}</p>
                </div>
                {showLive && call.recording_url && (
                  <a href={call.recording_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline ml-2">
                    Play
                  </a>
                )}
              </div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Agent:</span>
                  <span className="text-gray-900 font-medium truncate ml-2 max-w-[60%]">
                    {showLive ? (call.agent_name || 'Unknown Agent') : (call.agent_id || 'Unknown Agent')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900 font-mono truncate ml-2 max-w-[60%]">
                    {showLive ? (call.phone_to || 'Unassigned') : (call.agent_id || 'Unassigned')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">From:</span>
                  <span className="text-gray-900 truncate ml-2 max-w-[60%]">
                    {call.phone_from}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To:</span>
                  <span className="text-gray-900 truncate ml-2 max-w-[60%]">
                    {call.phone_to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDuration(call.duration_seconds)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {calls.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No calls found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalCalls > recordsPerPage && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, totalCalls)} of {totalCalls} calls
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="text-xs sm:text-sm text-gray-700 px-2">
                {currentPage}/{totalPages}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Call Detail Drawer */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedCall(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Call Details
                  </h3>
                  <button
                    onClick={() => setSelectedCall(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {detailLoading ? (
                  <LoadingSpinner />
                ) : callDetail ? (
                  <div className="space-y-6">
                    {/* Call Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Call ID</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{callDetail.id || callDetail._id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDuration(callDetail.duration_seconds)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Agent</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {callDetail.agent_id || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(callDetail.status)}`}>
                          {callDetail.status}
                        </span>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    {callDetail.cost_breakdown && callDetail.cost_breakdown.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Cost Breakdown</h4>
                        <div className="space-y-2">
                          {callDetail.cost_breakdown.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(item.amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transcript */}
                    {callDetail.chat && callDetail.chat.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transcript</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {callDetail.chat.map((message, index) => (
                            <div key={index} className={`p-3 rounded-lg ${
                              message.speaker === 'agent' 
                                ? 'bg-blue-50 dark:bg-blue-900 ml-8' 
                                : 'bg-gray-50 dark:bg-gray-700 mr-8'
                            }`}>
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.speaker === 'agent' ? 'Agent' : 'Customer'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {convertToIST(message.timestamp)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {message.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recording */}
                    {callDetail.recording?.available && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recording</h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Audio recording is available for this call.
                          </p>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Play Recording
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Failed to load call details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCalls;

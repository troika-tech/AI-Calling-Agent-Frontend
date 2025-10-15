import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  PhoneCall,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  ArrowRight,
  User,
  X,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Staged filters (UI state - not applied yet)
  const [stagedSearchTerm, setStagedSearchTerm] = useState('');
  const [stagedStatusFilter, setStagedStatusFilter] = useState('all');
  const [stagedAgentFilter, setStagedAgentFilter] = useState('all');
  const [stagedPhoneFilter, setStagedPhoneFilter] = useState('');
  const [stagedMinDuration, setStagedMinDuration] = useState('');
  const [stagedMaxDuration, setStagedMaxDuration] = useState('');
  const [stagedDateFrom, setStagedDateFrom] = useState('');
  const [stagedDateTo, setStagedDateTo] = useState('');

  // Applied filters (actual filters used for API calls)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [callDetail, setCallDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // Memoize agents map to avoid recalculations
  const agentsMapMemo = useMemo(() => {
    const map = {};
    agents.forEach(agent => {
      if (agent.id && agent.name) {
        map[agent.id] = agent.name;
      }
    });
    return map;
  }, [agents]);

  // Validate date range - ensure 'from' is not after 'to' (for STAGED filters)
  const isDateRangeValid = useMemo(() => {
    if (!stagedDateFrom || !stagedDateTo) return true;
    return new Date(stagedDateFrom) <= new Date(stagedDateTo);
  }, [stagedDateFrom, stagedDateTo]);

  // Validate duration range (for STAGED filters)
  const isDurationRangeValid = useMemo(() => {
    if (!stagedMinDuration || !stagedMaxDuration) return true;
    const min = parseInt(stagedMinDuration, 10) || 0;
    const max = parseInt(stagedMaxDuration, 10) || 0;
    return min <= max;
  }, [stagedMinDuration, stagedMaxDuration]);

  // Apply filters function
  const applyFilters = useCallback(() => {
    // Validate before applying
    if (!isDateRangeValid || !isDurationRangeValid) {
      console.warn('⚠️ Cannot apply filters: validation failed');
      return;
    }

    console.log('🔄 Applying filters...');
    setSearchTerm(stagedSearchTerm);
    setStatusFilter(stagedStatusFilter);
    setAgentFilter(stagedAgentFilter);
    setPhoneFilter(stagedPhoneFilter);
    setMinDuration(stagedMinDuration);
    setMaxDuration(stagedMaxDuration);
    setDateFrom(stagedDateFrom);
    setDateTo(stagedDateTo);
    setCurrentPage(1); // Reset to first page when filters change
  }, [stagedSearchTerm, stagedStatusFilter, stagedAgentFilter, stagedPhoneFilter,
      stagedMinDuration, stagedMaxDuration, stagedDateFrom, stagedDateTo,
      isDateRangeValid, isDurationRangeValid]);

  const loadCallLogsData = useCallback(async () => {
    try {
      const filters = {
        page: currentPage,
        pageSize: 50
      };
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (agentFilter !== 'all') filters.agentId = agentFilter;
      if (phoneFilter) filters.phone = phoneFilter;
      if (dateFrom) filters.from = dateFrom;
      if (dateTo) filters.to = dateTo;

      console.log('🔍 Loading call logs with filters:', filters);

      const response = await api.getCallLogs(filters);
      console.log('✅ Received response:', {
        itemCount: response.items?.length || 0,
        total: response.total,
        page: response.page
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to load call logs:', error);
      return { items: [], total: 0, pageSize: 50 };
    }
  }, [currentPage, statusFilter, agentFilter, phoneFilter, dateFrom, dateTo]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [callLogsResponse, agentsResponse] = await Promise.all([
        loadCallLogsData(),
        agents.length === 0 ? loadAgents() : Promise.resolve({ items: agents })
      ]);

      setCallLogs(callLogsResponse.items || []);
      setTotalCalls(callLogsResponse.total || 0);
      setTotalPages(Math.max(1, Math.ceil((callLogsResponse.total || 0) / (callLogsResponse.pageSize || 50))));
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setCallLogs([]);
      setTotalCalls(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [loadCallLogsData, agents.length]);

  const loadAgents = async () => {
    try {
      const response = await api.getAgents(1, 100);
      const agentsList = response.items || [];
      setAgents(agentsList);
      return { items: agentsList };
    } catch (error) {
      console.error('Failed to load agents:', error);
      return { items: [] };
    }
  };

  // Load agents only once on mount
  useEffect(() => {
    if (agents.length === 0) {
      loadAgents();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when APPLIED filters or page changes
  useEffect(() => {
    loadInitialData();
  }, [currentPage, searchTerm, statusFilter, agentFilter, phoneFilter, minDuration, maxDuration, dateFrom, dateTo, loadInitialData]);

  useEffect(() => {
    if (!showTranscriptModal || !selectedCall) {
      return;
    }

    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError('');
        setCallDetail(null);

        const sessionId =
          selectedCall?.callId ||
          selectedCall?.id ||
          selectedCall?.meta?.session_id;

        if (!sessionId) {
          throw new Error('Missing session identifier for this call.');
        }

        const detail = await api.getCallDetail(sessionId);
        if (isMounted) {
          setCallDetail(detail);
        }
      } catch (error) {
        if (isMounted) {
          setDetailError(error?.message || 'Failed to load call details.');
        }
      } finally {
        if (isMounted) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [showTranscriptModal, selectedCall]);

  // Memoize format functions for better performance
  const formatDuration = useCallback((seconds) => {
    if (typeof seconds === 'string' && seconds.includes(':')) {
      return seconds;
    }

    const totalSeconds = Number(seconds);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      return '0:00';
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatStatus = useCallback((status) => {
    if (!status) return 'Unknown';
    return status
      .toString()
      .replace(/[_-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  const formatTimestamp = useCallback((value) => {
    if (!value) return '';
    const date =
      typeof value === 'number' ? new Date(value * 1000) : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Memoize filtered call logs for CLIENT-SIDE filters only (search, duration)
  // Backend filters (status, agent, date, phone) are already applied via API
  const filteredCallLogs = useMemo(() => {
    let filtered = [...callLogs];

    // Search term filter (client-side only)
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((call) => {
        const from = (call.from || '').toString().toLowerCase();
        const to = (call.to || '').toString().toLowerCase();
        const agent = (call.meta?.agentId || call.agentId || '')
          .toString()
          .toLowerCase();
        const agentName = (call.agent?.name || call.meta?.agent_name || agentsMapMemo[call.agentId] || agentsMapMemo[call.meta?.agentId] || '')
          .toString()
          .toLowerCase();
        const id = (call.id || '').toString().toLowerCase();
        const callId = (call.callId || '').toString().toLowerCase();

        return (
          from.includes(term) ||
          to.includes(term) ||
          agent.includes(term) ||
          agentName.includes(term) ||
          id.includes(term) ||
          callId.includes(term)
        );
      });
    }

    // Duration filter (client-side only - backend doesn't support this)
    if (minDuration) {
      const minSecs = parseInt(minDuration, 10) || 0;
      filtered = filtered.filter((call) => (call.durationSec || 0) >= minSecs);
    }

    if (maxDuration) {
      const maxSecs = parseInt(maxDuration, 10) || 0;
      filtered = filtered.filter((call) => (call.durationSec || 0) <= maxSecs);
    }

    return filtered;
  }, [callLogs, searchTerm, minDuration, maxDuration, agentsMapMemo]);

  const handleCallClick = useCallback((call) => {
    setSelectedCall(call);
    setShowTranscriptModal(true);
  }, []);

  const closeTranscriptModal = useCallback(() => {
    setShowTranscriptModal(false);
    setSelectedCall(null);
    setCallDetail(null);
    setDetailError('');
  }, []);

  const clearFilters = useCallback(() => {
    // Clear staged filters
    setStagedSearchTerm('');
    setStagedStatusFilter('all');
    setStagedAgentFilter('all');
    setStagedPhoneFilter('');
    setStagedMinDuration('');
    setStagedMaxDuration('');
    setStagedDateFrom('');
    setStagedDateTo('');

    // Clear applied filters
    setSearchTerm('');
    setStatusFilter('all');
    setAgentFilter('all');
    setPhoneFilter('');
    setMinDuration('');
    setMaxDuration('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm ||
      statusFilter !== 'all' ||
      agentFilter !== 'all' ||
      phoneFilter ||
      minDuration ||
      maxDuration ||
      dateFrom ||
      dateTo
    );
  }, [searchTerm, statusFilter, agentFilter, phoneFilter, minDuration, maxDuration, dateFrom, dateTo]);

  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (agentFilter !== 'all') count++;
    if (phoneFilter) count++;
    if (minDuration) count++;
    if (maxDuration) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [searchTerm, statusFilter, agentFilter, phoneFilter, minDuration, maxDuration, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600">Monitor and analyze call activity</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search calls, phone numbers, or agent names..."
                  value={stagedSearchTerm}
                  onChange={(event) => setStagedSearchTerm(event.target.value)}
                  className="input w-full pl-10"
                />
              </div>
            </div>
            <select
              value={stagedStatusFilter}
              onChange={(event) => setStagedStatusFilter(event.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="in-progress">In Progress</option>
            </select>
            <button
              className="btn btn-secondary btn-md"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
              {getActiveFilterCount > 2 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                  {getActiveFilterCount - 2}
                </span>
              )}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={stagedDateFrom}
                  onChange={(event) => setStagedDateFrom(event.target.value)}
                  className="input w-full pl-10"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={stagedDateTo}
                  onChange={(event) => setStagedDateTo(event.target.value)}
                  className="input w-full pl-10"
                />
              </div>
            </div>
            </div>

            {/* Date Range Validation Error */}
            {!isDateRangeValid && (stagedDateFrom && stagedDateTo) && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>From date cannot be after To date</span>
              </div>
            )}

            {showAdvancedFilters && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Advanced Filters</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      <User className="mr-1 inline h-3.5 w-3.5" />
                      Agent
                    </label>
                    <select
                      value={stagedAgentFilter}
                      onChange={(event) => setStagedAgentFilter(event.target.value)}
                      className="input w-full"
                    >
                      <option value="all">All Agents</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      <Phone className="mr-1 inline h-3.5 w-3.5" />
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by phone..."
                      value={stagedPhoneFilter}
                      onChange={(event) => setStagedPhoneFilter(event.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      Min Duration (seconds)
                    </label>
                    <input
                      type="number"
                      placeholder="Min..."
                      value={stagedMinDuration}
                      onChange={(event) => setStagedMinDuration(event.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      Max Duration (seconds)
                    </label>
                    <input
                      type="number"
                      placeholder="Max..."
                      value={stagedMaxDuration}
                      onChange={(event) => setStagedMaxDuration(event.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                </div>

                {/* Duration Range Validation Error */}
                {!isDurationRangeValid && (stagedMinDuration && stagedMaxDuration) && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Min duration cannot be greater than Max duration</span>
                  </div>
                )}
              </div>
            )}

            {/* Apply Filters Button - Now positioned after advanced filters */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                onClick={applyFilters}
                disabled={!isDateRangeValid || !isDurationRangeValid}
                className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary btn-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Search: {searchTerm}
                  <button
                    onClick={() => {
                      setStagedSearchTerm('');
                      setSearchTerm('');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove search filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Status: {formatStatus(statusFilter)}
                  <button
                    onClick={() => {
                      setStagedStatusFilter('all');
                      setStatusFilter('all');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove status filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {agentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Agent: {agents.find(a => a.id === agentFilter)?.name || agentFilter}
                  <button
                    onClick={() => {
                      setStagedAgentFilter('all');
                      setAgentFilter('all');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove agent filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {phoneFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Phone: {phoneFilter}
                  <button
                    onClick={() => {
                      setStagedPhoneFilter('');
                      setPhoneFilter('');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove phone filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {minDuration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Min: {minDuration}s
                  <button
                    onClick={() => {
                      setStagedMinDuration('');
                      setMinDuration('');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove min duration filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {maxDuration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Max: {maxDuration}s
                  <button
                    onClick={() => {
                      setStagedMaxDuration('');
                      setMaxDuration('');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove max duration filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {dateFrom && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  From: {dateFrom}
                  <button
                    onClick={() => {
                      setStagedDateFrom('');
                      setDateFrom('');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove from date filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {dateTo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  To: {dateTo}
                  <button
                    onClick={() => {
                      setStagedDateTo('');
                      setDateTo('');
                    }}
                    className="rounded-full hover:bg-blue-200"
                    aria-label="Remove to date filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Call Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCallLogs.map((call) => (
                    <tr
                      key={call.id || call.callId}
                      className="cursor-pointer transition hover:bg-gray-50 focus-within:bg-gray-50"
                      onClick={() => handleCallClick(call)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleCallClick(call);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <PhoneCall className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-mono">
                                  {call.from || 'Unknown'}
                                </span>
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-mono">
                                  {call.to || 'Unknown'}
                                </span>
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              ID:{' '}
                              <span className="font-mono">
                                {call.id || call.callId || 'N/A'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDuration(call.durationSec || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                            call.status
                          )}`}
                        >
                          {getStatusIcon(call.status)}
                          <span>{formatStatus(call.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {call.agent?.name ||
                                call.meta?.agent_name ||
                                agentsMapMemo[call.agentId] ||
                                agentsMapMemo[call.meta?.agentId] ||
                                'Unknown Agent'}
                            </span>
                            <span className="font-mono text-xs text-gray-500 uppercase tracking-wide">
                              {call.agent?.id || 
                                call.agentId ||
                                call.meta?.agentId ||
                                'Unassigned'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTimestamp(call.startedAt) ||
                          formatTimestamp(call.createdAt) ||
                          'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!loading && filteredCallLogs.length === 0 && (
        <div className="py-12 text-center">
          <PhoneCall className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No call logs found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ||
            statusFilter !== 'all' ||
            dateFrom ||
            dateTo
              ? 'Try adjusting your search or filter criteria.'
              : 'Call logs will appear here once calls are made.'}
          </p>
        </div>
      )}

      {totalCalls > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredCallLogs.length} of {totalCalls} calls (Page{' '}
            {currentPage} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showTranscriptModal && selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4 py-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Call Transcript
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {formatStatus(selectedCall.status)} •{' '}
                  {formatDuration(selectedCall.durationSec || 0)} •{' '}
                  {formatTimestamp(selectedCall.startedAt) ||
                    formatTimestamp(selectedCall.createdAt) ||
                    'Time unavailable'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTranscriptModal}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close transcript"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
              <div className="grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-500">From:</span>{' '}
                    <span className="font-mono text-gray-900">
                      {selectedCall.from || 'Unknown'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-500">To:</span>{' '}
                    <span className="font-mono text-gray-900">
                      {selectedCall.to || 'Unknown'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Agent:</span>{' '}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {callDetail?.agent?.name ||
                          selectedCall.meta?.agent_name ||
                          agentsMapMemo[selectedCall.agentId] ||
                          agentsMapMemo[selectedCall.meta?.agentId] ||
                          'Unknown Agent'}
                      </span>
                      <span className="font-mono text-xs text-gray-500 uppercase tracking-wide">
                        {callDetail?.agent?.id ||
                          selectedCall.agentId ||
                          selectedCall.meta?.agentId ||
                          'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-500">Duration:</span>{' '}
                    <span className="text-gray-900">
                      {formatDuration(
                        callDetail?.duration_sec ?? selectedCall.durationSec
                      )}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  Transcript
                </h3>

                {detailLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    Fetching transcript...
                  </div>
                ) : detailError ? (
                  <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {detailError}
                  </div>
                ) : callDetail?.chat?.length ? (
                  <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                    {callDetail.chat.map((message, index) => {
                      const rawRole = message.speaker || message.role || '';
                      const normalizedRole =
                        typeof rawRole === 'string'
                          ? rawRole.toLowerCase()
                          : '';
                      const isAgent = ['agent', 'assistant'].includes(
                        normalizedRole
                      );
                      const messageText =
                        message.message ||
                        message.text ||
                        message.content ||
                        '';

                      return (
                        <div
                          key={`${message.timestamp || index}-${index}`}
                          className={`rounded-lg border px-4 py-3 text-sm shadow-sm ${
                            isAgent
                              ? 'ml-10 border-blue-100 bg-blue-50 text-blue-900'
                              : 'mr-10 border-gray-200 bg-gray-50 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <span className="font-semibold">
                              {isAgent ? 'Agent' : 'Customer'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-line leading-relaxed">
                            {messageText || '—'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                    No transcript is available for this call.
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

export default CallLogs;

import React, { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { api } from '../services/api';

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock data for demonstration
  const mockCallLogs = [
    {
      id: 'call_1',
      from: '+14155550100',
      to: '+14155550101',
      startedAt: '2025-01-15T10:00:00Z',
      endedAt: '2025-01-15T10:05:30Z',
      durationSec: 330,
      status: 'completed',
      meta: {
        agentId: 'agent_123',
        campaignId: 'campaign_456'
      }
    },
    {
      id: 'call_2',
      from: '+14155550102',
      to: '+14155550103',
      startedAt: '2025-01-15T09:30:00Z',
      endedAt: '2025-01-15T09:32:15Z',
      durationSec: 135,
      status: 'completed',
      meta: {
        agentId: 'agent_456',
        campaignId: 'campaign_789'
      }
    },
    {
      id: 'call_3',
      from: '+14155550104',
      to: '+14155550105',
      startedAt: '2025-01-15T08:45:00Z',
      endedAt: '2025-01-15T08:45:30Z',
      durationSec: 30,
      status: 'failed',
      meta: {
        agentId: 'agent_123',
        campaignId: 'campaign_456'
      }
    },
    {
      id: 'call_4',
      from: '+14155550106',
      to: '+14155550107',
      startedAt: '2025-01-14T16:20:00Z',
      endedAt: '2025-01-14T16:25:45Z',
      durationSec: 345,
      status: 'completed',
      meta: {
        agentId: 'agent_789',
        campaignId: 'campaign_123'
      }
    }
  ];

  useEffect(() => {
    loadCallLogs();
  }, [currentPage, searchTerm, statusFilter, dateFrom, dateTo]);

  const loadCallLogs = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (dateFrom) filters.from = dateFrom;
      if (dateTo) filters.to = dateTo;
      
      // In a real app, you would call the API here
      // const response = await api.getCallLogs(filters);
      setCallLogs(mockCallLogs);
      setTotalPages(1);
    } catch (error) {
      console.error('Failed to load call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status) => {
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
  };

  const getStatusColor = (status) => {
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
  };

  const filteredCallLogs = callLogs.filter(call => {
    const matchesSearch = call.from.includes(searchTerm) || 
                         call.to.includes(searchTerm) ||
                         call.meta?.agentId?.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600">Monitor and analyze call activity</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search calls, phone numbers, or agent IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="in-progress">In Progress</option>
            </select>
            <button className="btn btn-secondary btn-md">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Call Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCallLogs.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <PhoneCall className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {call.from}
                              </span>
                              <span className="text-gray-400">→</span>
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {call.to}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Campaign: {call.meta?.campaignId || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDuration(call.durationSec)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {getStatusIcon(call.status)}
                          <span className="ml-1 capitalize">{call.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {call.meta?.agentId || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!loading && filteredCallLogs.length === 0 && (
        <div className="text-center py-12">
          <PhoneCall className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No call logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || dateFrom || dateTo
              ? 'Try adjusting your search or filter criteria.'
              : 'Call logs will appear here once calls are made.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {filteredCallLogs.length} of {callLogs.length} calls
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary btn-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallLogs;

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Clock,
  Phone,
  User,
  Activity,
  MoreVertical
} from 'lucide-react';
import { api } from '../services/api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock data for demonstration
  const mockSessions = [
    {
      id: 'session_1',
      userPhone: '+14155550100',
      agentId: 'agent_123',
      startedAt: '2025-01-15T10:00:00Z',
      endedAt: '2025-01-15T10:30:00Z',
      meta: {
        campaignId: 'campaign_456',
        duration: 1800,
        status: 'completed'
      }
    },
    {
      id: 'session_2',
      userPhone: '+14155550101',
      agentId: 'agent_456',
      startedAt: '2025-01-15T09:15:00Z',
      endedAt: '2025-01-15T09:45:30Z',
      meta: {
        campaignId: 'campaign_789',
        duration: 1830,
        status: 'completed'
      }
    },
    {
      id: 'session_3',
      userPhone: '+14155550102',
      agentId: 'agent_123',
      startedAt: '2025-01-15T08:30:00Z',
      endedAt: null,
      meta: {
        campaignId: 'campaign_456',
        duration: 0,
        status: 'active'
      }
    },
    {
      id: 'session_4',
      userPhone: '+14155550103',
      agentId: 'agent_789',
      startedAt: '2025-01-14T16:20:00Z',
      endedAt: '2025-01-14T16:25:00Z',
      meta: {
        campaignId: 'campaign_123',
        duration: 300,
        status: 'terminated'
      }
    }
  ];

  useEffect(() => {
    loadSessions();
  }, [currentPage, searchTerm, phoneFilter, agentFilter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (phoneFilter) filters.phone = phoneFilter;
      if (agentFilter) filters.agentId = agentFilter;
      
      // In a real app, you would call the API here
      // const response = await api.getSessions(filters);
      setSessions(mockSessions);
      setTotalPages(1);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds === 0) return 'Active';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'terminated':
        return <Activity className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.userPhone.includes(searchTerm) || 
                         session.agentId.includes(searchTerm) ||
                         session.meta?.campaignId?.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600">Monitor user sessions and interactions</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Download className="mr-2 h-4 w-4" />
          Export Sessions
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
                  placeholder="Search sessions, phone numbers, or agent IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Filter by phone..."
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Filter by agent..."
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Session {session.id.split('_')[1]}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.meta?.status)}`}>
                      {getStatusIcon(session.meta?.status)}
                      <span className="ml-1 capitalize">{session.meta?.status}</span>
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">User Phone:</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {session.userPhone}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Agent:</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {session.agentId}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Duration:</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDuration(session.meta?.duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Campaign:</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {session.meta?.campaignId || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="btn btn-secondary btn-sm flex-1">
                    <Activity className="mr-1 h-3 w-3" />
                    View Details
                  </button>
                  <button className="btn btn-primary btn-sm flex-1">
                    <Phone className="mr-1 h-3 w-3" />
                    Call Logs
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || phoneFilter || agentFilter
              ? 'Try adjusting your search or filter criteria.'
              : 'Sessions will appear here once users start interacting with agents.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {filteredSessions.length} of {sessions.length} sessions
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

export default Sessions;

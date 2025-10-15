import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmationModal from './ConfirmationModal';

const AgentAssignment = () => {
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agentsResponse, usersResponse] = await Promise.all([
        api.getAgents(),
        api.getUsers(1, 100) // Get more users for assignment
      ]);
      
      // Handle different response structures
      const agentsData = agentsResponse?.items || agentsResponse?.data || agentsResponse || [];
      const usersData = usersResponse?.items || usersResponse?.data || usersResponse || [];
      
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load data';
      
      // If it's a session expired error, suggest refreshing the page
      if (errorMessage.includes('Session expired') || errorMessage.includes('Authentication failed')) {
        setError(`Session expired. Please refresh the page to log in again.`);
      } else {
        setError(`Failed to load data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = (userId, agentId) => {
    const user = users.find(u => u.id === userId);
    const agent = agents.find(a => a.id === agentId);
    
    if (!user || !agent) {
      setError('User or agent not found');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      title: 'Assign Agent',
      message: `Are you sure you want to assign agent "${agent.name || agent.id}" to user "${user.name || user.email}"?\n\nThis will make the agent unavailable for other users.`,
      onConfirm: () => performAssignAgent(userId, agentId),
      type: 'warning'
    });
  };

  const performAssignAgent = async (userId, agentId) => {
    try {
      setAssigning(true);
      setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' });
      await api.assignAgentToUser(userId, agentId);
      await loadData(); // Reload to get updated assignments
    } catch (err) {
      console.error('Assignment error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to assign agent';
      setError(`Assignment failed: ${errorMessage}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignAgent = (userId, agentId) => {
    const user = users.find(u => u.id === userId);
    const agent = agents.find(a => a.id === agentId);
    
    if (!user || !agent) {
      setError('User or agent not found');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      title: 'Unassign Agent',
      message: `Are you sure you want to unassign agent "${agent.name || agent.id}" from user "${user.name || user.email}"?\n\nThis will make the agent available for other users.`,
      onConfirm: () => performUnassignAgent(userId, agentId),
      type: 'warning'
    });
  };

  const performUnassignAgent = async (userId, agentId) => {
    try {
      setUnassigning(agentId);
      setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' });
      await api.unassignAgentFromUser(userId, agentId);
      await loadData(); // Reload to get updated assignments
    } catch (err) {
      setError(err.message);
    } finally {
      setUnassigning(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAgentStatus = (agent) => {
    const assignedUsers = users.filter(user => {
      // Check both assignedAgents array and agents array for backward compatibility
      const hasAgent = (user.assignedAgents && user.assignedAgents.includes(agent.id)) ||
                      (user.agents && user.agents.some(a => a.id === agent.id));
      return hasAgent;
    });
    
    if (assignedUsers.length === 0) {
      return { status: 'available', text: 'Available', color: 'text-green-600' };
    } else if (assignedUsers.length === 1) {
      return { 
        status: 'assigned', 
        text: `Assigned to ${assignedUsers[0].name}`, 
        color: 'text-blue-600' 
      };
    } else {
      return { 
        status: 'multiple', 
        text: `Assigned to ${assignedUsers.length} users`, 
        color: 'text-orange-600' 
      };
    }
  };

  const canAssignAgent = (agent) => {
    const assignedUsers = users.filter(user => 
      (user.assignedAgents && user.assignedAgents.includes(agent.id)) ||
      (user.agents && user.agents.some(a => a.id === agent.id))
    );
    return assignedUsers.length === 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading agents and users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Assignment</h1>
            <p className="mt-2 text-base text-gray-500">
              Manage agent assignments to users. A user can have multiple agents, but an agent can only be assigned to one user.
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Filter className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div className="ml-4 flex-1">
              <h3 className="text-base font-medium text-red-800">Error</h3>
              <div className="mt-2 text-base text-red-700">{error}</div>
              {error.includes('Session expired') && (
                <div className="mt-4 space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Refresh Page
                  </button>
                  <button
                    onClick={() => {
                      // Clear any stored auth data and redirect to login
                      localStorage.clear();
                      window.location.href = '/';
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Login Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Available Agents</h2>
            <p className="mt-2 text-base text-gray-500">
              {agents.length} agents available for assignment
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {agents.map((agent) => {
              const agentStatus = getAgentStatus(agent);
              const isAvailable = canAssignAgent(agent);
              
              return (
                <div key={agent.id} className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-5">
                          <h3 className="text-base font-medium text-gray-900">
                            {agent.name || agent.id}
                          </h3>
                          <p className="text-base text-gray-500">ID: {agent.id}</p>
                          <p className={`text-sm font-medium ${agentStatus.color}`}>
                            {agentStatus.text}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isAvailable ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users List with Assignment */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Users</h2>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-base"
                />
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-base font-medium text-gray-700">
                            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5">
                        <h3 className="text-base font-medium text-gray-900">
                          {user.name || 'Unnamed User'}
                        </h3>
                        <p className="text-base text-gray-500">{user.email}</p>
                        <p className="text-sm text-gray-400">
                          Role: {user.role || 'user'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Assigned Agents */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Assigned Agents:</h4>
                      {((user.assignedAgents && user.assignedAgents.length > 0) || (user.agents && user.agents.length > 0)) ? (
                        <div className="space-y-3">
                          {/* Show assignedAgents array */}
                          {user.assignedAgents && user.assignedAgents.map((agentId) => {
                            const agent = agents.find(a => a.id === agentId);
                            return (
                              <div key={agentId} className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                                <div className="flex items-center">
                                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                                  <span className="text-base text-gray-700">
                                    {agent ? (agent.name || agent.id) : agentId}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleUnassignAgent(user.id, agentId)}
                                  disabled={unassigning === agentId}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
                                >
                                  {unassigning === agentId ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <UserMinus className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                          {/* Show agents array for backward compatibility */}
                          {user.agents && user.agents.map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                              <div className="flex items-center">
                                <Users className="h-5 w-5 text-gray-400 mr-3" />
                                <span className="text-base text-gray-700">
                                  {agent.name || agent.id}
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnassignAgent(user.id, agent.id)}
                                disabled={unassigning === agent.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
                              >
                                {unassigning === agent.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <UserMinus className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No agents assigned</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Assign Agent Dropdown */}
                <div className="mt-4">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignAgent(user.id, e.target.value);
                        e.target.value = ''; // Reset selection
                      }
                    }}
                    disabled={assigning}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base disabled:opacity-50"
                  >
                    <option value="">Assign an agent...</option>
                    {agents
                      .filter(agent => canAssignAgent(agent))
                      .map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name || agent.id} (Available)
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={assigning || !!unassigning}
      />
    </div>
  );
};

export default AgentAssignment;

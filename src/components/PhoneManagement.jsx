import React, { useState, useEffect } from 'react';
import {
  Phone,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Tag,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { api } from '../services/api';

const PhoneManagement = () => {
  const [phones, setPhones] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentsMap, setAgentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [agentId, setAgentId] = useState('');
  const [tags, setTags] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    loadPhones();
  }, [currentPage, searchTerm]);

  const loadAgents = async () => {
    try {
      const response = await api.getAgents();
      const agentsList = response.items || response || [];
      setAgents(agentsList);

      // Create a map of agent ID to agent name
      const map = {};
      agentsList.forEach(agent => {
        map[agent.id] = agent.name || agent.title || 'Unnamed Agent';
      });
      setAgentsMap(map);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadPhones = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getPhones(currentPage, 50, searchTerm);
      setPhones(response.items || []);
      setTotalPages(Math.ceil(response.total / 50));
    } catch (error) {
      console.error('Failed to load phones:', error);
      setError('Failed to load phones. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPhones = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      // Just reload the phones from Millis API
      await loadPhones();

      setSuccess('Phone numbers synced successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to sync phones:', error);
      setError('Failed to sync phones. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSetAgent = async (phone, agentId) => {
    try {
      await api.setPhoneAgent(phone, agentId);
      loadPhones();
    } catch (error) {
      console.error('Failed to set agent:', error);
    }
  };

  const handleUpdateTags = async (phone, tags) => {
    try {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await api.updatePhoneTags(phone, tagList);
      loadPhones();
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const openEditModal = (phone) => {
    setSelectedPhone(phone);
    setAgentId(phone.agent_id || phone.agentId || '');
    setTags(phone.tags?.join(', ') || '');
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (selectedPhone) {
      const phoneNumber = selectedPhone.id || selectedPhone.number;
      const currentAgentId = selectedPhone.agent_id || selectedPhone.agentId;

      if (agentId !== currentAgentId) {
        handleSetAgent(phoneNumber, agentId);
      }
      if (tags !== selectedPhone.tags?.join(', ')) {
        handleUpdateTags(phoneNumber, tags);
      }
    }
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Management</h1>
          <p className="text-gray-600">View and manage phone numbers imported from Millis dashboard</p>
        </div>
        <button
          onClick={handleSyncPhones}
          disabled={syncing}
          className="btn btn-primary btn-md disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Phones'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-sm text-green-800">{success}</span>
            <button
              onClick={() => setSuccess('')}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="card-content pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search phone numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <button className="btn btn-secondary btn-md">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </button>
            <button className="btn btn-secondary btn-md">
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Phones Table */}
      <div className="card shadow-lg">
        <div className="card-content p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading phones...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider first:rounded-tl-lg last:rounded-tr-lg">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider first:rounded-tl-lg last:rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {phones.length > 0 ? (
                    phones.map((phone, index) => (
                      <tr
                        key={phone.id}
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ease-in-out group ${
                          index === phones.length - 1 && phones.length < 8 ? 'last:rounded-b-lg' : ''
                        }`}
                      >
                         <td className={`px-6 py-5 whitespace-nowrap ${
                           index === phones.length - 1 && phones.length < 8 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''
                         }`}>
                           <div>
                             <span className="text-sm font-semibold text-gray-900">
                               {phone.id || phone.number}
                             </span>
                             <div className="text-xs text-gray-500">
                               {phone.status === 'active' ? (
                                 <span className="inline-flex items-center">
                                   <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                                   Active
                                 </span>
                               ) : (
                                 <span className="inline-flex items-center">
                                   <span className="h-2 w-2 rounded-full bg-gray-400 mr-1"></span>
                                   Inactive
                                 </span>
                               )}
                             </div>
                           </div>
                         </td>
                         <td className={`px-6 py-5 whitespace-nowrap ${
                           index === phones.length - 1 && phones.length < 8 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''
                         }`}>
                           {phone.agent_id || phone.agentId ? (
                             <div>
                               <div className="text-sm font-medium text-gray-900">
                                 {agentsMap[phone.agent_id || phone.agentId] || 'Unknown Agent'}
                               </div>
                               <div className="text-xs text-gray-500 font-mono">
                                 {(phone.agent_id || phone.agentId).substring(0, 12)}...
                               </div>
                             </div>
                           ) : (
                             <span className="text-sm text-gray-400 italic">Not assigned</span>
                           )}
                         </td>
                         <td className={`px-6 py-5 whitespace-nowrap ${
                           index === phones.length - 1 && phones.length < 8 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''
                         }`}>
                           <div className="flex flex-wrap gap-2">
                             {phone.tags && phone.tags.length > 0 ? (
                               phone.tags.map((tag, index) => (
                                 <span
                                   key={index}
                                   className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 shadow-sm"
                                 >
                                   {tag}
                                 </span>
                               ))
                             ) : (
                               <span className="text-xs text-gray-400 italic">No tags</span>
                             )}
                           </div>
                         </td>
                         <td className={`px-6 py-5 whitespace-nowrap ${
                           index === phones.length - 1 && phones.length < 8 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''
                         }`}>
                           <div className="text-sm text-gray-900 font-medium">
                             {phone.create_at
                               ? new Date(phone.create_at * 1000).toLocaleDateString('en-US', {
                                   month: 'short',
                                   day: 'numeric',
                                   year: 'numeric'
                                 })
                               : phone.meta?.createdAt
                                 ? new Date(phone.meta.createdAt).toLocaleDateString('en-US', {
                                     month: 'short',
                                     day: 'numeric',
                                     year: 'numeric'
                                   })
                                 : 'N/A'
                             }
                           </div>
                           <div className="text-xs text-gray-500">
                             {phone.create_at
                               ? new Date(phone.create_at * 1000).toLocaleTimeString('en-US', {
                                   hour: '2-digit',
                                   minute: '2-digit'
                                 })
                               : ''}
                           </div>
                         </td>
                         <td className={`px-6 py-5 whitespace-nowrap text-center ${
                           index === phones.length - 1 && phones.length < 8 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''
                         }`}>
                           <div className="flex items-center justify-center space-x-2">
                             <button
                               onClick={() => openEditModal(phone)}
                               className="px-3 py-1 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                               title="Edit"
                             >
                               Edit
                             </button>
                             <button
                               className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                               title="Delete"
                             >
                               Delete
                             </button>
                           </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                       <td colSpan="5" className="px-6 py-16 text-center">
                         <div className="flex flex-col items-center">
                           <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers found</h3>
                           <p className="text-sm text-gray-500 mb-4">
                             {searchTerm
                               ? 'Try adjusting your search criteria'
                               : 'Click "Sync Phones" to load phone numbers from Millis'
                             }
                           </p>
                           <button
                             onClick={handleSyncPhones}
                             className="btn btn-primary btn-sm"
                           >
                             Sync Phones
                           </button>
                         </div>
                       </td>
                    </tr>
                  )}
                  {/* Empty rows to fill the table height */}
                  {Array.from({ length: Math.max(0, 8 - phones.length) }).map((_, index) => (
                    <tr key={`empty-${index}`} className={`h-12 ${index === Math.max(0, 8 - phones.length) - 1 ? 'last:rounded-b-lg' : ''}`}>
                      <td className={`px-6 py-4 ${index === Math.max(0, 8 - phones.length) - 1 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''}`}></td>
                      <td className={`px-6 py-4 ${index === Math.max(0, 8 - phones.length) - 1 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''}`}></td>
                      <td className={`px-6 py-4 ${index === Math.max(0, 8 - phones.length) - 1 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''}`}></td>
                      <td className={`px-6 py-4 ${index === Math.max(0, 8 - phones.length) - 1 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''}`}></td>
                      <td className={`px-6 py-4 ${index === Math.max(0, 8 - phones.length) - 1 ? 'first:rounded-bl-lg last:rounded-br-lg' : ''}`}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
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

      {/* Edit Modal */}
      {showEditModal && selectedPhone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Phone: {selectedPhone.id || selectedPhone.number}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Agent
                </label>
                {agents.length > 0 ? (
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">-- Select Agent --</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name || agent.title || 'Unnamed Agent'} (ID: {agent.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="input w-full"
                    placeholder="Enter agent ID manually"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {agents.length > 0
                    ? 'Select an agent from the list'
                    : 'Loading agents... You can enter ID manually if needed'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input w-full"
                  placeholder="vip, premium, beta"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="btn btn-primary btn-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneManagement;

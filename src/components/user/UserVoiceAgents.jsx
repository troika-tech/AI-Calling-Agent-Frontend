import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const UserVoiceAgents = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    voice_label: '',
    status: 'active',
    llm_model: 'gpt-4o',
    language: 'en-US',
    voice: 'alloy'
  });

  useEffect(() => {
    loadAgents();
  }, [currentPage, searchTerm]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await api.getVoiceAgents(currentPage, pageSize, searchTerm);
      setAgents(response.data?.items || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSyncFromMillis = async () => {
    try {
      setSyncing(true);
      const response = await api.syncVoiceAgentsFromMillis();
      console.log('Sync response:', response);
      
      if (response.agentsAdded > 0) {
        showSuccess(`Synced ${response.agentsAdded} voice agents from Millis!`);
        await loadAgents();
      } else {
        showInfo('All voice agents are up to date. No new agents to sync.');
      }
    } catch (err) {
      console.error('Sync error:', err);
      showError('Failed to sync voice agents from Millis. Check backend logs for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddAgent = () => {
    setShowAddAgentModal(true);
  };

  const handleCloseModal = () => {
    setShowAddAgentModal(false);
    setAgentName('');
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createVoiceAgent({ name: agentName });
      console.log('✅ Voice agent created:', response);
      
      // Close modal and reset form
      handleCloseModal();
      
      // Agent is created successfully
      console.log('✅ Voice agent created successfully');
      
      // Reload agents to show the new one
      loadAgents();
      
      // Show success notification
      showSuccess('Voice agent created successfully! Go to Phone Numbers tab and use "Link to Agent" button to assign it to phones.');
    } catch (err) {
      console.error('Error creating agent:', err);
      showError('Failed to create agent. Please try again.');
    }
  };

  // Backend already handles auto-linking automatically when agent is created
  // No need for frontend auto-linking logic

  const handleAgentClick = async (agent) => {
    setSelectedAgent(agent);
    setEditForm({
      name: agent.name || '',
      voice_label: agent.voice_label || "You're a helpful assistant.",
      status: agent.status || 'active',
      llm_model: 'gpt-4o',
      language: 'en-US',
      voice: 'alloy'
    });
    setShowEditModal(true);
    setActiveTab('general');
    await loadAgentKnowledgeDocs(agent._id || agent.id);
  };

  const loadAgentKnowledgeDocs = async (agentId) => {
    try {
      setLoadingDocs(true);
      // Load knowledge base documents for this agent
      const response = await api.getAgentDocuments(1, 50);
      setKnowledgeDocs(response.docs || response.items || []);
    } catch (err) {
      console.error('Error loading knowledge docs:', err);
      setKnowledgeDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAgent(null);
    setActiveTab('general');
    setKnowledgeDocs([]);
  };

  const handleSaveChanges = async () => {
    if (!selectedAgent) return;
    
    try {
      await api.updateVoiceAgent(selectedAgent._id || selectedAgent.id, editForm);
      handleCloseEditModal();
      loadAgents();
    } catch (err) {
      console.error('Error updating agent:', err);
      showError('Failed to update agent. Please try again.');
    }
  };

  if (loading && agents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voice Agents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage your voice agents.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncFromMillis}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync from Millis'}
          </button>
          <button 
            onClick={handleAddAgent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Agent
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Agents
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by agent name..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      {agents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer">
                  Created
                  <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map((agent) => (
                <tr key={agent._id || agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                                             <div className="ml-4">
                         <div className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-green-600 dark:hover:text-green-400" onClick={() => handleAgentClick(agent)}>
                           {agent.name || agent.agent_name}
                         </div>
                         <div className="text-sm text-gray-500 dark:text-gray-400">
                           {agent.voice_label || agent.subtitle || "You're a helpful assistant."}
                         </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {agent.created_at ? new Date(agent.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {agent.created_at ? new Date(agent.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-900 dark:text-white">Active</span>
                      </div>
                      <button className="ml-4 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State - Matching the image design */}
      {agents.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No agents found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm ? 'Try adjusting your search terms.' : 'No agents are currently available.'}
          </p>
          <button 
            onClick={handleAddAgent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center mx-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Agent
          </button>
        </div>
      )}

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

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading agents
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseModal}
            ></div>

                         {/* Modal */}
             <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
               {/* Header */}
               <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                   Create Agent
                 </h3>
                 <button
                   onClick={handleCloseModal}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* Form */}
               <form onSubmit={handleCreateAgent} className="px-6 py-4">
                 <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Agent name
                   </label>
                   <input
                     type="text"
                     value={agentName}
                     onChange={(e) => setAgentName(e.target.value)}
                     placeholder="Enter agent name"
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     required
                   />
                 </div>

                 {/* Buttons */}
                 <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                   <button
                     type="button"
                     onClick={handleCloseModal}
                     className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                   >
                     Create Agent
                   </button>
                 </div>
               </form>
             </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseEditModal}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Edit Agent
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedAgent.millis_agent_id && `ID: ${selectedAgent.millis_agent_id}`}
                  </p>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === 'general'
                        ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === 'knowledge'
                        ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Knowledge Base
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === 'settings'
                        ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Settings
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    {/* AI Agent Section */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          LLM Model
                        </label>
                        <select
                          value={editForm.llm_model}
                          onChange={(e) => setEditForm({...editForm, llm_model: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                          <option value="gpt-4.1">GPT-4.1</option>
                          <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                          <option value="deepseek-v3">DeepSeek V3</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </label>
                        <select
                          value={editForm.language}
                          onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="en-US">English (US)</option>
                          <option value="en-GB">English (UK)</option>
                          <option value="es-ES">Spanish (Spain)</option>
                          <option value="fr-FR">French</option>
                          <option value="de-DE">German</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Voice
                        </label>
                        <select
                          value={editForm.voice}
                          onChange={(e) => setEditForm({...editForm, voice: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="alloy">Alloy (OpenAI)</option>
                          <option value="echo">Echo (OpenAI)</option>
                          <option value="fable">Fable (OpenAI)</option>
                          <option value="onyx">Onyx (OpenAI)</option>
                          <option value="nova">Nova (OpenAI)</option>
                          <option value="shimmer">Shimmer (OpenAI)</option>
                        </select>
                      </div>
                    </div>

                    {/* Agent Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Agent Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Voice Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Voice Label (Agent Prompt)
                      </label>
                      <textarea
                        value={editForm.voice_label}
                        onChange={(e) => setEditForm({...editForm, voice_label: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="You're a helpful assistant..."
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'knowledge' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Knowledge Base Documents
                      </h4>
                      <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        + Add Document
                      </button>
                    </div>
                    
                    {loadingDocs ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading documents...</p>
                      </div>
                    ) : knowledgeDocs.length > 0 ? (
                      <div className="space-y-3">
                        {knowledgeDocs.map((doc) => (
                          <div key={doc._id || doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {doc.original_name || doc.filename}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {doc.file_type?.toUpperCase()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No knowledge base documents found.</p>
                        <button className="mt-4 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                          + Add Document
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Agent settings and advanced configuration options will be available here.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVoiceAgents;

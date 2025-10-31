import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { convertToIST } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';
import UploadDocumentModal from './UploadDocumentModal';
import DocumentCard from './DocumentCard';
import { useToast } from '../../contexts/ToastContext';

const UserAgents = () => {
  const { showConfirm, showError, showSuccess } = useToast();
  const { campaignId: urlCampaignId } = useParams();
  const location = useLocation();
  const [agents, setAgents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  useEffect(() => {
    loadAgents();
    loadDocuments();
  }, [currentPage, searchTerm]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await api.getUserAgents(currentPage, pageSize, searchTerm);
      setAgents(response.items || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.getAgentDocuments(1, 50); // Load recent documents
      setDocuments(response.docs || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      // Don't set error state for documents, just log it
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTestCall = (agentId) => {
    // Test call functionality is not available for user role
    // This would require admin permissions to implement
    console.log(`Test call requested for agent ${agentId} - requires admin permissions`);
  };

  const handleAddAgent = () => {
    // Try to get campaign ID from multiple sources
    let campaignId = urlCampaignId;
    
    // If not in URL params, try to extract from current URL path
    if (!campaignId && location.pathname.includes('/campaigns/')) {
      const pathParts = location.pathname.split('/campaigns/');
      if (pathParts.length > 1) {
        campaignId = pathParts[1].split('/')[0];
      }
    }
    
    // If still no campaign ID, try to get from browser history or referrer
    if (!campaignId) {
      // Check if we can get it from the referrer URL
      const referrer = document.referrer;
      if (referrer && referrer.includes('/campaigns/')) {
        const referrerParts = referrer.split('/campaigns/');
        if (referrerParts.length > 1) {
          campaignId = referrerParts[1].split('/')[0];
        }
      }
    }
    
    // Fallback to default if still no campaign ID found
    if (!campaignId) {
      campaignId = 'default-campaign-id';
    }
    
    console.log('Using campaign ID for upload:', campaignId, 'from URL:', location.pathname, 'referrer:', document.referrer);
    setSelectedCampaignId(campaignId);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = (response) => {
    console.log('Document uploaded successfully:', response);
    // Reload documents to show the new upload
    loadDocuments();
    setShowUploadModal(false);
    setSelectedCampaignId(null);
  };

  const handleDeleteDocument = async (documentId) => {
    showConfirm(
      'Are you sure you want to delete this document?',
      'Confirm Delete',
      async () => {
        try {
          await api.deleteAgentDocument(documentId);
          // Reload documents to remove the deleted one
          loadDocuments();
          showSuccess('Document deleted successfully');
        } catch (err) {
          console.error('Error deleting document:', err);
          showError('Failed to delete document. Please try again.');
        }
      }
    );
  };

  if (loading && agents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View available voice agents. These are managed by administrators.
          </p>
        </div>
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
              Agent configurations and settings are managed by your administrators. Contact them for any changes.
            </p>
          </div>
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

      {/* Agents Grid */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {agent.name}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Voice Label</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.voice_label}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Language</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.language}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {convertToIST(agent.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Available
                  </span>
                  <button
                    onClick={() => handleTestCall(agent.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Test Call
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Knowledge Base Documents Section */}
      {documents.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base Documents</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Uploaded documents for AI agents ({documents.length} documents)
              </p>
            </div>
          </div>
          
          {documentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((document) => (
                <DocumentCard
                  key={document._id}
                  document={document}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
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

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadSuccess}
        campaignId={selectedCampaignId}
      />
    </div>
  );
};

export default UserAgents;

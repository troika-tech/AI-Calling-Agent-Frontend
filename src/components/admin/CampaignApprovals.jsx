import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download, 
  Calendar,
  Phone,
  FileText,
  Users,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CampaignApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [phones, setPhones] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    agent_id: '',
    kb_id: '',
    phone_number: '',
    admin_notes: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingCampaigns();
    fetchPhones();
  }, [currentPage]);

  const fetchPendingCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getPendingCampaigns();
      setCampaigns(response.items || []);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (err) {
      setError(err.message || 'Failed to fetch pending campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhones = async () => {
    try {
      const response = await api.getPhones(1, 100);
      setPhones(response.items || []);
    } catch (err) {
      console.error('Failed to fetch phones:', err);
    }
  };

  const handleViewDetails = async (campaignId) => {
    try {
      const campaign = await api.getCampaignDetails(campaignId);
      setSelectedCampaign(campaign);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch campaign details');
    }
  };

  const handleApprove = async () => {
    if (!selectedCampaign || !approvalData.agent_id || !approvalData.phone_number) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      await api.approveCampaign(selectedCampaign.id, approvalData);
      setSuccess('Campaign approved successfully');
      setShowDetailsModal(false);
      setApprovalData({ agent_id: '', kb_id: '', phone_number: '', admin_notes: '' });
      fetchPendingCampaigns();
    } catch (err) {
      setError(err.message || 'Failed to approve campaign');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setError('');
      await api.rejectCampaign(selectedCampaign.id, rejectReason);
      setSuccess('Campaign rejected successfully');
      setShowRejectModal(false);
      setRejectReason('');
      setShowDetailsModal(false);
      fetchPendingCampaigns();
    } catch (err) {
      setError(err.message || 'Failed to reject campaign');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && campaigns.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Campaign Approvals</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve pending campaigns</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {success}
          <button
            onClick={() => setSuccess('')}
            className="ml-2 text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Pending Campaigns Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Target Numbers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  KB Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.name || 'Unnamed Campaign'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {campaign.description || 'No description'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {campaign.user?.email || 'No email'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {campaign.user?.role} • {campaign.user?.subscription?.plan}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {campaign.target_numbers?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {campaign.kb_files?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(campaign.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(campaign.id)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Details Modal */}
      {showDetailsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Campaign Review - {selectedCampaign.name}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedCampaign.user?.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedCampaign.user?.email}</div>
                    <div><span className="font-medium">Role:</span> {selectedCampaign.user?.role}</div>
                    <div><span className="font-medium">Plan:</span> {selectedCampaign.user?.subscription?.plan}</div>
                    <div><span className="font-medium">Remaining Minutes:</span> {selectedCampaign.user?.subscription?.call_minutes_allocated - selectedCampaign.user?.subscription?.call_minutes_used || 0}</div>
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Campaign Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedCampaign.name}</div>
                    <div><span className="font-medium">Description:</span> {selectedCampaign.description || 'None'}</div>
                    <div><span className="font-medium">Target Numbers:</span> {selectedCampaign.target_numbers?.length || 0}</div>
                    <div><span className="font-medium">KB Files:</span> {selectedCampaign.kb_files?.length || 0}</div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedCampaign.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Target Numbers Preview */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Target Numbers Preview</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {selectedCampaign.target_numbers?.slice(0, 10).map((number, index) => (
                      <div key={index} className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {number.phone}
                        {number.name && <span className="text-gray-500 ml-2">({number.name})</span>}
                      </div>
                    ))}
                    {selectedCampaign.target_numbers?.length > 10 && (
                      <div className="text-gray-500 text-sm">
                        ... and {selectedCampaign.target_numbers.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KB Documents */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Knowledge Base Documents</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-2">
                    {selectedCampaign.kb_files?.map((file, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{file.filename}</span>
                          <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(!selectedCampaign.kb_files || selectedCampaign.kb_files.length === 0) && (
                      <div className="text-gray-500 text-sm">No documents uploaded</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              {selectedCampaign.schedule && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Schedule Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Start Date:</span> {formatDate(selectedCampaign.schedule.start_date)}</div>
                      <div><span className="font-medium">End Date:</span> {formatDate(selectedCampaign.schedule.end_date)}</div>
                      <div><span className="font-medium">Calls Per Hour:</span> {selectedCampaign.schedule.calls_per_hour}</div>
                      <div><span className="font-medium">Timezone:</span> {selectedCampaign.schedule.timezone}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Form */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Approval Form</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Agent ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={approvalData.agent_id}
                      onChange={(e) => setApprovalData({ ...approvalData, agent_id: e.target.value })}
                      placeholder="Copy from Millis Dashboard"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      KB ID
                    </label>
                    <input
                      type="text"
                      value={approvalData.kb_id}
                      onChange={(e) => setApprovalData({ ...approvalData, kb_id: e.target.value })}
                      placeholder="Create KB on Millis first"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={approvalData.phone_number}
                      onChange={(e) => setApprovalData({ ...approvalData, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a phone number</option>
                      {phones.map((phone) => (
                        <option key={phone.phone} value={phone.phone}>
                          {phone.phone} {phone.tags?.length > 0 && `(${phone.tags.join(', ')})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={approvalData.admin_notes}
                      onChange={(e) => setApprovalData({ ...approvalData, admin_notes: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setApprovalData({ agent_id: '', kb_id: '', phone_number: '', admin_notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reject Campaign</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Reject Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignApprovals;

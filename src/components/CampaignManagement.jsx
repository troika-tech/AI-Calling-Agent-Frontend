import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  MoreVertical
} from 'lucide-react';
import { api } from '../services/api';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [approvalReason, setApprovalReason] = useState('');

  // Mock data for demonstration
  const mockCampaigns = [
    {
      id: 'campaign_1',
      name: 'Holiday Sale Campaign',
      description: 'Promotional calls for holiday sale event',
      status: 'pending',
      createdBy: 'admin@example.com',
      createdAt: '2025-01-15T10:00:00Z',
      targetPhones: 150,
      estimatedDuration: '2 hours'
    },
    {
      id: 'campaign_2',
      name: 'Customer Follow-up',
      description: 'Follow-up calls for recent customers',
      status: 'approved',
      createdBy: 'admin@example.com',
      createdAt: '2025-01-14T14:30:00Z',
      targetPhones: 75,
      estimatedDuration: '1 hour'
    },
    {
      id: 'campaign_3',
      name: 'Product Launch',
      description: 'Announcement calls for new product launch',
      status: 'rejected',
      createdBy: 'admin@example.com',
      createdAt: '2025-01-13T09:15:00Z',
      targetPhones: 200,
      estimatedDuration: '3 hours'
    }
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // In a real app, you would call the API here
      // const response = await api.getCampaigns();
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId, approve, reason) => {
    try {
      await api.approveCampaign(campaignId, approve, reason);
      loadCampaigns();
      setShowApprovalModal(false);
      setSelectedCampaign(null);
      setApprovalReason('');
    } catch (error) {
      console.error('Failed to approve campaign:', error);
    }
  };

  const openApprovalModal = (campaign) => {
    setSelectedCampaign(campaign);
    setShowApprovalModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Manage and approve marketing campaigns</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="btn btn-secondary btn-md">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Megaphone className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {campaign.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {campaign.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target Phones:</span>
                    <span className="font-medium">{campaign.targetPhones}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">{campaign.estimatedDuration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="btn btn-secondary btn-sm flex-1">
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </button>
                  {campaign.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openApprovalModal(campaign)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Review
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new campaign.'
            }
          </p>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review Campaign: {selectedCampaign.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Description:</p>
              <p className="text-sm text-gray-900">{selectedCampaign.description}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for decision
              </label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Enter your reason for approval or rejection..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedCampaign.id, false, approvalReason)}
                className="btn btn-danger btn-md"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedCampaign.id, true, approvalReason)}
                className="btn btn-primary btn-md"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;

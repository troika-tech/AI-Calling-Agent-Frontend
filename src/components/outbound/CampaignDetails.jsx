import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Download, 
  Phone, 
  FileText, 
  Calendar, 
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmationModal from '../ConfirmationModal';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaignDetails();
    }
  }, [id]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getOutboundCampaign(id);
      setCampaign(response.campaign || response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      
      switch (action) {
        case 'pause':
          await api.pauseOutboundCampaign(id);
          break;
        case 'resume':
          await api.resumeOutboundCampaign(id);
          break;
        case 'launch':
          await api.launchOutboundCampaign(id);
          break;
        case 'delete':
          await api.deleteOutboundCampaign(id);
          navigate('/outbound/campaigns');
          return;
      }
      
      await loadCampaignDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="w-5 h-5 text-green-500" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'draft':
        return <Edit className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading campaign: {error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/outbound/campaigns')}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center space-x-3 mt-1">
              {getStatusIcon(campaign.status)}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {campaign.status === 'draft' && (
            <button
              onClick={() => navigate(`/outbound/campaigns/${id}/edit`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
          
          {campaign.status === 'active' && (
            <button
              onClick={() => handleAction('pause')}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </button>
          )}
          
          {campaign.status === 'paused' && (
            <button
              onClick={() => handleAction('resume')}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </button>
          )}
          
          {campaign.status === 'approved' && (
            <button
              onClick={() => handleAction('launch')}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Launch
            </button>
          )}
          
          {campaign.status === 'draft' && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900">{campaign.description || 'No description provided'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
            <p className="text-gray-900">
              {new Date(campaign.created_at).toLocaleDateString()} at {new Date(campaign.created_at).toLocaleTimeString()}
            </p>
          </div>
          
          {campaign.launched_at && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Launched</h3>
              <p className="text-gray-900">
                {new Date(campaign.launched_at).toLocaleDateString()} at {new Date(campaign.launched_at).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Numbers</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.stats?.total_numbers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Calls Made</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.stats?.calls_made || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Answer Rate</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.stats?.answer_rate || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaign.stats?.avg_duration ? Math.floor(campaign.stats.avg_duration / 60) : 0}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Numbers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Target Numbers</h2>
            <button className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            {campaign.stats?.total_numbers || 0} phone numbers uploaded
          </p>
        </div>
      </div>

      {/* Knowledge Base */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
        </div>
        <div className="p-6">
          {campaign.knowledge_base_files && campaign.knowledge_base_files.length > 0 ? (
            <div className="space-y-3">
              {campaign.knowledge_base_files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No knowledge base files uploaded</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
              <p className="text-gray-900">
                {campaign.schedule?.start_date ? new Date(campaign.schedule.start_date).toLocaleString() : 'Not set'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
              <p className="text-gray-900">
                {campaign.schedule?.end_date ? new Date(campaign.schedule.end_date).toLocaleString() : 'Not set'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Calls Per Hour</h3>
              <p className="text-gray-900">{campaign.schedule?.call_frequency?.calls_per_hour || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Max Concurrent Calls</h3>
              <p className="text-gray-900">{campaign.schedule?.call_frequency?.max_concurrent_calls || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      {campaign.approval?.admin_notes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-900">{campaign.approval.admin_notes}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleAction('delete')}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default CampaignDetails;

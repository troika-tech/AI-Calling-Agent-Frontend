import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User,
  Tag,
  Upload,
  Download
} from 'lucide-react';
import { api } from '../services/api';

const PhoneManagement = () => {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [importPhones, setImportPhones] = useState('');
  const [agentId, setAgentId] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadPhones();
  }, [currentPage, searchTerm]);

  const loadPhones = async () => {
    try {
      setLoading(true);
      const response = await api.getPhones(currentPage, 50, searchTerm);
      setPhones(response.items || []);
      setTotalPages(Math.ceil(response.total / 50));
    } catch (error) {
      console.error('Failed to load phones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const phoneList = importPhones.split('\n').filter(phone => phone.trim());
      await api.importPhones(phoneList);
      setShowImportModal(false);
      setImportPhones('');
      loadPhones();
    } catch (error) {
      console.error('Failed to import phones:', error);
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
    setAgentId(phone.agentId || '');
    setTags(phone.tags?.join(', ') || '');
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (selectedPhone) {
      if (agentId !== selectedPhone.agentId) {
        handleSetAgent(selectedPhone.number, agentId);
      }
      if (tags !== selectedPhone.tags?.join(', ')) {
        handleUpdateTags(selectedPhone.number, tags);
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
          <p className="text-gray-600">Manage phone numbers and their assignments</p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="btn btn-primary btn-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Import Phones
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
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {phones.map((phone) => (
                    <tr key={phone.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {phone.number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {phone.agentId ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{phone.agentId}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {phone.tags?.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(phone.meta?.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(phone)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Phone Numbers</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Numbers (one per line)
              </label>
              <textarea
                value={importPhones}
                onChange={(e) => setImportPhones(e.target.value)}
                rows={6}
                className="input w-full"
                placeholder="+14155550100&#10;+14155550101&#10;+14155550102"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="btn btn-primary btn-md"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPhone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Phone: {selectedPhone.number}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="input w-full"
                  placeholder="agent_123"
                />
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

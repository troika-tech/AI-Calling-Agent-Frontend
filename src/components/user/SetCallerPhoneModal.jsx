import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';

const SetCallerPhoneModal = ({ isOpen, onClose, onSelect, currentPhone }) => {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(''); // Start with no selection - user must manually select
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset selections when modal opens - user must manually select
      setSelectedPhone('');
      setSelectedDocuments([]);
      // Only fetch numbers - don't auto-select anything
      loadPhoneNumbers();
      loadDocuments();
    }
  }, [isOpen]);

  const loadPhoneNumbers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading assigned phone numbers from user model...');
      
      // Fetch phone numbers from user's assigned_phone_numbers in millis_config
      const phoneNumbers = await api.getAssignedPhoneNumbers();
      
      setPhoneNumbers(phoneNumbers);
      console.log('Phone numbers loaded:', phoneNumbers);
      
    } catch (err) {
      console.error('Error loading phone numbers:', err);
      setError('Failed to load phone numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.getAgentDocuments(1, 50);
      setDocuments(response.docs || []);
      console.log('Documents loaded:', response.docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      // Don't set error state for documents, just log it
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedPhone) {
      // Find the complete phone data for the selected phone
      const phoneData = phoneNumbers.find(phone => phone.number === selectedPhone);
      console.log('Selected phone data:', phoneData);
      console.log('Selected documents:', selectedDocuments);
      
      onSelect(selectedPhone, phoneData, selectedDocuments);
      onClose();
    }
  };

  const handleClose = () => {
    // Reset selections when closing
    setSelectedPhone('');
    setSelectedDocuments([]);
    onClose();
  };

  const toggleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Caller Phone Number
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select a phone number from your assigned numbers. You must manually select one before setting it.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Phone Numbers Section */}
            <div className="mb-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading phone numbers...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error loading phone numbers
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={loadPhoneNumbers}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Phone Numbers
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {phoneNumbers.length === 0 ? (
                      <div className="text-center py-4">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assigned phone numbers available</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          No phone numbers have been assigned to your account. Please contact your administrator.
                        </p>
                      </div>
                    ) : (
                      phoneNumbers.map((phone) => (
                        <div
                          key={phone.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                            selectedPhone === phone.number
                              ? 'border-green-500 bg-green-50 dark:bg-green-900'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedPhone(phone.number)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {phone.number}
                                </span>
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  phone.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : phone.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : phone.status === 'error'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                  {phone.status}
                                </span>
                                {phone.integration_status && (
                                  <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    phone.integration_status === 'success' 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : phone.integration_status === 'failed'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    {phone.integration_status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {phone.name}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {selectedPhone === phone.number && (
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Knowledge Base Documents Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Knowledge Base Documents (Optional)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select documents to assign to the campaign with the selected phone number.
              </p>
              
              {documentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading documents...
                  </span>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {documents.length === 0 ? (
                    <div className="text-center py-4">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents available</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Upload documents from the Agents page to assign them here.
                      </p>
                    </div>
                  ) : (
                    documents.map((document) => (
                      <div
                        key={document._id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                          selectedDocuments.includes(document._id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => toggleDocumentSelection(document._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {document.original_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {document.file_type.toUpperCase()} • Knowledge Base
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {selectedDocuments.includes(document._id) && (
                              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedPhone || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Set Selected Phone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetCallerPhoneModal;

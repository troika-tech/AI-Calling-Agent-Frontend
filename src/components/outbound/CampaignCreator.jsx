import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  Calendar, 
  Clock, 
  Users, 
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';

const CampaignCreator = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetNumbers: [],
    knowledgeBaseFiles: []
  });

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Campaign details' },
    { id: 2, title: 'Target Numbers', description: 'Upload CSV or enter manually' },
    { id: 3, title: 'Knowledge Base', description: 'Upload documents' },
    { id: 4, title: 'Review', description: 'Review and submit' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event, type) => {
    const files = Array.from(event.target.files);
    
    if (type === 'csv') {
      // Handle CSV upload for target numbers
      const file = files[0];
      if (file && file.type === 'text/csv') {
        parseCSVFile(file);
      } else {
        setError('Please upload a valid CSV file');
      }
    } else if (type === 'kb') {
      // Handle knowledge base files
      const validFiles = files.filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'text/plain'
      );
      
      if (validFiles.length !== files.length) {
        setError('Please upload only PDF, DOCX, or TXT files');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        knowledgeBaseFiles: [...prev.knowledgeBaseFiles, ...validFiles]
      }));
    }
  };

  const parseCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const numbers = [];
      
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const columns = line.split(',');
        if (columns[0] && columns[0].trim()) {
          numbers.push({
            phone: columns[0].trim(),
            name: columns[1]?.trim() || '',
            metadata: columns.slice(2).reduce((acc, col, i) => {
              acc[`field_${i + 1}`] = col?.trim() || '';
              return acc;
            }, {})
          });
        }
      });
      
      setFormData(prev => ({
        ...prev,
        targetNumbers: numbers
      }));
    };
    reader.readAsText(file);
  };

  const removeFile = (index, type) => {
    if (type === 'kb') {
      setFormData(prev => ({
        ...prev,
        knowledgeBaseFiles: prev.knowledgeBaseFiles.filter((_, i) => i !== index)
      }));
    }
  };

  const addManualNumber = () => {
    const phone = prompt('Enter phone number:');
    if (phone) {
      setFormData(prev => ({
        ...prev,
        targetNumbers: [...prev.targetNumbers, { phone, name: '', metadata: {} }]
      }));
    }
  };

  const removeNumber = (index) => {
    setFormData(prev => ({
      ...prev,
      targetNumbers: prev.targetNumbers.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('target_numbers', JSON.stringify(formData.targetNumbers));
      
      // Add knowledge base files
      formData.knowledgeBaseFiles.forEach((file, index) => {
        formDataToSend.append(`kb_file_${index}`, file);
      });
      
      await api.createOutboundCampaign(formDataToSend);
      navigate('/outbound/campaigns');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter campaign name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your campaign goals and target audience"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Target Numbers</h3>
              
              {/* CSV Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Upload a CSV file with phone numbers</p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: Phone, Name, Additional Fields...
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'csv')}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </label>
                <div className="mt-2">
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={(e) => {
                      e.preventDefault();
                      // Download sample CSV
                      const sampleCSV = 'Phone,Name,Company\n+1234567890,John Doe,Acme Corp\n+0987654321,Jane Smith,Tech Inc';
                      const blob = new Blob([sampleCSV], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sample_numbers.csv';
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Download sample CSV
                  </a>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Manual Entry</h4>
                  <button
                    onClick={addManualNumber}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Add Number
                  </button>
                </div>
                
                {formData.targetNumbers.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {formData.targetNumbers.map((number, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{number.phone}</p>
                            {number.name && (
                              <p className="text-xs text-gray-500">{number.name}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeNumber(index)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Base Documents</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload documents that contain information for your AI agent to reference during calls.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Upload PDF, DOCX, or TXT files</p>
                <p className="text-xs text-gray-500 mb-4">Max 10MB per file, up to 10 files</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'kb')}
                  className="hidden"
                  id="kb-upload"
                />
                <label
                  htmlFor="kb-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </label>
              </div>

              {formData.knowledgeBaseFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Uploaded Files</h4>
                  <div className="space-y-2">
                    {formData.knowledgeBaseFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index, 'kb')}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Campaign</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Campaign Details</h4>
                  <p className="text-sm text-gray-600">Name: {formData.name}</p>
                  <p className="text-sm text-gray-600">Description: {formData.description || 'No description'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Target Numbers</h4>
                  <p className="text-sm text-gray-600">Total: {formData.targetNumbers.length} numbers</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Knowledge Base</h4>
                  <p className="text-sm text-gray-600">Files: {formData.knowledgeBaseFiles.length} documents</p>
                </div>
                
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.targetNumbers.length > 0;
      case 3:
        return true; // Knowledge base is optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/outbound/campaigns')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-gray-600">Set up your outbound calling campaign</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <div className="flex items-center space-x-3">
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={submitCampaign}
              disabled={loading || !canProceed()}
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignCreator;

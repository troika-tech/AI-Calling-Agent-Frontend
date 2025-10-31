import React, { useState } from 'react';
import { X, Download, Calendar, Filter, FileText, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  title = "Export Data",
  availableFormats = ['csv', 'pdf'],
  availableColumns = [],
  defaultColumns = [],
  dateRange = true,
  loading = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customFilters, setCustomFilters] = useState({});

  const handleColumnToggle = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  const handleExport = () => {
    const exportData = {
      format: selectedFormat,
      columns: selectedColumns,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      filters: customFilters
    };
    
    onExport(exportData);
  };

  const handleClose = () => {
    setSelectedFormat('csv');
    setSelectedColumns(defaultColumns);
    setDateFrom('');
    setDateTo('');
    setCustomFilters({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={handleClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {title}
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Export Format
                    </label>
                    <div className="space-y-2">
                      {availableFormats.map((format) => (
                        <label key={format} className="flex items-center">
                          <input
                            type="radio"
                            name="format"
                            value={format}
                            checked={selectedFormat === format}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center">
                            {format === 'csv' ? (
                              <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            ) : (
                              <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-700 uppercase">{format}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  {dateRange && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Column Selection */}
                  {availableColumns.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Filter className="w-4 h-4 inline mr-1" />
                        Select Columns
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        <div className="space-y-2">
                          {availableColumns.map((column) => (
                            <label key={column.key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedColumns.includes(column.key)}
                                onChange={() => handleColumnToggle(column.key)}
                                className="mr-3 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{column.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || selectedColumns.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

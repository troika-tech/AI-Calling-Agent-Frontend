import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateRangePicker = ({ 
  value, 
  onChange, 
  presets = true,
  placeholder = "Select date range",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const presetsList = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last7days' },
    { label: 'Last 30 days', value: 'last30days' },
    { label: 'This month', value: 'thismonth' },
    { label: 'Last month', value: 'lastmonth' },
    { label: 'This year', value: 'thisyear' }
  ];

  const getPresetDates = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return {
          start: today,
          end: today
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: yesterday,
          end: yesterday
        };
      case 'last7days':
        const last7days = new Date(today);
        last7days.setDate(last7days.getDate() - 6);
        return {
          start: last7days,
          end: today
        };
      case 'last30days':
        const last30days = new Date(today);
        last30days.setDate(last30days.getDate() - 29);
        return {
          start: last30days,
          end: today
        };
      case 'thismonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: thisMonthStart,
          end: today
        };
      case 'lastmonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: lastMonthStart,
          end: lastMonthEnd
        };
      case 'thisyear':
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        return {
          start: thisYearStart,
          end: today
        };
      default:
        return null;
    }
  };

  const handlePresetSelect = (preset) => {
    const dates = getPresetDates(preset);
    if (dates) {
      const startStr = dates.start.toISOString().split('T')[0];
      const endStr = dates.end.toISOString().split('T')[0];
      
      setStartDate(startStr);
      setEndDate(endStr);
      
      onChange({
        start: startStr,
        end: endStr,
        preset: preset
      });
      
      setIsOpen(false);
    }
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onChange({
        start: startDate,
        end: endDate,
        preset: 'custom'
      });
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!value) return placeholder;
    
    if (value.preset && value.preset !== 'custom') {
      const preset = presetsList.find(p => p.value === value.preset);
      return preset ? preset.label : placeholder;
    }
    
    if (value.start && value.end) {
      const start = new Date(value.start).toLocaleDateString();
      const end = new Date(value.end).toLocaleDateString();
      return `${start} - ${end}`;
    }
    
    return placeholder;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
      >
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-700">{formatDateRange()}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {presets && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select</h4>
                <div className="grid grid-cols-2 gap-2">
                  {presetsList.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset.value)}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Range</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={handleCustomDateChange}
                disabled={!startDate || !endDate}
                className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Custom Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateRangePicker;

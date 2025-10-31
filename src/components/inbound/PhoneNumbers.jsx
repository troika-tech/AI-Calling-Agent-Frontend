import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

const PhoneNumbers = () => {
  const [phoneStats, setPhoneStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhoneStats();
  }, []);

  const loadPhoneStats = async () => {
    try {
      setLoading(true);
      const data = await api.getInboundPhoneNumbers();
      setPhoneStats(data);
    } catch (error) {
      console.error('Error loading phone stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getBestPerformingPhone = () => {
    if (phoneStats.length === 0) return null;
    return phoneStats.reduce((best, current) => 
      current.conversion_rate > best.conversion_rate ? current : best
    );
  };

  const getMostActivePhone = () => {
    if (phoneStats.length === 0) return null;
    return phoneStats.reduce((most, current) => 
      current.total_calls > most.total_calls ? current : most
    );
  };

  const bestPerforming = getBestPerformingPhone();
  const mostActive = getMostActivePhone();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
          <p className="text-gray-600">Monitor performance of your inbound phone numbers</p>
        </div>
        
        <button
          onClick={loadPhoneStats}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Phone Numbers</p>
              <p className="text-2xl font-bold text-gray-900">{phoneStats.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Active Number</p>
              <p className="text-lg font-bold text-gray-900">
                {mostActive ? mostActive.phone_number : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {mostActive ? `${mostActive.total_calls} calls` : 'No calls yet'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Best Performing</p>
              <p className="text-lg font-bold text-gray-900">
                {bestPerforming ? bestPerforming.phone_number : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {bestPerforming ? `${bestPerforming.conversion_rate.toFixed(1)}% conversion` : 'No data yet'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Phone Number Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Calls
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {phoneStats.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers configured</h3>
                      <p className="text-gray-500">Contact your administrator to set up inbound phone numbers.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                phoneStats.map((phone, index) => {
                  const isBestPerforming = bestPerforming && phone.phone_number === bestPerforming.phone_number;
                  const isMostActive = mostActive && phone.phone_number === mostActive.phone_number;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {phone.phone_number}
                          </span>
                          {isBestPerforming && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">
                              Best
                            </span>
                          )}
                          {isMostActive && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                              Most Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          {phone.total_calls}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDuration(phone.avg_duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {phone.leads_generated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            phone.conversion_rate >= 20 ? 'text-green-600' :
                            phone.conversion_rate >= 10 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {phone.conversion_rate.toFixed(1)}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                phone.conversion_rate >= 20 ? 'bg-green-400' :
                                phone.conversion_rate >= 10 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.min(phone.conversion_rate * 2, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          phone.conversion_rate >= 20 ? 'text-green-800 bg-green-100' :
                          phone.conversion_rate >= 10 ? 'text-yellow-800 bg-yellow-100' : 'text-red-800 bg-red-100'
                        }`}>
                          {phone.conversion_rate >= 20 ? 'Excellent' :
                           phone.conversion_rate >= 10 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      {phoneStats.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Performance Insights</h3>
          <div className="space-y-3">
            {bestPerforming && (
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Best performing number: {bestPerforming.phone_number}
                  </p>
                  <p className="text-sm text-blue-700">
                    {bestPerforming.conversion_rate.toFixed(1)}% conversion rate with {bestPerforming.total_calls} calls
                  </p>
                </div>
              </div>
            )}
            
            {mostActive && mostActive !== bestPerforming && (
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Most active number: {mostActive.phone_number}
                  </p>
                  <p className="text-sm text-blue-700">
                    {mostActive.total_calls} total calls with {mostActive.conversion_rate.toFixed(1)}% conversion rate
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Total phone numbers: {phoneStats.length}
                </p>
                <p className="text-sm text-blue-700">
                  Average conversion rate: {(phoneStats.reduce((sum, phone) => sum + phone.conversion_rate, 0) / phoneStats.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneNumbers;

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';

const UserBilling = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7'); // days
  const [costData, setCostData] = useState([]);

  useEffect(() => {
    loadBillingData();
  }, [timeRange]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [profileResponse, callsResponse] = await Promise.all([
        api.getUserProfile(),
        api.getUserCallLogs(1000) // Get more calls for cost analysis
      ]);

      setUserProfile(profileResponse);
      setCallLogs(callsResponse.items || []);
      
      // Process cost data for charts
      processCostData(callsResponse.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processCostData = (calls) => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Group calls by date
    const dailyCosts = {};
    const dailyCalls = {};

    calls.forEach(call => {
      const callDate = new Date(call.ts);
      if (callDate >= startDate && callDate <= endDate) {
        const dateKey = callDate.toISOString().split('T')[0];
        dailyCosts[dateKey] = (dailyCosts[dateKey] || 0) + (call.cost || 0);
        dailyCalls[dateKey] = (dailyCalls[dateKey] || 0) + 1;
      }
    });

    // Create chart data
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      chartData.push({
        date: dateKey,
        cost: dailyCosts[dateKey] || 0,
        calls: dailyCalls[dateKey] || 0,
        displayDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }

    setCostData(chartData);
  };

  const getTotalCost = () => {
    return callLogs.reduce((sum, call) => sum + (call.cost || 0), 0);
  };

  const getTotalCalls = () => {
    return callLogs.length;
  };

  const getAverageCostPerCall = () => {
    const totalCalls = getTotalCalls();
    return totalCalls > 0 ? getTotalCost() / totalCalls : 0;
  };

  const getMaxDailyCost = () => {
    return Math.max(...costData.map(d => d.cost), 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Error loading billing data</div>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button 
          onClick={loadBillingData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Usage</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor your credit usage and call costs over time.
        </p>
      </div>

      {/* Billing Overview */}
      {userProfile?.billing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Credits</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(userProfile.billing.credit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Used Credits</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(userProfile.billing.used_credit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Refill</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {userProfile.billing.auto_refill ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{getTotalCalls()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(getTotalCost())}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Cost/Call</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(getAverageCostPerCall())}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Daily Cost</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(getMaxDailyCost())}</p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost Analysis</h3>
          <div className="flex space-x-2">
            {['7', '14', '30'].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  timeRange === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Cost Breakdown</h3>
        {costData.length > 0 ? (
          <div className="space-y-4">
            {/* Simple bar chart representation */}
            <div className="space-y-2">
              {costData.map((day, index) => {
                const maxCost = Math.max(...costData.map(d => d.cost));
                const barWidth = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                      {day.displayDate}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%` }}
                      >
                        {day.cost > 0 && (
                          <span className="text-xs text-white font-medium">
                            {formatCurrency(day.cost)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {day.calls} calls
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Daily Cost</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last {timeRange} days
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No usage data</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No calls found for the selected time period.
            </p>
          </div>
        )}
      </div>

      {/* Credit Usage Progress */}
      {userProfile?.billing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Credit Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Used: {formatCurrency(userProfile.billing.used_credit)}</span>
              <span>Available: {formatCurrency(userProfile.billing.credit)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (userProfile.billing.used_credit / 
                     (userProfile.billing.credit + userProfile.billing.used_credit)) * 100,
                    100
                  )}%`
                }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {userProfile.billing.auto_refill ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-refill is enabled
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Auto-refill is disabled
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBilling;

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { convertToIST, formatDuration, formatCurrency, getRelativeTime } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';

const UserOverview = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileResponse, callsResponse, campaignsResponse] = await Promise.all([
        api.getUserProfile(),
        api.getUserCallLogs(10), // Get last 10 calls
        api.getUserCampaigns(1, 10) // Get first 10 campaigns
      ]);

      setUserProfile(profileResponse);
      setRecentCalls(callsResponse.items || []);
      setCampaigns(campaignsResponse.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = () => {
    if (!recentCalls.length) {
      return {
        totalCalls: 0,
        avgDuration: 0,
        completionRate: 0,
        totalCost: 0,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length
      };
    }

    const totalCalls = recentCalls.length;
    const completedCalls = recentCalls.filter(call => call.status === 'completed').length;
    const avgDuration = recentCalls.reduce((sum, call) => sum + (call.duration_sec || 0), 0) / totalCalls;
    const totalCost = recentCalls.reduce((sum, call) => sum + (call.cost || 0), 0);
    const completionRate = (completedCalls / totalCalls) * 100;

    return {
      totalCalls,
      avgDuration,
      completionRate,
      totalCost,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length
    };
  };

  const kpis = calculateKPIs();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Error loading dashboard</div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={loadDashboardData}
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's what's happening with your calls and campaigns.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.totalCalls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(kpis.avgDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {kpis.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(kpis.totalCost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Info */}
      {userProfile?.billing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Credits</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(userProfile.billing.credit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Used Credits</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(userProfile.billing.used_credit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Auto Refill</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {userProfile.billing.auto_refill ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last 10 calls and their status</p>
        </div>
        <div className="p-6">
          {recentCalls.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No calls yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your call activity will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div key={call.session_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        call.status === 'completed' ? 'bg-green-500' :
                        call.status === 'failed' ? 'bg-red-500' :
                        call.status === 'live' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {call.agent?.name || 'Unknown Agent'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {call.masked_phone} • {getRelativeTime(call.ts)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDuration(call.duration_sec)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(call.cost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Campaigns</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {campaigns.filter(c => c.status === 'active').map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created {getRelativeTime(campaign.created_at)}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOverview;

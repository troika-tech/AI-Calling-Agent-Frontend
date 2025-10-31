import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { 
  Users, 
  Megaphone, 
  PhoneCall, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowRight,
  Plus
} from 'lucide-react';

const AdminOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError('');

      const [overview, users, campaigns, health] = await Promise.all([
        api.getAdminOverview(),
        api.getUsers(1, 10, '', ''),
        api.getPendingCampaigns(),
        api.getAdminSystemHealth()
      ]);

      setOverviewData(overview);
      setRecentUsers(users.items || []);
      setPendingCampaigns(campaigns.items || []);
      setSystemHealth(health);
    } catch (err) {
      setError(err.message || 'Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      case 'error': return <AlertCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your AI calling platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(overviewData?.total_users || 0)}
              </p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overviewData?.user_trend || 0)}
                <span className={`ml-1 text-sm ${getTrendColor(overviewData?.user_trend || 0)}`}>
                  {Math.abs(overviewData?.user_trend || 0)}% from last month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Inbound: {overviewData?.inbound_users || 0}</span>
              <span>Outbound: {overviewData?.outbound_users || 0}</span>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overviewData?.active_campaigns || 0}
              </p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overviewData?.campaign_trend || 0)}
                <span className={`ml-1 text-sm ${getTrendColor(overviewData?.campaign_trend || 0)}`}>
                  {Math.abs(overviewData?.campaign_trend || 0)}% from last month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Megaphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Pending: {pendingCampaigns.length}</span>
          </div>
        </div>

        {/* Calls Today */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Calls Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(overviewData?.calls_today || 0)}
              </p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overviewData?.calls_trend || 0)}
                <span className={`ml-1 text-sm ${getTrendColor(overviewData?.calls_trend || 0)}`}>
                  {Math.abs(overviewData?.calls_trend || 0)}% from yesterday
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Avg duration: {Math.round(overviewData?.avg_call_duration || 0)}s</span>
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue This Month</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(overviewData?.revenue_this_month || 0)}
              </p>
              <div className="flex items-center mt-2">
                {getTrendIcon(overviewData?.revenue_trend || 0)}
                <span className={`ml-1 text-sm ${getTrendColor(overviewData?.revenue_trend || 0)}`}>
                  {Math.abs(overviewData?.revenue_trend || 0)}% from last month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>ARPU: {formatCurrency(overviewData?.avg_revenue_per_user || 0)}</span>
          </div>
        </div>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getHealthIcon(systemHealth?.api_status || 'unknown')}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">API Status</span>
              </div>
              <span className={`text-sm font-medium ${getHealthColor(systemHealth?.api_status || 'unknown')}`}>
                {systemHealth?.api_status || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getHealthIcon(systemHealth?.database_status || 'unknown')}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Database</span>
              </div>
              <span className={`text-sm font-medium ${getHealthColor(systemHealth?.database_status || 'unknown')}`}>
                {systemHealth?.database_status || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Uptime</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatUptime(systemHealth?.uptime_seconds || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-500" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
              </div>
              <span className={`text-sm font-medium ${
                (systemHealth?.error_rate || 0) > 5 ? 'text-red-600' : 
                (systemHealth?.error_rate || 0) > 2 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {(systemHealth?.error_rate || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/users')}
              className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Plus className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium">Create User</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/campaigns')}
              className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Megaphone className="h-5 w-5 text-purple-500 mr-3" />
                <span className="font-medium">View Approvals</span>
                {pendingCampaigns.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingCampaigns.length}
                  </span>
                )}
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/monitoring')}
              className="w-full flex items-center justify-between p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-green-500 mr-3" />
                <span className="font-medium">System Monitoring</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  user.role === 'inbound' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {user.role}
                </span>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent users
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Call Volume Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Call Volume (Last 7 Days)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chart will be implemented with Recharts library</p>
            <p className="text-sm">Data: {formatNumber(overviewData?.total_calls || 0)} calls this week</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;

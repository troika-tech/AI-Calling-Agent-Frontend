import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Phone,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

const SystemMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemHealth, setSystemHealth] = useState(null);
  const [callStats, setCallStats] = useState(null);
  const [latestCalls, setLatestCalls] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchSystemData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setError('');
      const [health, stats, calls] = await Promise.all([
        api.getAdminSystemHealth(),
        api.getAdminCallStats('month'),
        api.getCallLogs({ limit: 5 })
      ]);

      setSystemHealth(health);
      setCallStats(stats);
      setLatestCalls(calls.items || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getErrorRateColor = (rate) => {
    if (rate > 5) return 'text-red-500';
    if (rate > 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'answered': return 'text-blue-600';
      case 'no_answer': return 'text-yellow-600';
      case 'busy': return 'text-orange-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCallTypeIcon = (type) => {
    return type === 'inbound' ? 
      <Phone className="h-4 w-4 text-blue-500" /> : 
      <Phone className="h-4 w-4 text-purple-500" />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchSystemData}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* API Uptime */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatUptime(systemHealth?.uptime_seconds || 0)}
              </p>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Since {new Date(Date.now() - (systemHealth?.uptime_seconds || 0) * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Status</p>
              <div className="flex items-center mt-2">
                {getStatusIcon(systemHealth?.database_status || 'unknown')}
                <span className={`ml-2 text-lg font-semibold ${getStatusColor(systemHealth?.database_status || 'unknown')}`}>
                  {systemHealth?.database_status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center mt-2">
                <Database className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {systemHealth?.database_connections || 0} connections
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Millis API Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Millis API Status</p>
              <div className="flex items-center mt-2">
                {systemHealth?.millis_api_status === 'connected' ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className={`ml-2 text-lg font-semibold ${
                  systemHealth?.millis_api_status === 'connected' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {systemHealth?.millis_api_status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last check: {systemHealth?.millis_last_check ? new Date(systemHealth.millis_last_check).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className={`text-2xl font-bold ${getErrorRateColor(systemHealth?.error_rate || 0)}`}>
                {(systemHealth?.error_rate || 0).toFixed(2)}%
              </p>
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {systemHealth?.total_errors || 0} errors in last hour
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Total Calls Processed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls Processed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(systemHealth?.total_calls || 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {callStats?.calls_today || 0} today
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMemory(systemHealth?.memory_usage || 0)}
              </p>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {((systemHealth?.memory_usage || 0) / (systemHealth?.total_memory || 1) * 100).toFixed(1)}% of total
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Server className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Call Volume Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Call Volume (Last 30 Days)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chart will be implemented with Recharts library</p>
            <p className="text-sm">Data: {callStats?.total_calls || 0} calls this month</p>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Real-time Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Hour Calls</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {callStats?.calls_last_hour || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Hour Failures</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {callStats?.failures_last_hour || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Error Rate</span>
              </div>
              <span className={`text-lg font-semibold ${getErrorRateColor(callStats?.current_error_rate || 0)}`}>
                {(callStats?.current_error_rate || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Latest Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latest Calls</h3>
          <div className="space-y-3">
            {latestCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  {getCallTypeIcon(call.type)}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {call.phone_from} → {call.phone_to}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(call.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getCallStatusColor(call.status)}`}>
                    {call.status}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCallDuration(call.duration_seconds || 0)}
                  </div>
                </div>
              </div>
            ))}
            {latestCalls.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent calls</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;

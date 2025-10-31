import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { convertToIST, formatDuration, formatCurrency, getRelativeTime } from '../../utils/timezone';
import LoadingSpinner from '../LoadingSpinner';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserOverview = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    successVsFailure: [],
    statusBreakdown: [],
    trendData: [],
    performanceMetrics: []
  });

  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingData) return;
    
    try {
      setIsLoadingData(true);
      setLoading(true);
      
      // Fetch profile and Exotel calls (same source as Calls page)
      const [profileResponse, callsResponse] = await Promise.all([
        api.getUserProfile(),
        api.getLiveExotelCalls() // Fetch ALL calls from Exotel (no date filter)
      ]);

      setUserProfile(profileResponse.user);
      // API service returns { items } from Exotel calls
      const allCalls = callsResponse.items || callsResponse.calls || [];
      setRecentCalls(allCalls.slice(0, 10)); // Keep last 10 for display if needed
      
      // Log sample call for debugging
      if (allCalls.length > 0) {
        console.log('[UserOverview] Sample call data structure:', {
          status: allCalls[0].status,
          duration_seconds: allCalls[0].duration_seconds,
          created_at: allCalls[0].created_at,
          phone_from: allCalls[0].phone_from,
          phone_to: allCalls[0].phone_to
        });
      }
      
      console.log(`[UserOverview] Loaded ${allCalls.length} calls from Exotel for analytics`);
      console.log(`[UserOverview] Status breakdown:`, {
        completed: allCalls.filter(c => c.status === 'completed').length,
        failed: allCalls.filter(c => c.status === 'failed').length,
        busy: allCalls.filter(c => c.status === 'busy').length,
        'no-answer': allCalls.filter(c => c.status === 'no-answer').length,
        voicemail: allCalls.filter(c => c.status === 'voicemail').length,
        other: allCalls.filter(c => !['completed', 'failed', 'busy', 'no-answer', 'voicemail'].includes(c.status)).length
      });
      
      // Process analytics data - use normalized statuses from Exotel
      // Exotel statuses are normalized to: 'completed', 'failed', 'busy', 'no-answer', 'voicemail'
      const successCount = allCalls.filter(c => c.status === 'completed').length;
      const failureCount = allCalls.filter(c => 
        c.status === 'failed' || 
        c.status === 'busy' || 
        c.status === 'no-answer'
      ).length;
      
      // Success vs Failure chart data
      setAnalyticsData(prev => ({
        ...prev,
        successVsFailure: [
          { name: 'Success', value: successCount, color: '#10b981' },
          { name: 'Failure', value: failureCount, color: '#ef4444' }
        ],
        statusBreakdown: [
          { name: 'Answered', value: allCalls.filter(c => c.status === 'completed').length, color: '#10b981' },
          { name: 'Failed', value: allCalls.filter(c => c.status === 'failed').length, color: '#ef4444' },
          { name: 'No Answer', value: allCalls.filter(c => c.status === 'no-answer').length, color: '#f59e0b' },
          { name: 'Busy', value: allCalls.filter(c => c.status === 'busy').length, color: '#f97316' },
          { name: 'Voicemail', value: allCalls.filter(c => c.status === 'voicemail').length, color: '#3b82f6' }
        ]
      }));

      // Generate trend data (last 7 days)
      const trendData = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        // Exotel calls have 'timestamp' or 'created_at' field
        const dayCalls = allCalls.filter(call => {
          const callDate = call.timestamp 
            ? new Date(call.timestamp) 
            : call.created_at 
            ? new Date(call.created_at) 
            : call.start_time 
            ? new Date(call.start_time)
            : null;
          if (!callDate) return false;
          return callDate >= dayStart && callDate <= dayEnd;
        });
        
        // Use normalized Exotel statuses
        const daySuccess = dayCalls.filter(c => c.status === 'completed').length;
        const dayFailure = dayCalls.filter(c => 
          c.status === 'failed' || 
          c.status === 'no-answer' || 
          c.status === 'busy'
        ).length;
        
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          success: daySuccess,
          failure: dayFailure,
          total: dayCalls.length
        });
      }
      setAnalyticsData(prev => ({ ...prev, trendData }));

      // Performance metrics (by hour of day)
      const hourMetrics = Array.from({ length: 24 }, (_, i) => {
        const hourCalls = allCalls.filter(call => {
          // Exotel calls have 'timestamp' or 'created_at' field
          const callDate = call.timestamp 
            ? new Date(call.timestamp) 
            : call.created_at 
            ? new Date(call.created_at) 
            : call.start_time 
            ? new Date(call.start_time)
            : null;
          if (!callDate) return false;
          return callDate.getHours() === i;
        });
        return {
          hour: `${i}:00`,
          calls: hourCalls.length,
          avgDuration: hourCalls.length > 0 
            ? hourCalls.reduce((sum, c) => sum + (c.duration_seconds || c.duration || 0), 0) / hourCalls.length 
            : 0
        };
      });
      setAnalyticsData(prev => ({ ...prev, performanceMetrics: hourMetrics }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  }, []); // Remove isLoadingData dependency to prevent infinite loop

  useEffect(() => {
    loadDashboardData();
  }, []); // Only run once on mount

  const kpis = useMemo(() => {
    if (!recentCalls.length) {
      // Show demo data when no real data is available
      return {
        totalCalls: 0,
        avgDuration: 0,
        completionRate: 0,
        totalCost: 0,
        hasData: false
      };
    }

    const totalCalls = recentCalls.length;
    // Use normalized Exotel status 'completed' instead of 'answered'
    const completedCalls = recentCalls.filter(call => call.status === 'completed').length;
    const avgDuration = recentCalls.reduce((sum, call) => sum + (call.duration_seconds || call.duration || 0), 0) / totalCalls;
    const totalCost = recentCalls.reduce((sum, call) => sum + (call.cost || 0), 0);
    const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

    return {
      totalCalls,
      avgDuration,
      completionRate,
      totalCost,
      hasData: true
    };
  }, [recentCalls]);

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
      <div className="pt-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {kpis.hasData 
            ? "Welcome back! Here's what's happening with your calls and campaigns."
            : "Welcome to your AI Calling Agent dashboard! Let's get you started with your first campaign."
          }
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {kpis.hasData ? kpis.totalCalls : '--'}
              </p>
              {!kpis.hasData && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {kpis.hasData ? formatDuration(kpis.avgDuration) : '--'}
              </p>
              {!kpis.hasData && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {kpis.hasData ? `${kpis.completionRate.toFixed(1)}%` : '--'}
              </p>
              {!kpis.hasData && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {kpis.hasData ? formatCurrency(kpis.totalCost) : '--'}
              </p>
              {!kpis.hasData && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section - Show when no data */}
      {!kpis.hasData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow p-8 border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to AI Calling Agent!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Get started by setting up your first campaign and phone numbers. Our AI agents will handle your calls automatically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Create Campaign</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up your first campaign with AI agents</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Add Phone Numbers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure your phone numbers for calls</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Assign Agents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assign AI agents to handle your calls</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg">
                Get Started Now
              </button>
              <button className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium">
                Watch Tutorial
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Success vs Failure (Pie Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Success vs Failure Rate</h3>
          {analyticsData.successVsFailure.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.successVsFailure}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {analyticsData.successVsFailure.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Chart 2: Call Status Breakdown (Bar Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Call Status Breakdown</h3>
          {analyticsData.statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {analyticsData.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Chart 3: Call Trends Over Time (Area Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">7-Day Call Trends</h3>
          {analyticsData.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.trendData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" name="Success" />
                <Area type="monotone" dataKey="failure" stackId="1" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailure)" name="Failure" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Chart 4: Performance Metrics by Hour (Line Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calls by Hour of Day</h3>
          {analyticsData.performanceMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.performanceMetrics.slice(8, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Calls"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserOverview;

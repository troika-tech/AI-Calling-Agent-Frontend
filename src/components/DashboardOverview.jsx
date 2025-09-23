import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Users, 
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Brain,
  Cpu
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const DashboardOverview = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalPhones: 0,
    activeCalls: 0,
    totalSessions: 0,
    campaigns: 0,
    aiAccuracy: 0,
    responseTime: 0
  });
  const [loading, setLoading] = useState(true);

  // Enhanced mock data for AI SaaS
  const callData = [
    { name: 'Mon', calls: 24, aiCalls: 18 },
    { name: 'Tue', calls: 13, aiCalls: 10 },
    { name: 'Wed', calls: 18, aiCalls: 14 },
    { name: 'Thu', calls: 22, aiCalls: 17 },
    { name: 'Fri', calls: 19, aiCalls: 15 },
    { name: 'Sat', calls: 8, aiCalls: 6 },
    { name: 'Sun', calls: 12, aiCalls: 9 }
  ];

  const sessionData = [
    { name: 'Completed', value: 78, color: '#10B981' },
    { name: 'In Progress', value: 15, color: '#F59E0B' },
    { name: 'Failed', value: 7, color: '#EF4444' }
  ];

  const recentCalls = [
    { id: 1, from: '+14155550100', to: '+14155550101', duration: '5:30', status: 'completed', time: '2 min ago', aiPowered: true },
    { id: 2, from: '+14155550102', to: '+14155550103', duration: '3:15', status: 'completed', time: '15 min ago', aiPowered: true },
    { id: 3, from: '+14155550104', to: '+14155550105', duration: '0:45', status: 'failed', time: '1 hour ago', aiPowered: false },
    { id: 4, from: '+14155550106', to: '+14155550107', duration: '8:20', status: 'completed', time: '2 hours ago', aiPowered: true }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalPhones: 1250,
        activeCalls: 23,
        totalSessions: 1847,
        campaigns: 12,
        aiAccuracy: 94.2,
        responseTime: 1.2
      });
      setLoading(false);
    }, 1000);
  }, []);

  const PremiumStatCard = ({ title, value, icon: Icon, change, color = 'primary', subtitle, trend, delay = 0 }) => (
    <div 
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slide-up`}
      style={{ 
        animationDelay: `${delay}ms`,
        background: isDark 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 ${
                color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                color === 'green' ? 'bg-green-500/20 text-green-400' :
                color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                color === 'accent' ? 'bg-accent-500/20 text-accent-400' :
                'bg-primary-500/20 text-primary-400'
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              {trend && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-display">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
            )}
          </div>
          
          {change && (
            <div className={`flex items-center space-x-1 ${
              change > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {change > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 rounded-2xl blur-3xl" />
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-display">
                AI Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Intelligent calling system powered by advanced AI
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-300">System Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-accent-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">AI Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <PremiumStatCard
          title="Total Phones"
          value={stats.totalPhones.toLocaleString()}
          icon={Phone}
          change={12}
          color="blue"
          subtitle="Connected devices"
          trend={12}
          delay={0}
        />
        <PremiumStatCard
          title="Active Calls"
          value={stats.activeCalls}
          icon={Activity}
          change={-5}
          color="green"
          subtitle="Live conversations"
          trend={-5}
          delay={100}
        />
        <PremiumStatCard
          title="AI Sessions"
          value={stats.totalSessions.toLocaleString()}
          icon={Brain}
          change={8}
          color="purple"
          subtitle="AI-powered calls"
          trend={8}
          delay={200}
        />
        <PremiumStatCard
          title="Campaigns"
          value={stats.campaigns}
          icon={Target}
          change={2}
          color="orange"
          subtitle="Active campaigns"
          trend={2}
          delay={300}
        />
        <PremiumStatCard
          title="AI Accuracy"
          value={`${stats.aiAccuracy}%`}
          icon={Zap}
          change={3}
          color="accent"
          subtitle="Success rate"
          trend={3}
          delay={400}
        />
        <PremiumStatCard
          title="Response Time"
          value={`${stats.responseTime}s`}
          icon={Cpu}
          change={-15}
          color="primary"
          subtitle="Average latency"
          trend={-15}
          delay={500}
        />
      </div>

      {/* Premium Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Call Volume Chart */}
        <div 
          className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl animate-slide-up"
          style={{ 
            animationDelay: '600ms',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-500/20 text-primary-400 rounded-lg">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">AI Call Analytics</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Live Data</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={callData}>
                <defs>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aiCallsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    background: isDark ? '#1f2937' : '#ffffff',
                    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area type="monotone" dataKey="calls" stroke="#0ea5e9" fill="url(#callsGradient)" strokeWidth={3} />
                <Area type="monotone" dataKey="aiCalls" stroke="#d946ef" fill="url(#aiCallsGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Calls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-300">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Performance Chart */}
        <div 
          className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl animate-slide-up"
          style={{ 
            animationDelay: '700ms',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-primary-500/5" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent-500/20 text-accent-400 rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">AI Performance</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-display">94.2%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sessionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: isDark ? '#1f2937' : '#ffffff',
                    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-8 mt-6">
              {sessionData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI-Powered Recent Calls */}
        <div 
          className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl animate-slide-up"
          style={{ 
            animationDelay: '800ms',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">Live AI Calls</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Real-time</span>
              </div>
            </div>
            <div className="space-y-4">
              {recentCalls.map((call, index) => (
                <div 
                  key={call.id} 
                  className="group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-md"
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                    borderColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                    animationDelay: `${900 + index * 100}ms`
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${
                        call.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {call.aiPowered && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {call.from} → {call.to}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{call.time}</p>
                        {call.aiPowered && (
                          <div className="flex items-center space-x-1">
                            <Brain className="h-3 w-3 text-accent-500" />
                            <span className="text-xs text-accent-500 font-medium">AI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{call.duration}</p>
                    <p className={`text-xs font-medium ${
                      call.status === 'completed' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {call.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Quick Actions */}
        <div 
          className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl animate-slide-up"
          style={{ 
            animationDelay: '900ms',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-primary-500/5" />
          <div className="relative p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-accent-500/20 text-accent-400 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">AI Quick Actions</h3>
            </div>
            <div className="space-y-4">
              <button className="group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5" />
                  <span className="font-medium">Import Phone Numbers</span>
                </div>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button className="group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white">
                <div className="flex items-center space-x-3">
                  <Megaphone className="h-5 w-5 text-accent-500" />
                  <span className="font-medium">Create AI Campaign</span>
                </div>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button className="group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white">
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">View AI Sessions</span>
                </div>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button className="group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Export Analytics</span>
                </div>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

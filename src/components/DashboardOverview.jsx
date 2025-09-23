import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Users, 
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalPhones: 0,
    activeCalls: 0,
    totalSessions: 0,
    campaigns: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const callData = [
    { name: 'Mon', calls: 24 },
    { name: 'Tue', calls: 13 },
    { name: 'Wed', calls: 18 },
    { name: 'Thu', calls: 22 },
    { name: 'Fri', calls: 19 },
    { name: 'Sat', calls: 8 },
    { name: 'Sun', calls: 12 }
  ];

  const sessionData = [
    { name: 'Completed', value: 65, color: '#10B981' },
    { name: 'In Progress', value: 20, color: '#F59E0B' },
    { name: 'Failed', value: 15, color: '#EF4444' }
  ];

  const recentCalls = [
    { id: 1, from: '+14155550100', to: '+14155550101', duration: '5:30', status: 'completed', time: '2 min ago' },
    { id: 2, from: '+14155550102', to: '+14155550103', duration: '3:15', status: 'completed', time: '15 min ago' },
    { id: 3, from: '+14155550104', to: '+14155550105', duration: '0:45', status: 'failed', time: '1 hour ago' },
    { id: 4, from: '+14155550106', to: '+14155550107', duration: '8:20', status: 'completed', time: '2 hours ago' }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalPhones: 1250,
        activeCalls: 23,
        totalSessions: 1847,
        campaigns: 12
      });
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon: Icon, change, color = 'primary' }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${
          color === 'blue' ? 'bg-blue-100' :
          color === 'green' ? 'bg-green-100' :
          color === 'purple' ? 'bg-purple-100' :
          color === 'orange' ? 'bg-orange-100' :
          'bg-primary-100'
        }`}>
          <Icon className={`h-6 w-6 ${
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' :
            color === 'purple' ? 'text-purple-600' :
            color === 'orange' ? 'text-orange-600' :
            'text-primary-600'
          }`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Phones"
          value={stats.totalPhones.toLocaleString()}
          icon={Phone}
          change={12}
          color="blue"
        />
        <StatCard
          title="Active Calls"
          value={stats.activeCalls}
          icon={PhoneCall}
          change={-5}
          color="green"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          icon={Users}
          change={8}
          color="purple"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.campaigns}
          icon={Megaphone}
          change={2}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Call Volume (Last 7 Days)</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={callData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Status Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Session Status Distribution</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sessionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center space-x-6">
              {sessionData.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      call.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {call.from} → {call.to}
                      </p>
                      <p className="text-xs text-gray-500">{call.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{call.duration}</p>
                    <p className={`text-xs ${
                      call.status === 'completed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {call.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <button className="w-full btn btn-primary btn-md justify-start">
                <Phone className="mr-2 h-4 w-4" />
                Import Phone Numbers
              </button>
              <button className="w-full btn btn-secondary btn-md justify-start">
                <Megaphone className="mr-2 h-4 w-4" />
                Create New Campaign
              </button>
              <button className="w-full btn btn-secondary btn-md justify-start">
                <Users className="mr-2 h-4 w-4" />
                View All Sessions
              </button>
              <button className="w-full btn btn-secondary btn-md justify-start">
                <PhoneCall className="mr-2 h-4 w-4" />
                Export Call Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

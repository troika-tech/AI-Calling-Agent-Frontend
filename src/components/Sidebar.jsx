import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Phone, 
  Megaphone, 
  PhoneCall, 
  Users, 
  UserCog,
  UserCheck,
  X,
  LogOut,
  Brain,
  Sparkles,
  Zap,
  BarChart3,
  CheckCircle,
  Activity,
  DollarSign,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  // Admin-only navigation - all routes under /admin/* for proper role-based access
  const adminNavigation = [
    { name: 'Overview', href: '/admin/overview', icon: LayoutDashboard, gradient: ['#ffffff', '#ffffff'] },
    { name: 'Calls', href: '/admin/calls', icon: PhoneCall, gradient: ['#ffffff', '#ffffff'] },
    { name: 'Agents', href: '/admin/agents', icon: Users, gradient: ['#ffffff', '#ffffff'] },
    { name: 'Voice Agents', href: '/admin/voice-agents', icon: Sparkles, gradient: ['#ffffff', '#ffffff'] },
    { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone, gradient: ['#ffffff', '#ffffff'] },
    { name: 'Phones', href: '/admin/phones', icon: Phone, gradient: ['#ffffff', '#ffffff'] },
    { name: 'Billing', href: '/admin/billing', icon: DollarSign, gradient: ['#ffffff', '#ffffff'] },
  ];

  const navigation = user?.role === 'admin' 
    ? adminNavigation
    : [];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
            style={{ 
              background: isDark 
                ? 'rgba(0, 0, 0, 0.7)' 
                : 'rgba(0, 0, 0, 0.5)' 
            }}
            onClick={onClose} 
          />
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: '#ffffff',
          borderRight: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b" style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)' }}>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">AI Calling Agent</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 border border-gray-200'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`
                  }
                  onClick={onClose}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`relative flex items-center ${isActive ? 'text-gray-900' : ''}`}>
                        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {/* removed right-side active decoration to prevent visual overlap */}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)' }}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div className="min-w-0 flexx-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || 'AI Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'admin@ai-calling.com'}</p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

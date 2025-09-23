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
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const baseNavigation = [
    { name: 'AI Dashboard', href: '/', icon: LayoutDashboard, gradient: ['#3b82f6', '#06b6d4'] },
    { name: 'Phone Management', href: '/phones', icon: Phone, gradient: ['#10b981', '#059669'] },
    { name: 'AI Campaigns', href: '/campaigns', icon: Megaphone, gradient: ['#8b5cf6', '#7c3aed'] },
    { name: 'Call Analytics', href: '/call-logs', icon: PhoneCall, gradient: ['#f97316', '#dc2626'] },
    { name: 'AI Sessions', href: '/sessions', icon: Brain, gradient: ['#ec4899', '#f43f5e'] },
  ];

  // Add admin-only navigation items
  const adminNavigation = [
    { name: 'User Management', href: '/users', icon: UserCog, gradient: ['#6366f1', '#3b82f6'] },
    { name: 'Agent Assignment', href: '/agent-assignment', icon: UserCheck, gradient: ['#14b8a6', '#06b6d4'] },
  ];

  const navigation = user?.role === 'admin' 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

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

      {/* Premium Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: isDark 
            ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: isDark ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        {/* Premium Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b" style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)' }}>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #d946ef)'
                }}
              >
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display">AI Calling</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Intelligent Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Premium Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                      isActive
                        ? 'text-white shadow-lg'
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
                      {isActive && (
                        <div 
                          className="absolute inset-0 rounded-xl shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`
                          }}
                        />
                      )}
                      <div className={`relative flex items-center space-x-3 ${isActive ? 'text-white' : ''}`}>
                        <div 
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-white/20' 
                              : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isActive && (
                        <div className="absolute right-4">
                          <Sparkles className="h-4 w-4 text-white animate-pulse" />
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Premium User Section */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-6 border-t"
          style={{ 
            borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)',
            background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)'
          }}
        >
          <div className="flex items-center mb-4">
            <div className="relative">
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #d946ef)'
                }}
              >
                <span className="text-lg font-bold text-white">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || 'AI Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'admin@ai-calling.com'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="group w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:scale-105"
          >
            <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

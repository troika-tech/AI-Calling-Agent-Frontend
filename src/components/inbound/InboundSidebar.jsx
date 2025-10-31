import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Phone, 
  Settings,
  X,
  LogOut,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const InboundSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Overview', href: '/inbound/dashboard', icon: LayoutDashboard, gradient: ['#3b82f6', '#06b6d4'] },
    { name: 'Call Transcripts', href: '/inbound/transcripts', icon: FileText, gradient: ['#10b981', '#059669'] },
    { name: 'Lead Extraction', href: '/inbound/leads', icon: Users, gradient: ['#f59e0b', '#d97706'] },
    { name: 'Analytics', href: '/inbound/analytics', icon: BarChart3, gradient: ['#8b5cf6', '#7c3aed'] },
    { name: 'Phone Numbers', href: '/inbound/phones', icon: Phone, gradient: ['#ef4444', '#dc2626'] },
    { name: 'Settings', href: '/inbound/settings', icon: Settings, gradient: ['#6b7280', '#4b5563'] },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Inbound AI</h1>
                <p className="text-xs text-gray-500">Call Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${active 
                      ? 'bg-gradient-to-r text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  style={active ? {
                    background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`
                  } : {}}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 transition-colors duration-200
                    ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
              <Sparkles className="w-3 h-3" />
              <span>Inbound Agent</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>

            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InboundSidebar;

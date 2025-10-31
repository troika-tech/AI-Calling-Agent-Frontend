import React, { useState } from 'react';
import { Menu, Bell, Search, Sun, Moon, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header 
      className="relative backdrop-blur-md border-b transition-all duration-300"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 lg:ml-72">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search AI calls, campaigns..."
                  className="block w-80 pl-12 pr-4 py-3 border rounded-xl leading-5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm shadow-sm"
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(226, 232, 240, 0.8)',
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="group relative p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`
              }}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
              )}
            </button>

            {/* Notifications */}
            <button className="group relative p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`
              }}
            >
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                style={{ background: 'linear-gradient(45deg, #ef4444, #f87171)' }}
              />
              <Bell className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>

            {/* Settings */}
            <button className="group p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`
              }}
            >
              <Settings className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
            
            {/* User Profile with Dropdown */}
            <div className="hidden sm:flex items-center space-x-3 pl-3">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <div className="relative">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #d946ef)'
                      }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-20 py-2 transition-all duration-200"
                      style={{
                        background: isDark 
                          ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(226, 232, 240, 0.8)'
                      }}
                    >
                      <div className="px-4 py-3 border-b mb-2" style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)' }}>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'user@example.com'}
                        </p>
                        {user?.role && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 capitalize">
                            {user.role}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2 flex items-center space-x-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';
import { Menu, Bell, Search, Sun, Moon, User, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();

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
      <div className="px-4 sm:px-6 lg:px-8">
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
                  className="block w-80 pl-12 pr-4 py-3 border rounded-xl leading-5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(226, 232, 240, 0.8)',
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
                background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.8)',
                border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`
              }}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
              )}
            </button>

            {/* Notifications */}
            <button className="group relative p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                style={{ background: 'linear-gradient(45deg, #ef4444, #f87171)' }}
              />
              <Bell className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>

            {/* Settings */}
            <button className="group p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <Settings className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
            
            {/* User Profile */}
            <div className="hidden sm:flex items-center space-x-3 pl-3">
              <div className="relative">
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #d946ef)'
                  }}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Admin</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">admin@ai-calling.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import UserSidebar from './user/UserSidebar';
import Header from './Header';
import UserOverview from './user/UserOverview';
import UserCalls from './user/UserCalls';
import UserAgents from './user/UserAgents';
import UserCampaigns from './user/UserCampaigns';
import UserPhones from './user/UserPhones';
import UserBilling from './user/UserBilling';
import UserSupport from './user/UserSupport';
import { useTheme } from '../contexts/ThemeContext';

const UserDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  const renderContent = () => {
    const path = location.pathname;
    
    switch (path) {
      // Admin routes (redirect to user dashboard)
      case '/phones':
        return <UserPhones />;
      case '/campaigns':
        return <UserCampaigns />;
      case '/call-logs':
        return <UserCalls />;
      case '/agent-assignment':
        return <UserAgents />; // Agent assignment redirect to agents for users
      case '/users':
        return <UserOverview />; // User management redirect to overview for users
      
      // User-specific routes
      case '/user/overview':
      case '/user/dashboard':
        return <UserOverview />;
      case '/user/calls':
        return <UserCalls />;
      case '/user/agents':
        return <UserAgents />;
      case '/user/campaigns':
        return <UserCampaigns />;
      case '/user/phones':
        return <UserPhones />;
      case '/user/billing':
        return <UserBilling />;
      case '/user/support':
        return <UserSupport />;
      
      // Default to user overview
      default:
        return <UserOverview />;
    }
  };

  return (
    <div 
      className="min-h-screen transition-all duration-300"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
      }}
    >
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;

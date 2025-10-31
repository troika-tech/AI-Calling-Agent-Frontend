import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import UserSidebar from './user/UserSidebar';
import Header from './Header';
import UserOverview from './user/UserOverview';
import UserCalls from './user/UserCalls';
import UserAgents from './user/UserAgents';
import UserVoiceAgents from './user/UserVoiceAgents';
import UserCampaigns from './user/UserCampaigns';
import CampaignDetail from './user/CampaignDetail';
import UserPhones from './user/UserPhones';
import UserBilling from './user/UserBilling';
import UserSupport from './user/UserSupport';
import { useTheme } from '../contexts/ThemeContext';

const UserDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  const content = useMemo(() => {
    const path = location.pathname;
    
    // Handle both /inbound/* and /user/* routes
    if (path.startsWith('/inbound/')) {
      // Handle campaign detail routes with ID
      if (path.startsWith('/inbound/campaigns/') && path !== '/inbound/campaigns') {
        // Extract campaign ID from path
        const campaignId = path.split('/inbound/campaigns/')[1];
        if (campaignId) {
          return <CampaignDetail campaignId={campaignId} />;
        }
      }
      
      switch (path) {
        case '/inbound/dashboard':
          // Redirect dashboard to overview for consistency
          window.history.replaceState(null, '', '/inbound/overview');
          return <UserOverview />;
        case '/inbound/overview':
          return <UserOverview />;
        case '/inbound/calls':
          return <UserCalls />;
        case '/inbound/agents':
        case '/inbound/voice-agents':
        case '/inbound/phones':
          // Hide these routes for inbound users - redirect to overview
          window.history.replaceState(null, '', '/inbound/overview');
          return <UserOverview />;
        case '/inbound/campaigns':
          return <UserCampaigns />;
        case '/inbound/billing':
          return <UserBilling />;
        case '/inbound/support':
          return <UserSupport />;
        default:
          return <UserOverview />;
      }
    }
    
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
      case '/user/voice-agents':
        return <UserVoiceAgents />;
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
  }, [location.pathname]);

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
      
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="lg:ml-72">
        <main className="pt-6 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="min-h-screen">
              {content}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;

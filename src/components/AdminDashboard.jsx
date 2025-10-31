import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardOverview from './DashboardOverview';
import PhoneManagement from './PhoneManagement';
import CampaignManagement from './CampaignManagement';
import CallLogs from './CallLogs';
import UserManagement from './UserManagement';
import AgentAssignment from './AgentAssignment';
// Admin components
import AdminOverview from './admin/AdminOverview';
import CampaignApprovals from './admin/CampaignApprovals';
import SystemMonitoring from './admin/SystemMonitoring';
import BillingRevenue from './admin/BillingRevenue';
import AdminLogs from './admin/AdminLogs';
// User dashboard components (for admin access to inbound-style features)
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

const AdminDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  const renderContent = () => {
    const path = location.pathname;
    
    // Handle all routes under /admin/* prefix
    if (path.startsWith('/admin/')) {
      // Handle campaign detail routes with ID
      if (path.startsWith('/admin/campaigns/') && path !== '/admin/campaigns') {
        const campaignId = path.split('/admin/campaigns/')[1];
        if (campaignId) {
          return <CampaignDetail campaignId={campaignId} />;
        }
      }
      
      switch (path) {
        case '/admin/dashboard':
        case '/admin':
          return <AdminOverview />;
        case '/admin/overview':
          return <UserOverview />;
        case '/admin/calls':
          return <UserCalls />;
        case '/admin/agents':
          return <UserAgents />;
        case '/admin/voice-agents':
          return <UserVoiceAgents />;
        case '/admin/campaigns':
          return <UserCampaigns />;
        case '/admin/phones':
          return <UserPhones />;
        case '/admin/billing':
          return <UserBilling />;
        case '/admin/support':
          return <UserSupport />;
        case '/admin/users':
          return <UserManagement />;
        case '/admin/campaign-approvals':
          return <CampaignApprovals />;
        case '/admin/monitoring':
          return <SystemMonitoring />;
        case '/admin/revenue':
          return <BillingRevenue />;
        case '/admin/logs':
          return <AdminLogs />;
        case '/admin/call-logs':
          return <CallLogs />;
        case '/admin/agent-assignment':
          return <AgentAssignment />;
        default:
          // Default to overview if unknown admin route
          return <UserOverview />;
      }
    }
    
    // Legacy route support (backward compatibility - redirect handled by ProtectedRoute)
    switch (path) {
      case '/phones':
        // Redirect to /admin/phones (handled by ProtectedRoute)
        window.history.replaceState(null, '', '/admin/phones');
        return <PhoneManagement />;
      case '/campaigns':
        // Redirect to /admin/campaigns
        window.history.replaceState(null, '', '/admin/campaigns');
        return <CampaignApprovals />;
      case '/call-logs':
        // Redirect to /admin/call-logs
        window.history.replaceState(null, '', '/admin/call-logs');
        return <CallLogs />;
      case '/users':
        // Redirect to /admin/users
        window.history.replaceState(null, '', '/admin/users');
        return <UserManagement />;
      case '/agent-assignment':
        // Redirect to /admin/agent-assignment
        window.history.replaceState(null, '', '/admin/agent-assignment');
        return <AgentAssignment />;
      default:
        // Default to admin dashboard
        return <AdminOverview />;
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
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

export default AdminDashboard;

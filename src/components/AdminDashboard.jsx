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
import { useTheme } from '../contexts/ThemeContext';

const AdminDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  const renderContent = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/phones':
        return <PhoneManagement />;
      case '/campaigns':
        return <CampaignManagement />;
      case '/call-logs':
        return <CallLogs />;
      case '/users':
        return <UserManagement />;
      case '/agent-assignment':
        return <AgentAssignment />;
      default:
        return <DashboardOverview />;
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

export default AdminDashboard;

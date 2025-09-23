import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardOverview from './DashboardOverview';
import PhoneManagement from './PhoneManagement';
import CampaignManagement from './CampaignManagement';
import CallLogs from './CallLogs';
import Sessions from './Sessions';
import UserManagement from './UserManagement';

const Dashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/phones':
        return <PhoneManagement />;
      case '/campaigns':
        return <CampaignManagement />;
      case '/call-logs':
        return <CallLogs />;
      case '/sessions':
        return <Sessions />;
      case '/users':
        return <UserManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

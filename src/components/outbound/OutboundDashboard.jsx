import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import OutboundSidebar from './OutboundSidebar';
import Header from '../Header';
import OutboundOverview from './OutboundOverview';
import CampaignList from './CampaignList';
import CampaignCreator from './CampaignCreator';
import CampaignDetails from './CampaignDetails';
import CampaignAnalytics from './CampaignAnalytics';
import CallLogs from './CallLogs';
import LeadTracking from './LeadTracking';
import PhoneNumbers from './PhoneNumbers';
import Settings from './Settings';

const OutboundDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/outbound/dashboard':
        return <OutboundOverview />;
      case '/outbound/campaigns':
        return <CampaignList />;
      case '/outbound/campaigns/create':
        return <CampaignCreator />;
      case '/outbound/campaigns/:id':
        return <CampaignDetails />;
      case '/outbound/campaigns/:id/analytics':
        return <CampaignAnalytics />;
      case '/outbound/calls':
        return <CallLogs />;
      case '/outbound/leads':
        return <LeadTracking />;
      case '/outbound/phones':
        return <PhoneNumbers />;
      case '/outbound/settings':
        return <Settings />;
      default:
        return <OutboundOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <OutboundSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton={true}
        />
        
        {/* Page Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default OutboundDashboard;

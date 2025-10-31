import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import InboundSidebar from './InboundSidebar';
import Header from '../Header';
import InboundOverview from './InboundOverview';
import CallTranscripts from './CallTranscripts';
import LeadExtraction from './LeadExtraction';
import Analytics from './Analytics';
import PhoneNumbers from './PhoneNumbers';
import Settings from './Settings';

const InboundDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/inbound/dashboard':
        return <InboundOverview />;
      case '/inbound/transcripts':
        return <CallTranscripts />;
      case '/inbound/leads':
        return <LeadExtraction />;
      case '/inbound/analytics':
        return <Analytics />;
      case '/inbound/phones':
        return <PhoneNumbers />;
      case '/inbound/settings':
        return <Settings />;
      default:
        return <InboundOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <InboundSidebar 
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

export default InboundDashboard;

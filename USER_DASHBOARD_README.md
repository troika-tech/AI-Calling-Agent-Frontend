# User Dashboard - Read-Only Interface

This document describes the new user dashboard implementation that provides read-only access to call performance, financial impact, and related resources for authenticated users.

## Overview

The user dashboard is designed to give users visibility into their call performance and usage without administrative privileges. All data is read-only and managed by administrators.

## Features Implemented

### 📊 Home / Overview (`/user/overview`)
- **KPI Cards**: Total calls, average call duration, completion rate, total cost, active campaigns count
- **Recent Activity Feed**: Last 10 calls with status and agent information
- **Billing Overview**: Available credits, used credits, auto-refill status
- **Active Campaigns**: List of currently active campaigns

### 📞 Calls (`/user/calls`)
- **Calls Table**: Comprehensive table with filters for agent, status, and date range
- **Pagination**: Cursor-based pagination with "Load More" functionality
- **Columns**: Timestamp (IST), agent, masked phone, duration, status, cost
- **Call Detail Drawer**: 
  - Transcript (chat conversation)
  - Cost breakdown (ASR/LLM/TTS, etc.)
  - Recording playback capability
  - Metadata display
- **Export to CSV**: Filter-respected CSV export with data masking

### 🤖 Agents (`/user/agents`)
- **Read-only Agent List**: Name, voice/label, language, created date
- **Admin Notice**: Clear indication that agents are managed by administrators
- **Test Call Button**: Optional test call functionality (placeholder)
- **Search and Pagination**: Full search and pagination support

### 📣 Campaigns (`/user/campaigns`)
- **Campaign List**: Name, status, created date, records count
- **Campaign Details**: 
  - Basic information (target audience, call volume)
  - Performance metrics (total calls, completed calls, success rate)
  - Campaign settings (max retries, call timeout)
- **Status Indicators**: Visual status badges with icons

### 📱 Phone Numbers (`/user/phones`)
- **Phone Table**: Masked phone numbers, assigned agent, status, tags, created date
- **Quick Filters**: Filter by tags or search by last digits
- **Tag Management**: Visual tag display and filtering
- **Agent Assignment**: Shows which agent is assigned to each phone

### 💳 Billing & Usage (`/user/billing`)
- **Credit Information**: Available vs used credits with visual progress bar
- **Auto-refill Status**: Enabled/disabled status with threshold information
- **Usage Statistics**: Total calls, total cost, average cost per call, max daily cost
- **Cost Charts**: Daily cost breakdown with visual bar charts
- **Time Range Selection**: 7, 14, or 30-day views

### 🛠 Support (`/user/support`)
- **Request Form**: Subject, priority, message, call reference, file attachment
- **Recent Calls**: Quick access to recent calls for context
- **CSV Export**: Download call logs for support requests
- **Support Information**: Response times and guidelines

## Technical Implementation

### API Integration
- **Base URL**: `http://localhost:5000/api/v1`
- **Authentication**: HTTP-only cookies (session-based)
- **Endpoints**: All user dashboard endpoints implemented in `src/services/api.js`
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Components Structure
```
src/components/user/
├── UserOverview.jsx      # Home/Overview page
├── UserCalls.jsx         # Calls management
├── UserAgents.jsx        # Agents listing
├── UserCampaigns.jsx     # Campaigns management
├── UserPhones.jsx        # Phone numbers
├── UserBilling.jsx       # Billing & usage
├── UserSupport.jsx       # Support requests
└── UserSidebar.jsx       # Navigation sidebar
```

### Utilities
- **Timezone Conversion**: `src/utils/timezone.js`
  - Convert UTC to IST with offset notation
  - Format duration, currency, and relative time
  - Consistent time display across all components

### Key Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Support**: Full dark/light theme support
- **Loading States**: Comprehensive loading indicators
- **Error Boundaries**: Graceful error handling
- **Data Masking**: Phone numbers and PII properly masked
- **Accessibility**: ARIA labels and keyboard navigation

## Navigation

The user dashboard includes a dedicated sidebar with the following sections:
- Overview (Dashboard)
- Calls
- Agents
- Campaigns
- Phone Numbers
- Billing & Usage
- Support

## Security & Privacy

- **Data Masking**: All phone numbers are masked in responses
- **Read-Only Access**: No modification capabilities for users
- **Session Management**: Secure HTTP-only cookie authentication
- **Rate Limiting**: Respects API rate limits with user feedback

## Timezone Handling

All timestamps are displayed in IST (Asia/Kolkata) with proper offset notation:
- Format: `2025-09-25 14:05 IST (+05:30)`
- Automatic conversion from UTC
- Consistent across all components

## Usage

1. **Access**: Navigate to `/user/overview` or any user-specific route
2. **Navigation**: Use the sidebar to switch between different sections
3. **Data Interaction**: All data is read-only; contact administrators for changes
4. **Export**: Use CSV export functionality for data analysis
5. **Support**: Submit requests through the support form

## API Endpoints Used

- `GET /me` - User profile with billing
- `GET /agents` - List agents
- `GET /call-logs` - List call logs with filtering
- `GET /call-logs/{id}` - Call details
- `GET /campaigns` - List campaigns
- `GET /campaigns/{id}` - Campaign details
- `GET /phones` - List phone numbers
- `GET /exports/calls.csv` - Export call logs

## Future Enhancements

- Real-time updates for live calls
- Advanced analytics and reporting
- Custom date range selection
- Bulk operations for data export
- Integration with external analytics tools

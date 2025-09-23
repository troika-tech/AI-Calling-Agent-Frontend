# Millis SaaS Admin Dashboard

A beautiful, modern admin dashboard for managing the Millis SaaS API. Built with React, Tailwind CSS, and Lucide React icons.

## Features

- 🔐 **Authentication System** - Secure login with JWT tokens
- 📊 **Dashboard Overview** - Real-time statistics and charts
- 📱 **Phone Management** - Import, assign agents, and manage phone numbers
- 📢 **Campaign Management** - Create, approve, and monitor campaigns
- 📞 **Call Logs** - View and analyze call history
- 👥 **Session Management** - Monitor user sessions and interactions
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS

## Screenshots

The dashboard includes:
- Clean, modern interface with sidebar navigation
- Real-time statistics cards with trend indicators
- Interactive charts and data visualizations
- Comprehensive data tables with search and filtering
- Modal dialogs for data entry and editing
- Responsive design that works on all devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to the Millis SaaS API (running on localhost:4000)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd millis-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Configuration

The dashboard is configured to connect to the Millis SaaS API at `http://localhost:4000/api/v1`. To change this, update the `API_BASE_URL` in `src/services/api.js`.

## API Integration

This dashboard integrates with the following Millis SaaS API endpoints:

### Authentication
- `POST /auth/login` - User login
- `GET /me/whoami` - Get current user
- `POST /auth/refresh` - Refresh access token

### Phone Management
- `GET /admin/phones` - List phones with pagination
- `POST /admin/phones/import` - Import phone numbers
- `POST /admin/phones/{phone}/set_agent` - Assign agent to phone
- `PATCH /admin/phones/{phone}/tags` - Update phone tags

### Campaign Management
- `POST /admin/campaigns/{id}/approve` - Approve/reject campaigns

### Call & Session Management
- `GET /admin/call_logs` - Get call logs with filtering
- `GET /admin/sessions` - Get sessions with filtering

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.js     # Main dashboard layout
│   ├── Login.js         # Authentication component
│   ├── Sidebar.js       # Navigation sidebar
│   ├── Header.js        # Top header bar
│   ├── DashboardOverview.js  # Dashboard statistics
│   ├── PhoneManagement.js    # Phone management
│   ├── CampaignManagement.js # Campaign management
│   ├── CallLogs.js      # Call logs viewer
│   └── Sessions.js      # Session management
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication context
├── services/            # API services
│   └── api.js          # API client
└── index.js            # App entry point
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Technologies Used

- **React 18** - Frontend framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **Date-fns** - Date manipulation

## Features in Detail

### Dashboard Overview
- Real-time statistics cards
- Interactive charts showing call volume and session distribution
- Recent activity feed
- Quick action buttons

### Phone Management
- Bulk import phone numbers
- Assign agents to phone numbers
- Add/remove tags
- Search and filter functionality
- Pagination support

### Campaign Management
- View all campaigns with status indicators
- Approve/reject campaigns with reason
- Filter by status
- Campaign details and metrics

### Call Logs
- Comprehensive call history
- Filter by date range, status, and phone numbers
- Export functionality
- Detailed call information

### Session Management
- Monitor user sessions
- Filter by phone number and agent
- Session status tracking
- Duration and activity metrics

## Authentication

The dashboard uses JWT tokens for authentication:
- Access tokens are stored in localStorage
- Automatic token refresh when expired
- Secure API calls with Bearer authentication
- Automatic logout on authentication failure

## Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support or questions about the dashboard, please contact the development team.

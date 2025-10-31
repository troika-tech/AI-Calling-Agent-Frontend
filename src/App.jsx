import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import OutboundDashboard from './components/outbound/OutboundDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Component to redirect based on user role
function RoleBasedRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/overview" replace />;
    case 'inbound':
      return <Navigate to="/inbound/dashboard" replace />;
    case 'outbound':
      return <Navigate to="/outbound/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    const path = location.pathname || '';
    let target = '/';
    if (path.startsWith('/admin/')) target = '/admin';
    else if (path.startsWith('/inbound/')) target = '/inbound';
    else if (path.startsWith('/outbound/')) target = '/outbound';
    return <Navigate to={target} replace />;
  }

  // Strict role check - redirect if user doesn't have the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Access denied: User role '${user.role}' not in allowed roles:`, allowedRoles);
    return <RoleBasedRedirect />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route path="/" element={user ? <RoleBasedRedirect /> : <Login />} />

        {/* Register route */}
        <Route path="/register" element={user ? <RoleBasedRedirect /> : <Register />} />

        {/* Role-specific login aliases */}
        <Route path="/admin" element={<Login />} />
        <Route path="/inbound" element={<Login />} />
        <Route path="/outbound" element={<Login />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Inbound routes */}
        <Route
          path="/inbound/*"
          element={
            <ProtectedRoute allowedRoles={['inbound']}>
              <UserDashboard dashboardType="inbound" />
            </ProtectedRoute>
          }
        />

        {/* Outbound routes */}
        <Route
          path="/outbound/*"
          element={
            <ProtectedRoute allowedRoles={['outbound']}>
              <OutboundDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback - redirect based on role */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
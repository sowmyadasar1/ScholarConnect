import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Mentors from './pages/Mentors';
import Teammates from './pages/Teammates';
import Collaboration from './pages/Collaboration';
import AdminDashboard from './pages/AdminDashboard';
import FeedbackUI from './pages/FeedbackUI';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Requests from './pages/Requests';
import AuthCallback from './pages/AuthCallback';
import AdminUsers from './pages/AdminUsers';
import Workspace from './pages/Workspace';
import MyNetwork from './pages/MyNetwork';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !user.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="mentors" element={<Mentors />} />
              <Route path="teammates" element={<Teammates />} />
              <Route path="collaboration" element={<Collaboration />} />
              <Route path="network" element={<MyNetwork />} />
              <Route path="requests" element={<Requests />} />
              <Route path="settings" element={<Settings />} />
              <Route path="feedback" element={<FeedbackUI />} />
              <Route path="workspace/:teamId" element={<Workspace />} />
              <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

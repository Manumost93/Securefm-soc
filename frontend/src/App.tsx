import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TicketListPage from './pages/Tickets/TicketList';
import TicketDetailPage from './pages/Tickets/TicketDetail';
import TicketFormPage from './pages/Tickets/TicketForm';
import SOCDashboardPage from './pages/SOCDashboard';
import WebSecAuditorPage from './pages/WebSecAuditor';
import UsersPage from './pages/Users';
import ProfilePage from './pages/Profile';
import NotFoundPage from './pages/NotFound';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/new" element={<TicketFormPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="tickets/:id/edit" element={<TicketFormPage />} />
        <Route path="soc" element={<SOCDashboardPage />} />
        <Route path="audit" element={<WebSecAuditorPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;

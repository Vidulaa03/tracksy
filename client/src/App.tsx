import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ApplicationsListPage from '@/pages/dashboard/ApplicationsListPage';
import ApplicationDetailPage from '@/pages/dashboard/ApplicationDetailPage';
import ResumePage from '@/pages/dashboard/ResumePage';
import CalendarPage from '@/pages/dashboard/CalendarPage';
import './globals.css';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function handleLogout() { await logout(); navigate('/'); }
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                         element={<LandingPage />} />
          <Route path="/auth/login"               element={<LoginPage />} />
          <Route path="/auth/signup"              element={<SignupPage />} />
          <Route path="/dashboard"                element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/applications"   element={<ProtectedRoute><DashboardLayout><ApplicationsListPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/applications/:id" element={<ProtectedRoute><DashboardLayout><ApplicationDetailPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/calendar"       element={<ProtectedRoute><DashboardLayout><CalendarPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/resume"         element={<ProtectedRoute><DashboardLayout><ResumePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="*"                         element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

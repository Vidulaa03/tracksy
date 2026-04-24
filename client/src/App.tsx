import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ApplicationsListPage from '@/pages/dashboard/ApplicationsListPage';
import ApplicationDetailPage from '@/pages/dashboard/ApplicationDetailPage';
import ResumePage from '@/pages/dashboard/ResumePage';
import CalendarPage from '@/pages/dashboard/CalendarPage';
import ExportPage from '@/pages/dashboard/ExportPage';
import './globals.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                           element={<LandingPage />} />
          <Route path="/auth/login"                 element={<LoginPage />} />
          <Route path="/auth/signup"                element={<SignupPage />} />
          <Route path="/dashboard"                  element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/applications"     element={<ProtectedRoute><DashboardLayout><ApplicationsListPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/applications/:id" element={<ProtectedRoute><DashboardLayout><ApplicationDetailPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/calendar"         element={<ProtectedRoute><DashboardLayout><CalendarPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/resume"           element={<ProtectedRoute><DashboardLayout><ResumePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/export"           element={<ProtectedRoute><DashboardLayout><ExportPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="*"                           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="app-main">
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

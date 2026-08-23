import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

const COLLAPSE_STORAGE_KEY = 'tracksy:sidebar-collapsed';

function getInitialCollapsed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <div className={`app-shell${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar user={user} onLogout={handleLogout} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      <div className="app-main">
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

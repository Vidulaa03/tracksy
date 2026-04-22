import { Link, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { Zap, LayoutDashboard, Briefcase, FileText, Calendar, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

// ── Add Calendar to the nav ───────────────────────────────────────────────────
const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard',    exact: true  },
  { to: '/dashboard/applications', icon: Briefcase,       label: 'Applications', exact: false },
  { to: '/dashboard/calendar',     icon: Calendar,        label: 'Calendar',     exact: false },
  { to: '/dashboard/resume',       icon: FileText,        label: 'Resume',       exact: false },
];

export default function Header({ user, onLogout }: HeaderProps) {
  const location = useLocation();

  return (
    <aside className="flex flex-col h-screen flex-shrink-0" style={{ width: '224px', background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)' }}>
          <Zap size={16} color="white" />
        </div>
        <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>Tracksy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background:  active ? 'var(--primary-muted)' : 'transparent',
                color:       active ? 'var(--primary)'       : 'var(--text-secondary)',
                border:      active ? '1px solid var(--primary-border)' : '1px solid transparent',
                textDecoration: 'none',
              }}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      {user && (
        <div className="px-3 pb-5 space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="px-3 py-2">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <LogOut size={16} />Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

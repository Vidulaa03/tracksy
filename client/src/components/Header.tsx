import { Link, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { Zap, LayoutDashboard, Briefcase, FileText, Calendar, Download, LogOut } from 'lucide-react';

interface HeaderProps { user: User | null; onLogout: () => void; }

const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard',    exact: true  },
  { to: '/dashboard/applications', icon: Briefcase,       label: 'Applications', exact: false },
  { to: '/dashboard/calendar',     icon: Calendar,        label: 'Calendar',     exact: false },
  { to: '/dashboard/resume',       icon: FileText,        label: 'Resume',       exact: false },
  { to: '/dashboard/export',       icon: Download,        label: 'Export',       exact: false },
];

export default function Header({ user, onLogout }: HeaderProps) {
  const location = useLocation();
  return (
    <aside className="flex flex-col h-screen flex-shrink-0" style={{ width: '248px', background: 'linear-gradient(180deg, rgba(17,24,39,0.98), rgba(8,12,20,0.98))', borderRight: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 14px 30px rgba(99,102,241,0.25)' }}>
          <Zap size={16} color="white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)', display: 'block' }}>Tracksy</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Job hunt OS</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-2">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150"
              style={{ background: active ? 'linear-gradient(180deg, rgba(124,58,237,0.16), rgba(99,102,241,0.08))' : 'transparent', color: active ? '#ddd6fe' : 'var(--text-secondary)', border: active ? '1px solid rgba(129,140,248,0.24)' : '1px solid transparent', textDecoration: 'none', boxShadow: active ? '0 12px 28px rgba(99,102,241,0.14)' : 'none' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} />
              </div>
              {label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="px-3 pb-5 space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)', fontSize: '13px' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{user.email}</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium w-full hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <LogOut size={16} />Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

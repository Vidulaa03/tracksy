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
    <aside className="flex flex-col h-screen flex-shrink-0" style={{ width: '264px', background: 'linear-gradient(180deg, rgba(17,24,39,0.98), rgba(8,12,20,0.98))', borderRight: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03)' }}>
      <div className="px-6 pt-9 pb-7" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', left: '18px', width: '132px', height: '132px', borderRadius: '999px', background: 'radial-gradient(circle, rgba(139,92,246,0.26), transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '2px', right: '8px', width: '110px', height: '110px', borderRadius: '999px', background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 72%)', filter: 'blur(10px)', pointerEvents: 'none' }} />
        <div className="flex items-center gap-10" style={{ position: 'relative' }}>
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: '92px', height: '92px', borderRadius: '30px', background: 'linear-gradient(145deg, rgba(168,85,247,0.98), rgba(99,102,241,0.98) 55%, rgba(56,189,248,0.9))', boxShadow: '0 24px 48px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 20px rgba(15,23,42,0.16)' }}>
            <Zap size={56} color="white" />
          </div>
          <div style={{ minWidth: 0, paddingTop: '6px', paddingLeft: '10px' }}>
            <span
              className="font-bold tracking-tight"
              style={{
                color: '#ffffff',
                display: 'block',
                fontSize: '42px',
                lineHeight: 0.92,
                letterSpacing: '-0.03em',
                fontWeight: 800,
                textShadow: '0 10px 24px rgba(0,0,0,0.24)',
              }}
            >
              Tracksy
            </span>
            <span
              style={{
                display: 'block',
                marginTop: '16px',
                marginLeft: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#8f7cf6',
                textTransform: 'uppercase',
                letterSpacing: '0.46em',
              }}
            >
              Job Hunt OS
            </span>
          </div>
        </div>
        <div style={{ marginTop: '24px', height: '1px', background: 'linear-gradient(90deg, rgba(129,140,248,0.38), rgba(255,255,255,0.08), transparent)' }} />
      </div>
      <nav className="flex-1 px-3 py-8 space-y-3">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-150"
              style={{ background: active ? 'linear-gradient(180deg, rgba(124,58,237,0.18), rgba(99,102,241,0.1))' : 'transparent', color: active ? '#ddd6fe' : 'var(--text-secondary)', border: active ? '1px solid rgba(129,140,248,0.24)' : '1px solid transparent', textDecoration: 'none', boxShadow: active ? '0 12px 28px rgba(99,102,241,0.14)' : 'none', transform: active ? 'translateX(0)' : 'translateX(0)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease, background 0.15s ease' }}>
                <Icon size={18} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="px-3 pb-5 space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 700 }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)', marginTop: '5px', fontSize: '12px' }}>{user.email}</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium w-full hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
            <LogOut size={16} />Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

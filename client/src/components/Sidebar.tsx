import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { Zap, LayoutDashboard, Briefcase, Calendar, FileText, Download, LogOut, ArrowUpRight } from 'lucide-react';

const NAV = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard',    exact: true  },
  { to: '/dashboard/applications', icon: Briefcase,       label: 'Applications', exact: false },
  { to: '/dashboard/calendar',     icon: Calendar,        label: 'Calendar',     exact: false },
  { to: '/dashboard/resume',       icon: FileText,        label: 'Resume',       exact: false },
  { to: '/dashboard/export',       icon: Download,        label: 'Export',       exact: false },
];

interface Props {
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: Props) {
  const { pathname } = useLocation();

  return (
    <aside className="glass-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '250px', padding: '24px 20px', gap: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(93,139,255,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(124,92,255,1), rgba(93,139,255,0.9))', display: 'grid', placeItems: 'center', boxShadow: '0 18px 36px rgba(124,92,255,0.22)' }}>
          <Zap size={26} color="white" />
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.05em', marginBottom: '4px' }}>Tracksy</p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0 }}>Job Hunt OS</p>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className="nav-link"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '16px', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s, transform 0.2s',
                background: active ? 'rgba(124,92,255,0.16)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-secondary)',
                border: active ? '1px solid rgba(124,92,255,0.22)' : '1px solid transparent',
                boxShadow: active ? '0 16px 32px rgba(124,92,255,0.14)' : 'none',
              }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '14px', display: 'grid', placeItems: 'center', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)' }}>
                <Icon size={16} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div style={{ padding: '20px 18px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '12px' }}>Signed in as</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(124,92,255,0.4), rgba(93,139,255,0.15))', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{user.name?.slice(0,2).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ marginTop: '18px', width: '100%', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>Sign out</button>
        </div>
      )}
    </aside>
  );
}

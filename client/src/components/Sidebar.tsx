import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { Zap, LayoutDashboard, Briefcase, Calendar, FileText, Download, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

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
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({ user, onLogout, collapsed, onToggleCollapsed }: Props) {
  const { pathname } = useLocation();

  return (
    <aside
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        padding: collapsed ? '24px 12px' : '24px 20px',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'padding 0.25s ease',
      }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(93,139,255,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '16px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: '62px', height: '62px', flexShrink: 0, borderRadius: '18px', background: 'linear-gradient(135deg, rgba(124,92,255,1), rgba(93,139,255,0.9))', display: 'grid', placeItems: 'center', boxShadow: '0 18px 36px rgba(124,92,255,0.22)' }}>
          <Zap size={26} color="white" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.05em', marginBottom: '4px', whiteSpace: 'nowrap' }}>Tracksy</p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0, whiteSpace: 'nowrap' }}>Job Hunt OS</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapsed}
        style={{
          alignSelf: collapsed ? 'center' : 'flex-end',
          marginTop: '-8px',
          width: '30px',
          height: '30px',
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="nav-link"
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px' : '12px 14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'background 0.2s, transform 0.2s, padding 0.2s',
                background: active ? 'rgba(124,92,255,0.16)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-secondary)',
                border: active ? '1px solid rgba(124,92,255,0.22)' : '1px solid transparent',
                boxShadow: active ? '0 16px 32px rgba(124,92,255,0.14)' : 'none',
              }}
            >
              <span style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '14px', display: 'grid', placeItems: 'center', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)' }}>
                <Icon size={16} />
              </span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div style={{ padding: collapsed ? '14px 8px' : '20px 18px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {!collapsed && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '12px' }}>Signed in as</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div
              title={collapsed ? user.name : undefined}
              style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(124,92,255,0.4), rgba(93,139,255,0.15))', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}
            >
              {user.name?.slice(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            title={collapsed ? 'Sign out' : undefined}
            style={{ marginTop: '18px', width: '100%', padding: collapsed ? '12px 0' : '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}
          >
            {collapsed ? <LogOut size={14} style={{ margin: '0 auto' }} /> : 'Sign out'}
          </button>
        </div>
      )}
    </aside>
  );
}

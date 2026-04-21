'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Briefcase, FileText, LogOut, Zap } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/applications', icon: Briefcase, label: 'Applications' },
  { href: '/dashboard/resume', icon: FileText, label: 'Resume & AI' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch {
      // ignore
    }
  }

  return (
    <aside
      className="w-60 flex flex-col flex-shrink-0 h-screen"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          <Zap size={16} color="white" />
        </div>
        <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
          Tracksy
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: active ? 'var(--primary-muted)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--primary-border)' : '1px solid transparent',
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150 hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

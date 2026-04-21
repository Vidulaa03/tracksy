import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, LayoutDashboard, Sparkles, FileText, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated]);

  const features = [
    { icon: LayoutDashboard, title: '5-column Kanban',     desc: 'Applied → Phone Screen → Interview → Offer → Rejected. Drag cards to move them instantly.',              color: '#6366f1' },
    { icon: Sparkles,        title: 'AI Job Parser',       desc: 'Paste a job description — AI extracts company, role, salary, and generates 4 tailored resume bullets.', color: '#a78bfa' },
    { icon: FileText,        title: 'Resume Manager',      desc: 'Store multiple resume versions. Pull AI bullets into the right resume with one click.',                  color: '#34d399' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 60%)' }} />

      {/* nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={15} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px' }}>Tracksy</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/auth/login" style={{ padding: '8px 18px', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Sign in
          </Link>
          <Link to="/auth/signup" style={{ padding: '8px 18px', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: 'white', background: 'var(--primary)' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', marginBottom: '24px' }}>
          <Sparkles size={12} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>AI-powered job tracking</span>
        </div>
        <h1 style={{ fontSize: '54px', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1.5px', maxWidth: '680px', margin: '0 auto 20px' }}>
          Track every application.<br />Land faster.
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.6 }}>
          Kanban pipeline + AI job parser + resume bullet generator — all in one place.
        </p>
        <Link to="/auth/signup"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, color: 'white', background: 'var(--primary)' }}>
          Start for free <ArrowRight size={16} />
        </Link>
      </div>

      {/* features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        {features.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} style={{ padding: '28px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Icon size={20} style={{ color }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

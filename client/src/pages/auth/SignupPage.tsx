import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try   { await signup(email, name, password); navigate('/dashboard'); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Signup failed'); }
    finally { setLoading(false); }
  }

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#f0f4ff', padding: '11px 14px', width: '100%',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  const f = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
  const b = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '16px' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 60%)' }} />
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '36px 32px', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '18px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Tracksy</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Create account</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Start tracking your job search with AI</p>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px', marginBottom: '18px' }}>
            <AlertCircle size={14} />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'Full Name', type: 'text',  value: name,  set: setName,  placeholder: 'Jane Smith',        ac: 'name'  },
            { label: 'Email',     type: 'email', value: email, set: setEmail, placeholder: 'you@company.com', ac: 'email' },
          ].map(({ label, type, value, set, placeholder, ac }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>{label}</label>
              <input style={inp} type={type} value={value} onChange={(e) => set(e.target.value)}
                placeholder={placeholder} required autoComplete={ac} onFocus={f} onBlur={b} />
            </div>
          ))}
          {[
            { label: 'Password',         value: password, set: setPassword, ac: 'new-password' },
            { label: 'Confirm Password', value: confirm,  set: setConfirm,  ac: 'new-password' },
          ].map(({ label, value, set, ac }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: '44px' }}
                  type={show ? 'text' : 'password'}
                  value={value} onChange={(e) => set(e.target.value)}
                  placeholder="••••••••" required autoComplete={ac} onFocus={f} onBlur={b} />
                <button type="button" onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ marginTop: '4px', padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'var(--surface-3)' : 'var(--primary)', color: loading ? 'var(--text-muted)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

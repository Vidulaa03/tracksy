import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../../services/api';
import { JobApplication, JOB_STATUSES, getStatusConfig } from '../../types';
import ApplicationDialog from '../../components/ApplicationDialog';
import { ArrowLeft, Pencil, Trash2, ExternalLink } from 'lucide-react';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app,         setApp]         = useState<JobApplication | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [editOpen,    setEditOpen]    = useState(false);

  async function load() {
    try {
      setLoading(true);
      const r = await applicationsAPI.getById(id!);
      setApp((r.data as any).data ?? r.data);
    } catch { setError('Failed to load application'); }
    finally  { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleEditSubmit(data: Partial<JobApplication>) {
    await applicationsAPI.update(id!, data); await load();
  }

  async function handleDelete() {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id!);
    navigate('/dashboard/applications');
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>
      <div className="skeleton" style={{ height: '16px', width: '100px' }} />
      <div className="skeleton" style={{ height: '200px', borderRadius: '14px' }} />
    </div>
  );

  if (error || !app) return (
    <div style={{ padding: '24px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', color: '#f87171' }}>
      {error || 'Application not found'}
    </div>
  );

  const sc = getStatusConfig(app.status);

  const field = (label: string, value?: string) => value ? (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: 'var(--text)' }}>{value}</p>
    </div>
  ) : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>

      {/* back + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/dashboard/applications')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
          <ArrowLeft size={15} />Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            <Pencil size={13} />Edit
          </button>
          <button onClick={handleDelete}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            <Trash2 size={13} />Delete
          </button>
        </div>
      </div>

      {/* main card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{app.position}</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{app.companyName}</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '99px', background: `${sc.hex}18`, color: sc.hex }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.hex }} />
            {sc.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {field('Applied', new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}
          {field('Salary', app.salaryRange)}
          {app.jobDescriptionLink && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Job Post</p>
              <a href={app.jobDescriptionLink} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
                <ExternalLink size={13} />View posting
              </a>
            </div>
          )}
        </div>

        {app.notes && (
          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Notes</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{app.notes}</p>
          </div>
        )}

        {app.description && (
          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Job Description</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{app.description}</p>
          </div>
        )}

        {app.resumeBullets && app.resumeBullets.length > 0 && (
          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>AI Resume Bullets</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {app.resumeBullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>•</span>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ApplicationDialog open={editOpen} onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit} editApp={app} />
    </div>
  );
}

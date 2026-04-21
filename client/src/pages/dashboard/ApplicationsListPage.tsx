import { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import { JobApplication, JobStatus, JOB_STATUSES, getStatusConfig } from '../../types';
import ApplicationDialog from '../../components/ApplicationDialog';
import { Search, Plus, Briefcase, Pencil, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 150px 120px 80px',
          padding: '13px 20px', borderBottom: '1px solid var(--border)', gap: '8px', alignItems: 'center',
        }}>
          <div>
            <div className="skeleton" style={{ height: '13px', width: '60%', marginBottom: '5px' }} />
            <div className="skeleton" style={{ height: '11px', width: '40%' }} />
          </div>
          <div className="skeleton" style={{ height: '12px' }} />
          <div className="skeleton" style={{ height: '22px', width: '90px', borderRadius: '99px' }} />
          <div className="skeleton" style={{ height: '12px' }} />
          <div />
        </div>
      ))}
    </>
  );
}

export default function ApplicationsListPage() {
  const [apps,       setApps]       = useState<JobApplication[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<JobStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editApp,    setEditApp]    = useState<JobApplication | undefined>();

  async function load() {
    try {
      setLoading(true);
      const r = await applicationsAPI.getAll();
      setApps(Array.isArray(r.data) ? r.data : (r.data as any).data ?? []);
    } catch { setError('Failed to load applications'); }
    finally  { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(data: Partial<JobApplication>) {
    await applicationsAPI.create(data); await load();
  }
  async function handleEditSubmit(data: Partial<JobApplication>) {
    if (!editApp) return;
    await applicationsAPI.update(editApp._id, data); await load();
  }
  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id);
    setApps((p) => p.filter((a) => a._id !== id));
  }

  const filtered = apps.filter((a) => {
    const q = search.toLowerCase();
    return (
      (!q || a.position.toLowerCase().includes(q) || a.companyName.toLowerCase().includes(q)) &&
      (filter === 'all' || a.status === filter)
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Applications</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{apps.length} total</p>
        </div>
        <button onClick={() => { setEditApp(undefined); setDialogOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px' }}>
          <Plus size={14} />Add Application
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* search + status filter */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            style={{ paddingLeft: '36px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', outline: 'none', width: '100%', transition: 'border-color 0.15s' }}
            placeholder="Search role or company…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[{ value: 'all', label: 'All', hex: '#6366f1' }, ...JOB_STATUSES].map((s) => {
            const active = filter === s.value;
            return (
              <button key={s.value} onClick={() => setFilter(s.value as JobStatus | 'all')}
                style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', border: `1px solid ${active ? s.hex + '55' : 'var(--border)'}`, background: active ? `${s.hex}18` : 'var(--surface)', color: active ? s.hex : 'var(--text-secondary)' }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
        {/* table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 150px 120px 80px', padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          {['Role / Company', 'Applied', 'Status', 'Salary', ''].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
          ))}
        </div>

        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
            <Briefcase size={28} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {search || filter !== 'all' ? 'No matching applications' : 'No applications yet'}
            </p>
          </div>
        ) : (
          filtered.map((app, idx) => {
            const sc = getStatusConfig(app.status);
            return (
              <div key={app._id} className="trow"
                style={{ display: 'grid', gridTemplateColumns: '1fr 160px 150px 120px 80px', padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.1s' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{app.position}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.companyName}</p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: `${sc.hex}15`, color: sc.hex, width: 'fit-content' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.hex }} />
                  {sc.label}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.salaryRange || '—'}</span>
                <div className="row-actions" style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', opacity: 0, transition: 'opacity 0.15s' }}>
                  {app.jobDescriptionLink && (
                    <a href={app.jobDescriptionLink} target="_blank" rel="noreferrer"
                      style={{ padding: '5px', borderRadius: '6px', color: 'var(--text-muted)', display: 'flex' }}>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button onClick={() => { setEditApp(app); setDialogOpen(true); }}
                    style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(app._id)}
                    style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ApplicationDialog open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditApp(undefined); }}
        onSubmit={editApp ? handleEditSubmit : handleAdd} editApp={editApp} />

      <style>{`.trow:hover { background: rgba(255,255,255,0.02) !important; } .trow:hover .row-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}

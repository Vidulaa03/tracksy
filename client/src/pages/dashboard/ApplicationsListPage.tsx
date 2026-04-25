import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import ApplicationDialog from '../../components/ApplicationDialog';
import { applicationsAPI } from '../../services/api';
import { JobApplication, JobStatus, JOB_STATUSES, getStatusConfig } from '../../types';

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((index) => (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 150px 180px 110px 80px', padding: '13px 20px', borderBottom: '1px solid var(--border)', gap: '8px', alignItems: 'center' }}>
          <div>
            <div className="skeleton" style={{ height: '13px', width: '60%', marginBottom: '5px' }} />
            <div className="skeleton" style={{ height: '11px', width: '40%' }} />
          </div>
          <div className="skeleton" style={{ height: '12px' }} />
          <div className="skeleton" style={{ height: '22px', width: '90px', borderRadius: '99px' }} />
          <div className="skeleton" style={{ height: '12px' }} />
          <div className="skeleton" style={{ height: '12px' }} />
          <div />
        </div>
      ))}
    </>
  );
}

export default function ApplicationsListPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editApp, setEditApp] = useState<JobApplication | undefined>();

  async function load() {
    try {
      setLoading(true);
      const response = await applicationsAPI.getAll();
      setApps(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(data: Partial<JobApplication>) {
    await applicationsAPI.create(data);
    await load();
  }

  async function handleEditSubmit(data: Partial<JobApplication>) {
    if (!editApp) return;
    await applicationsAPI.update(editApp._id, data);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id);
    setApps((prev) => prev.filter((app) => app._id !== id));
  }

  const filtered = apps.filter((app) => {
    const query = search.toLowerCase();
    return (
      (!query ||
        app.position.toLowerCase().includes(query) ||
        app.companyName.toLowerCase().includes(query) ||
        (app.linkedResume?.title ?? '').toLowerCase().includes(query)) &&
      (filter === 'all' || app.status === filter)
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Applications</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{apps.length} total</p>
        </div>
        <button onClick={() => { setEditApp(undefined); setDialogOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px' }}>
          <Plus size={14} />
          Add Application
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            style={{ paddingLeft: '36px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', outline: 'none', width: '100%' }}
            placeholder="Search role, company, or resume..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[{ value: 'all', label: 'All', hex: '#6366f1' }, ...JOB_STATUSES].map((status) => {
            const active = filter === status.value;
            return (
              <button
                key={status.value}
                onClick={() => setFilter(status.value as JobStatus | 'all')}
                style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? `${status.hex}55` : 'var(--border)'}`, background: active ? `${status.hex}18` : 'var(--surface)', color: active ? status.hex : 'var(--text-secondary)' }}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 150px 180px 110px 80px', padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          {['Role / Company', 'Applied', 'Status', 'Resume Used', 'Salary', ''].map((header) => (
            <span key={header} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{header}</span>
          ))}
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
            <Briefcase size={28} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {search || filter !== 'all' ? 'No matching applications' : 'No applications yet'}
            </p>
          </div>
        ) : (
          filtered.map((app, index) => {
            const statusConfig = getStatusConfig(app.status);
            return (
              <div
                key={app._id}
                className="trow"
                onClick={() => navigate(`/dashboard/applications/${app._id}`)}
                style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 150px 180px 110px 80px', padding: '13px 20px', borderBottom: index < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.1s', cursor: 'pointer' }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{app.position}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.companyName}</p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: `${statusConfig.hex}15`, color: statusConfig.hex, width: 'fit-content' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusConfig.hex }} />
                  {statusConfig.label}
                </span>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text)' }}>{app.linkedResume?.title ?? 'No resume linked'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.linkedResume ? 'Exact version attached' : 'Attach the exact version used'}</p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.salaryRange || '—'}</span>
                <div className="row-actions" onClick={(event) => event.stopPropagation()} style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', opacity: 0, transition: 'opacity 0.15s' }}>
                  {app.jobDescriptionLink && (
                    <a href={app.jobDescriptionLink} target="_blank" rel="noreferrer" style={{ padding: '5px', borderRadius: '6px', color: 'var(--text-muted)', display: 'flex' }}>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button onClick={() => { setEditApp(app); setDialogOpen(true); }} style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(app._id)} style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ApplicationDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditApp(undefined); }}
        onSubmit={editApp ? handleEditSubmit : handleAdd}
        editApp={editApp}
      />

      <style>{`.trow:hover { background: rgba(255,255,255,0.02) !important; } .trow:hover .row-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}

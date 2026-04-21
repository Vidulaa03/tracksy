import { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import { JobApplication, JobStatus, JOB_STATUSES } from '../../types';
import KanbanBoard from '../../components/KanbanBoard';
import ApplicationDialog from '../../components/ApplicationDialog';
import { Plus, Briefcase, TrendingUp, PhoneCall, Star, AlertCircle } from 'lucide-react';

/* ── Skeleton loaders ──────────────────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px',
    }}>
      <div className="skeleton" style={{ height: '13px', width: '100px', marginBottom: '14px' }} />
      <div className="skeleton" style={{ height: '32px', width: '56px' }} />
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ width: '272px', minWidth: '272px' }}>
          <div className="skeleton" style={{ height: '40px', borderRadius: '10px', marginBottom: '10px' }} />
          <div className="skeleton" style={{ height: '110px', borderRadius: '12px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '88px',  borderRadius: '12px' }} />
        </div>
      ))}
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({
  label, value, color, icon: Icon,
}: {
  label: string; value: number; color: string; icon: React.ElementType;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────────────────── */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '16px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Briefcase size={24} style={{ color: 'var(--primary)' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px', fontSize: '15px' }}>No applications yet</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Add your first one to start tracking your pipeline</p>
      </div>
      <button onClick={onAdd}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px' }}>
        <Plus size={14} />Add first application
      </button>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [apps,        setApps]        = useState<JobApplication[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editApp,     setEditApp]     = useState<JobApplication | undefined>();

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
    await applicationsAPI.create(data);
    await load();
  }

  async function handleEditSubmit(data: Partial<JobApplication>) {
    if (!editApp) return;
    await applicationsAPI.update(editApp._id, data);
    await load();
  }

  // Optimistic update — persist to server, revert on failure
  async function handleStatusChange(id: string, status: JobStatus) {
    setApps((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    try   { await applicationsAPI.update(id, { status }); }
    catch { await load(); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id);
    setApps((prev) => prev.filter((a) => a._id !== id));
  }

  const stats = {
    total:      apps.length,
    active:     apps.filter((a) => !['rejected', 'offer'].includes(a.status)).length,
    interviews: apps.filter((a) => a.status === 'interview').length,
    offers:     apps.filter((a) => a.status === 'offer').length,
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Drag cards between columns to update status
          </p>
        </div>
        <button
          onClick={() => { setEditApp(undefined); setDialogOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px' }}
        >
          <Plus size={14} />Add Application
        </button>
      </div>

      {/* ── error banner ── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={14} />{error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* ── stat cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <StatCard label="Total Applied"   value={stats.total}      color="#6366f1" icon={Briefcase}  />
          <StatCard label="Active Pipeline" value={stats.active}     color="#38bdf8" icon={TrendingUp} />
          <StatCard label="Interviews"      value={stats.interviews}  color="#fbbf24" icon={PhoneCall} />
          <StatCard label="Offers"          value={stats.offers}     color="#34d399" icon={Star}       />
        </div>
      )}

      {/* ── kanban board ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '20px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '18px' }}>
          Applications Pipeline
        </h2>

        {loading ? (
          <KanbanSkeleton />
        ) : apps.length === 0 ? (
          <EmptyState onAdd={() => { setEditApp(undefined); setDialogOpen(true); }} />
        ) : (
          <KanbanBoard
            applications={apps}
            onStatusChange={handleStatusChange}
            onEdit={(app) => { setEditApp(app); setDialogOpen(true); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* ── add / edit dialog ── */}
      <ApplicationDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditApp(undefined); }}
        onSubmit={editApp ? handleEditSubmit : handleAdd}
        editApp={editApp}
      />
    </div>
  );
}

console.log("Dashboard loaded");
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { applicationsAPI } from '@/services/api';
import { JobApplication, JobStatus } from '@/types';
import KanbanBoard from '@/components/KanbanBoard';
import AddApplicationDialog from '@/components/AddApplicationDialog';
import { LayoutDashboard, Plus, Briefcase, PhoneCall, TrendingUp, Star, AlertCircle } from 'lucide-react';

function StatSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-8 w-12 rounded" />
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editApp, setEditApp] = useState<JobApplication | undefined>();

  async function load() {
    try {
      setIsLoading(true);
      const res = await applicationsAPI.getAll();
      setApps(res.data);
    } catch {
      setError('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
    console.log("API Response:", res.data);
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

  async function handleStatusChange(id: string, status: JobStatus) {
    setApps((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    try {
      await applicationsAPI.update(id, { status });
    } catch {
      await load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id);
    setApps((prev) => prev.filter((a) => a._id !== id));
  }

  const stats = {
    total: apps.length,
    active: apps.filter((a) => !['rejected', 'offer'].includes(a.status)).length,
    interviews: apps.filter((a) => a.status === 'interview').length,
    offers: apps.filter((a) => a.status === 'offer').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={22} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Drag cards between columns to update status
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditApp(undefined); setAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          <Plus size={15} /> Add Application
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
          <AlertCircle size={15} />{error}
        </div>
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Applied" value={stats.total} color="#6366f1" icon={Briefcase} />
          <StatCard label="Active Pipeline" value={stats.active} color="#38bdf8" icon={TrendingUp} />
          <StatCard label="Interviews" value={stats.interviews} color="#fbbf24" icon={PhoneCall} />
          <StatCard label="Offers" value={stats.offers} color="#34d399" icon={Star} />
        </div>
      )}

      {/* Kanban */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text)' }}>Applications Pipeline</h2>

        {isLoading ? (
          <div className="flex gap-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex-shrink-0" style={{ width: '264px' }}>
                <div className="skeleton h-10 rounded-xl mb-2" />
                <div className="space-y-2">
                  <div className="skeleton h-28 rounded-xl" />
                  <div className="skeleton h-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary-muted)', border: '1px solid var(--primary-border)' }}>
              <Briefcase size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-center">
              <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>No applications yet</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add your first application to start tracking</p>
            </div>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--primary)', color: 'white' }}>
              <Plus size={14} /> Add first application
            </button>
          </div>
        ) : (
          <KanbanBoard
            applications={apps}
            onStatusChange={handleStatusChange}
            onEdit={(app) => { setEditApp(app); setAddOpen(true); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AddApplicationDialog
        open={addOpen}
        onOpenChange={(o) => { setAddOpen(o); if (!o) setEditApp(undefined); }}
        onSubmit={editApp ? handleEditSubmit : handleAdd}
        editApplication={editApp}
      />
    </div>
  );
}

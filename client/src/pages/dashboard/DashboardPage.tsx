import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, Briefcase, FileText, Link2, PhoneCall, Plus } from 'lucide-react';

import KanbanBoard from '../../components/KanbanBoard';
import ApplicationDialog from '../../components/ApplicationDialog';
import ScheduleStageModal from '../../components/ScheduleStageModal';
import { applicationsAPI } from '../../services/api';
import { ApplicationEvent, JobApplication, JobStatus } from '../../types';

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', padding: '22px', boxShadow: '0 18px 48px rgba(0,0,0,0.22)' }}>
      <div style={{ position: 'absolute', inset: 'auto -40px -40px auto', width: '120px', height: '120px', background: `${accent}18`, filter: 'blur(20px)', borderRadius: '999px' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
          <p style={{ fontSize: '34px', fontWeight: 900, color: 'var(--text)', marginTop: '8px', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>{helper}</p>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '16px', background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

function mapStatusToStage(status: JobStatus): ApplicationEvent['stage'] | null {
  if (status === 'phone_screen') return 'Phone Screen';
  if (status === 'interview') return 'Interview';
  if (status === 'offer') return 'Offer';
  return null;
}

export default function DashboardPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editApp, setEditApp] = useState<JobApplication | undefined>();
  const [scheduleState, setScheduleState] = useState<{ appId: string; stage: ApplicationEvent['stage']; companyName: string; position: string } | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);

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

  async function handleStatusChange(id: string, status: JobStatus) {
    const target = apps.find((app) => app._id === id);
    setApps((prev) => prev.map((app) => (app._id === id ? { ...app, status } : app)));
    try {
      await applicationsAPI.update(id, { status });
      const stage = mapStatusToStage(status);
      if (stage && target) {
        setScheduleState({ appId: id, stage, companyName: target.companyName, position: target.position });
      }
      await load();
    } catch {
      await load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id);
    setApps((prev) => prev.filter((app) => app._id !== id));
  }

  const stats = useMemo(() => {
    const total = apps.length;
    const linked = apps.filter((app) => !!app.linkedResumeId).length;
    const offers = apps.filter((app) => app.status === 'offer').length;
    const responseRate = total ? Math.round(((apps.filter((app) => ['phone_screen', 'interview', 'offer'].includes(app.status)).length) / total) * 100) : 0;
    return { total, linked, offers, responseRate };
  }, [apps]);

  const mostUsedResume = apps.reduce<Record<string, number>>((acc, app) => {
    if (app.linkedResume?.title) acc[app.linkedResume.title] = (acc[app.linkedResume.title] ?? 0) + 1;
    return acc;
  }, {});
  const topResume = Object.entries(mostUsedResume).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pipeline command center</p>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text)', marginTop: '6px' }}>Everything you need to land your next role</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '700px' }}>Track applications, manage interviews, and stay organized from one powerful dashboard.</p>
          </div>
          <button onClick={() => { setEditApp(undefined); setDialogOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '16px', border: '1px solid rgba(129,140,248,0.22)', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', fontWeight: 800, fontSize: '13px', boxShadow: '0 16px 40px rgba(99,102,241,0.22)' }}>
            <Plus size={14} />
            Add Application
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}>
          <StatCard label="Total Applied" value={stats.total} helper="All tracked applications" icon={Briefcase} accent="#8b5cf6" />
          <StatCard label="Resume Linked" value={stats.linked} helper="Exact variants attached" icon={Link2} accent="#38bdf8" />
          <StatCard label="Offers" value={stats.offers} helper="Final-stage wins in pipeline" icon={PhoneCall} accent="#34d399" />
          <StatCard label="Response Rate" value={`${stats.responseRate}%`} helper={topResume ? `${topResume[0]} leads usage` : 'Track which resume converts'} icon={FileText} accent="#f97316" />
        </div>

        <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px', boxShadow: '0 18px 48px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>Applications Pipeline</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Sticky columns, smoother drag states, and stage scheduling prompts when you move cards.</p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <ArrowUpRight size={13} />
                Drag to progress
              </div>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: '580px', borderRadius: '18px' }} />
            ) : apps.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 20px', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={26} style={{ color: '#c4b5fd' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '6px', fontSize: '17px' }}>No applications yet</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Add your first one and start attaching resumes plus real interview dates.</p>
                </div>
              </div>
            ) : (
              <KanbanBoard
                applications={apps}
                onStatusChange={handleStatusChange}
                onEdit={(app) => { setEditApp(app); setDialogOpen(true); }}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        <ApplicationDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditApp(undefined); }}
          onSubmit={editApp ? handleEditSubmit : handleAdd}
          editApp={editApp}
        />

      <ScheduleStageModal
        open={!!scheduleState}
        stage={scheduleState?.stage ?? 'Interview'}
        companyName={scheduleState?.companyName}
        position={scheduleState?.position}
        saving={scheduleSaving}
        onClose={() => setScheduleState(null)}
        onSkip={() => setScheduleState(null)}
        onSave={async (event) => {
          if (!scheduleState) return;
          setScheduleSaving(true);
          try {
            const app = apps.find((item) => item._id === scheduleState.appId);
            const nextEvents = [...(app?.events ?? [])];
            nextEvents.push(event);
            await applicationsAPI.update(scheduleState.appId, { events: nextEvents });
            setScheduleState(null);
            await load();
          } finally {
            setScheduleSaving(false);
          }
        }}
      />
    </>
  );
}

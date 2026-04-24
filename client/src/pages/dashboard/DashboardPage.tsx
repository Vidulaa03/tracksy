import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, Briefcase, CalendarClock, FileText, Link2, PhoneCall, Plus } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
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
    <div style={{ position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '22px', padding: '18px', boxShadow: '0 22px 56px rgba(0,0,0,0.16)', minHeight: '170px' }}>
      <div style={{ position: 'absolute', inset: 'auto -32px -32px auto', width: '96px', height: '96px', background: `${accent}16`, filter: 'blur(22px)', borderRadius: '999px' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>{label}</p>
          <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text)', marginTop: '10px', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>{helper}</p>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '16px', background: `rgba(255,255,255,0.06)`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
      <div style={{ marginTop: '18px', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(typeof value === 'number' ? value : 70, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.14))` }} />
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
  const { user } = useAuth();
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const stats = useMemo(() => {
    const total = apps.length;
    const linked = apps.filter((app) => !!app.linkedResumeId).length;
    const offers = apps.filter((app) => app.status === 'offer').length;
    const upcoming = apps.flatMap((app) => (app.events ?? [])
      .filter((event) => {
        const when = new Date(event.scheduledAt).getTime();
        const now = Date.now();
        const in7Days = now + 7 * 24 * 60 * 60 * 1000;
        return when >= now && when <= in7Days;
      })
      .map(() => app._id)).length;
    const responseRate = total ? Math.round(((apps.filter((app) => ['phone_screen', 'interview', 'offer'].includes(app.status)).length) / total) * 100) : 0;
    return { total, linked, upcoming, offers, responseRate };
  }, [apps]);

  const mostUsedResume = apps.reduce<Record<string, number>>((acc, app) => {
    if (app.linkedResume?.title) acc[app.linkedResume.title] = (acc[app.linkedResume.title] ?? 0) + 1;
    return acc;
  }, {});
  const topResume = Object.entries(mostUsedResume).sort((a, b) => b[1] - a[1])[0];

  const nameLabel = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{greeting}, {nameLabel}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '12px' }}>Your hiring dashboard is ready</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '720px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: '14px' }}>Pipeline command center</p>
              <h1 style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text)', lineHeight: 1.05, marginTop: 0, maxWidth: '680px' }}>Everything you need to land your next role</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '14px', maxWidth: '680px', lineHeight: 1.75 }}>Track applications, manage interviews, and stay organized from one powerful dashboard.</p>
            </div>
            <button onClick={() => { setEditApp(undefined); setDialogOpen(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', background: 'linear-gradient(135deg, #7c5cff, #5d8bff)', color: 'white', fontWeight: 800, fontSize: '13px', boxShadow: '0 18px 42px rgba(124,92,255,0.28)' }}>
              <Plus size={15} />
              Add Application
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '18px' }}>
          <StatCard label="Total Applied" value={stats.total} helper="All tracked applications" icon={Briefcase} accent="#7c5cff" />
          <StatCard label="Resume Linked" value={stats.linked} helper="Exact variants attached" icon={Link2} accent="#00e5ff" />
          <StatCard label="Upcoming" value={stats.upcoming} helper="Events in next 7 days" icon={CalendarClock} accent="#f59e0b" />
          <StatCard label="Offers" value={stats.offers} helper="Final-stage wins in pipeline" icon={PhoneCall} accent="#22c55e" />
          <StatCard label="Response Rate" value={`${stats.responseRate}%`} helper={topResume ? `${topResume[0]} leads usage` : 'Track which resume converts'} icon={FileText} accent="#ff4d9d" />
        </div>

        <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', padding: '18px', boxShadow: '0 16px 40px rgba(0,0,0,0.16)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>Applications Pipeline</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.6 }}>Sticky columns, smoother drag states, and stage scheduling prompts when you move cards.</p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <ArrowUpRight size={12} />
                Drag to progress
              </div>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: '520px', borderRadius: '18px' }} />
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

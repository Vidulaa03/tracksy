import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin    from '@fullcalendar/daygrid';
import timeGridPlugin   from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin       from '@fullcalendar/list';
import { EventClickArg, DateSelectArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { applicationsAPI } from '@/services/api';
import { JobApplication, JOB_STATUSES, getStatusConfig } from '@/types';
import { X, Calendar, Briefcase, Clock, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ── Map applications → FullCalendar events ───────────────────────────────────
function appToEvent(app: JobApplication): EventInput {
  const sc    = getStatusConfig(app.status);
  const alpha = app.status === 'rejected' ? '60' : 'ff';
  return {
    id:              app._id,
    title:           `${app.companyName} — ${app.position}`,
    start:           app.appliedDate,
    allDay:          true,
    backgroundColor: sc.hex + alpha,
    borderColor:     sc.hex,
    textColor:       '#f0f4ff',
    extendedProps:   { app },
  };
}

// ── Event Detail Modal ────────────────────────────────────────────────────────
function EventModal({
  app, onClose, onStatusChange,
}: {
  app:            JobApplication;
  onClose:        () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const sc = getStatusConfig(app.status);
  const [saving, setSaving] = useState(false);

  async function changeStatus(status: string) {
    setSaving(true);
    try   { await onStatusChange(app._id, status); onClose(); }
    catch {}
    finally { setSaving(false); }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div style={{ width: 'min(460px, 95vw)', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '16px', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
        {/* header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {app.position}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{app.companyName}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px', borderRadius: '6px', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* status + date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Status</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: `${sc.hex}18`, color: sc.hex }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.hex }} />
                {sc.label}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Applied</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {app.salaryRange && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Salary</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{app.salaryRange}</p>
            </div>
          )}

          {app.notes && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Notes</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{app.notes}</p>
            </div>
          )}

          {/* update status */}
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Update Status</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {JOB_STATUSES.map((s) => {
                const isActive = app.status === s.value;
                return (
                  <button key={s.value}
                    onClick={() => !isActive && changeStatus(s.value)}
                    disabled={isActive || saving}
                    style={{
                      padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                      cursor: isActive ? 'default' : 'pointer', transition: 'all 0.12s',
                      background: isActive ? `${s.hex}25` : 'var(--surface-3)',
                      color:      isActive ? s.hex : 'var(--text-secondary)',
                      border:     `1px solid ${isActive ? s.hex + '60' : 'var(--border)'}`,
                      opacity:    saving ? 0.6 : 1,
                    }}>
                    {isActive && <CheckCircle size={10} style={{ display: 'inline', marginRight: '4px' }} />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {app.jobDescriptionLink && (
            <a href={app.jobDescriptionLink} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              <ExternalLink size={13} />View job posting
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar Page ────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [apps,         setApps]         = useState<JobApplication[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedApp,  setSelectedApp]  = useState<JobApplication | null>(null);
  const [error,        setError]        = useState('');
  const calRef = useRef<FullCalendar>(null);

  async function load() {
    try {
      setLoading(true);
      const r = await applicationsAPI.getAll();
      const data = Array.isArray(r.data) ? r.data : (r.data as any).data ?? [];
      setApps(data);
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleEventClick(info: EventClickArg) {
    const app = info.event.extendedProps.app as JobApplication;
    setSelectedApp(app);
  }

  async function handleEventDrop(info: EventDropArg) {
    const app       = info.event.extendedProps.app as JobApplication;
    const newDate   = info.event.start;
    if (!newDate) return;
    try {
      await applicationsAPI.update(app._id, { appliedDate: newDate.toISOString() });
      await load();
    } catch {
      info.revert();
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await applicationsAPI.update(id, { status: status as any });
    await load();
  }

  const events = apps.map(appToEvent);

  // stats
  const counts = JOB_STATUSES.map((s) => ({
    ...s,
    count: apps.filter((a) => a.status === s.value).length,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Calendar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All applications on a timeline · drag to reschedule</p>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* status legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {counts.map((s) => (
          <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', background: `${s.hex}12`, border: `1px solid ${s.hex}28` }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.hex, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: s.hex }}>{s.label}</span>
            <span style={{ fontSize: '11px', color: s.hex, opacity: 0.7 }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* calendar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', minHeight: '600px', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,22,35,0.6)', zIndex: 10, borderRadius: '16px' }}>
            <Loader2 size={28} style={{ color: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,listMonth',
          }}
          events={events}
          editable
          selectable
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="auto"
          dayMaxEvents={3}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
        />
      </div>

      {selectedApp && (
        <EventModal app={selectedApp} onClose={() => setSelectedApp(null)} onStatusChange={handleStatusChange} />
      )}

      {/* FullCalendar dark-theme overrides */}
      <style>{`
        .fc { color: var(--text); font-family: 'DM Sans', sans-serif; }
        .fc-toolbar-title { font-size: 16px !important; font-weight: 700; color: var(--text); }
        .fc-button { background: var(--surface-2) !important; border: 1px solid var(--border-strong) !important; color: var(--text-secondary) !important; font-size: 12px !important; font-weight: 600 !important; padding: 6px 14px !important; border-radius: 8px !important; box-shadow: none !important; }
        .fc-button:hover { background: var(--surface-3) !important; color: var(--text) !important; }
        .fc-button-active, .fc-button-primary:not(:disabled):active { background: var(--primary-muted) !important; border-color: var(--primary-border) !important; color: var(--primary) !important; }
        .fc-button-group .fc-button { border-radius: 0 !important; }
        .fc-button-group .fc-button:first-child { border-radius: 8px 0 0 8px !important; }
        .fc-button-group .fc-button:last-child  { border-radius: 0 8px 8px 0 !important; }
        .fc td, .fc th { border-color: var(--border) !important; }
        .fc-theme-standard .fc-scrollgrid { border-color: var(--border) !important; }
        .fc-col-header-cell { background: var(--surface-2) !important; padding: 8px 0 !important; }
        .fc-col-header-cell-cushion { font-size: 12px; font-weight: 700; color: var(--text-muted) !important; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: none !important; }
        .fc-daygrid-day { background: transparent !important; }
        .fc-daygrid-day:hover { background: rgba(255,255,255,0.02) !important; }
        .fc-day-today { background: var(--primary-muted) !important; }
        .fc-daygrid-day-number { color: var(--text-secondary) !important; font-size: 13px; text-decoration: none !important; }
        .fc-day-today .fc-daygrid-day-number { color: var(--primary) !important; font-weight: 700; }
        .fc-event { border-radius: 6px !important; padding: 2px 6px !important; font-size: 11px !important; font-weight: 600 !important; border: none !important; cursor: pointer !important; }
        .fc-event:hover { filter: brightness(1.15); }
        .fc-more-link { color: var(--text-muted) !important; font-size: 11px !important; font-weight: 600 !important; }
        .fc-list-event:hover td { background: var(--surface-2) !important; }
        .fc-list-day-cushion { background: var(--surface-2) !important; }
        .fc-list-day-text, .fc-list-day-side-text { color: var(--text-secondary) !important; font-weight: 700 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

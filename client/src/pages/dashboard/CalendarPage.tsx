import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { AlertCircle, CalendarClock, Loader2 } from 'lucide-react';

import ScheduleStageModal from '@/components/ScheduleStageModal';
import { applicationsAPI } from '@/services/api';
import { ApplicationEvent, JobApplication, JOB_STATUSES } from '@/types';

type CalendarEventPayload = {
  appId: string;
  companyName: string;
  position: string;
  eventIndex: number;
  event: ApplicationEvent;
};

function stageColor(stage: ApplicationEvent['stage']) {
  if (stage === 'Phone Screen') return '#a78bfa';
  if (stage === 'Interview') return '#fbbf24';
  if (stage === 'Offer') return '#34d399';
  return '#38bdf8';
}

function appEventsToCalendar(app: JobApplication): EventInput[] {
  return (app.events ?? []).map((event, eventIndex) => ({
    id: `${app._id}-${eventIndex}`,
    title: `${app.companyName} — ${event.title}`,
    start: event.scheduledAt,
    allDay: false,
    backgroundColor: stageColor(event.stage),
    borderColor: stageColor(event.stage),
    textColor: '#0b1020',
    extendedProps: {
      appId: app._id,
      companyName: app.companyName,
      position: app.position,
      eventIndex,
      event,
    } satisfies CalendarEventPayload,
  }));
}

export default function CalendarPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<CalendarEventPayload | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const calRef = useRef<FullCalendar>(null);

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

  const calendarEvents = useMemo(() => apps.flatMap(appEventsToCalendar), [apps]);
  const upcoming = useMemo(() => {
    return apps
      .flatMap((app) => (app.events ?? []).map((event, eventIndex) => ({ appId: app._id, companyName: app.companyName, position: app.position, eventIndex, event })))
      .filter((item) => +new Date(item.event.scheduledAt) >= Date.now())
      .sort((a, b) => +new Date(a.event.scheduledAt) - +new Date(b.event.scheduledAt))
      .slice(0, 10);
  }, [apps]);

  function handleEventClick(info: EventClickArg) {
    setSelected(info.event.extendedProps as CalendarEventPayload);
  }

  async function updateApplicationEvent(payload: CalendarEventPayload, nextEvent: ApplicationEvent) {
    const app = apps.find((item) => item._id === payload.appId);
    if (!app) return;
    const nextEvents = [...(app.events ?? [])];
    nextEvents[payload.eventIndex] = nextEvent;
    await applicationsAPI.update(payload.appId, { events: nextEvents });
  }

  async function handleEventDrop(info: EventDropArg) {
    const payload = info.event.extendedProps as CalendarEventPayload;
    if (!info.event.start) return;
    try {
      await updateApplicationEvent(payload, {
        ...payload.event,
        scheduledAt: info.event.start.toISOString(),
      });
      await load();
    } catch {
      info.revert();
    }
  }

  const counts = JOB_STATUSES.map((status) => ({
    ...status,
    count: apps.filter((app) => app.status === status.value).length,
  }));

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Calendar sync</p>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text)', marginTop: '6px' }}>Scheduled stage dates</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '760px' }}>Every phone screen, interview round, and offer call now lives on the calendar with drag-to-reschedule and a clean upcoming panel.</p>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.38fr 0.62fr', gap: '18px', alignItems: 'start' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px', minHeight: '720px', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,22,0.6)', zIndex: 10, borderRadius: '24px' }}>
                <Loader2 size={28} style={{ color: '#c4b5fd', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek',
              }}
              events={calendarEvents}
              editable
              selectable
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              height="auto"
              dayMaxEvents={4}
              nowIndicator
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.12), rgba(139,92,246,0.03))', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '24px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '15px', background: 'rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarClock size={18} style={{ color: '#c4b5fd' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Upcoming panel</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', marginTop: '4px' }}>{upcoming.length} upcoming events</h3>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {upcoming.length === 0 ? (
                  <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    No scheduled stage events yet. Move a card into phone screen, interview, or offer to start syncing dates here.
                  </div>
                ) : (
                  upcoming.map((item) => (
                    <button key={`${item.appId}-${item.eventIndex}`} type="button" onClick={() => setSelected(item)} style={{ textAlign: 'left', padding: '13px 14px', borderRadius: '16px', background: 'rgba(10,14,22,0.42)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{item.companyName} — {item.event.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.position}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{new Date(item.event.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '18px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pipeline status legend</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {counts.map((status) => (
                  <div key={status.value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: status.hex, display: 'block' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{status.label}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: status.hex }}>{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .fc {
            color: var(--text);
            font-family: 'DM Sans', sans-serif;
          }
          .fc-toolbar-title {
            font-size: 18px !important;
            font-weight: 800 !important;
            color: var(--text);
          }
          .fc-button {
            background: rgba(255,255,255,0.04) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            color: var(--text-secondary) !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            padding: 8px 14px !important;
            border-radius: 12px !important;
            box-shadow: none !important;
          }
          .fc-button:hover {
            background: rgba(255,255,255,0.07) !important;
            color: var(--text) !important;
          }
          .fc-button-active, .fc-button-primary:not(:disabled):active {
            background: rgba(124,58,237,0.18) !important;
            border-color: rgba(124,58,237,0.3) !important;
            color: #c4b5fd !important;
          }
          .fc td, .fc th, .fc-theme-standard .fc-scrollgrid {
            border-color: rgba(255,255,255,0.06) !important;
          }
          .fc-col-header-cell {
            background: rgba(255,255,255,0.03) !important;
            padding: 10px 0 !important;
          }
          .fc-col-header-cell-cushion {
            font-size: 11px;
            font-weight: 800;
            color: var(--text-muted) !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-decoration: none !important;
          }
          .fc-daygrid-day {
            background: rgba(255,255,255,0.015) !important;
          }
          .fc-daygrid-day:hover {
            background: rgba(255,255,255,0.03) !important;
          }
          .fc-day-today {
            background: rgba(124,58,237,0.1) !important;
          }
          .fc-daygrid-day-number {
            color: var(--text-secondary) !important;
            font-size: 13px;
            text-decoration: none !important;
          }
          .fc-day-today .fc-daygrid-day-number {
            color: #c4b5fd !important;
            font-weight: 800;
          }
          .fc-event {
            border-radius: 10px !important;
            padding: 4px 8px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            border: none !important;
            cursor: pointer !important;
            box-shadow: 0 10px 20px rgba(0,0,0,0.18);
          }
          .fc-list-event:hover td {
            background: rgba(255,255,255,0.04) !important;
          }
          .fc-list-day-cushion {
            background: rgba(255,255,255,0.03) !important;
          }
        `}</style>
      </div>

      <ScheduleStageModal
        open={!!selected}
        stage={selected?.event.stage ?? 'Interview'}
        initialEvent={selected?.event}
        companyName={selected?.companyName}
        position={selected?.position}
        saving={savingSchedule}
        onClose={() => setSelected(null)}
        onSave={async (event) => {
          if (!selected) return;
          setSavingSchedule(true);
          try {
            await updateApplicationEvent(selected, event);
            setSelected(null);
            await load();
          } finally {
            setSavingSchedule(false);
          }
        }}
      />
    </>
  );
}

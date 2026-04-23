import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Loader2, StickyNote, X } from 'lucide-react';

import { ApplicationEvent } from '@/types';

interface Props {
  open: boolean;
  stage: ApplicationEvent['stage'];
  initialEvent?: Partial<ApplicationEvent> | null;
  companyName?: string;
  position?: string;
  saving?: boolean;
  onClose: () => void;
  onSkip?: () => void;
  onSave: (event: ApplicationEvent) => Promise<void> | void;
}

const DEFAULT_TITLES: Record<ApplicationEvent['stage'], string> = {
  'Phone Screen': 'Phone Screen',
  Interview: 'Round 1 Interview',
  Offer: 'Offer Call',
  Custom: 'Follow-up Event',
};

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function toTimeInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function ScheduleStageModal({
  open,
  stage,
  initialEvent,
  companyName,
  position,
  saving = false,
  onClose,
  onSkip,
  onSave,
}: Props) {
  const [title, setTitle] = useState(DEFAULT_TITLES[stage]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(initialEvent?.title || DEFAULT_TITLES[stage]);
    setDate(toDateInput(initialEvent?.scheduledAt));
    setTime(toTimeInput(initialEvent?.scheduledAt) || '10:00');
    setNotes(initialEvent?.notes || '');
  }, [open, stage, initialEvent]);

  if (!open) return null;

  async function handleSave() {
    if (!date || !time || !title.trim()) return;
    const scheduledAt = new Date(`${date}T${time}:00`);
    await onSave({
      stage,
      title: title.trim(),
      scheduledAt: scheduledAt.toISOString(),
      notes: notes.trim(),
    });
  }

  return (
    <div
      onClick={(event) => event.target === event.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3,8,18,0.72)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          width: 'min(460px, 94vw)',
          background: 'linear-gradient(180deg, rgba(23,31,48,0.98), rgba(13,19,31,0.98))',
          border: '1px solid rgba(139, 92, 246, 0.22)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          borderRadius: '20px',
          overflow: 'hidden',
          animation: 'fadeIn 0.18s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Schedule this stage?</p>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stage}</h3>
            {(companyName || position) && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {[companyName, position].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'var(--text)', padding: '12px 14px', fontSize: '14px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <CalendarDays size={12} />
                Date
              </label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'var(--text)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <Clock3 size={12} />
                Time
              </label>
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'var(--text)', padding: '12px 14px', fontSize: '14px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <StickyNote size={12} />
              Notes
            </label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Interview panel, recruiter name, meeting link..." style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)', borderRadius: '12px', color: 'var(--text)', padding: '12px 14px', fontSize: '14px', lineHeight: 1.5 }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '16px 20px 20px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onSkip ?? onClose} style={{ padding: '11px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
            Skip for now
          </button>
          <button onClick={handleSave} disabled={saving || !date || !time || !title.trim()} style={{ minWidth: '150px', padding: '11px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save stage
          </button>
        </div>
      </div>
    </div>
  );
}

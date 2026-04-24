import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  JobApplication, JobStatus, JOB_STATUSES, getStatusConfig,
} from '../types';
import {
  GripVertical, Pencil, Trash2, Building2, Calendar, ExternalLink, FileText,
} from 'lucide-react';

/* ─────────────────────── helpers ─────────────────────────────────────────── */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─────────────────────── AppCard ─────────────────────────────────────────── */
interface CardProps {
  app: JobApplication;
  onEdit:   (a: JobApplication) => void;
  onDelete: (id: string) => void;
  overlay?: boolean;
}

function AppCard({ app, onEdit, onDelete, overlay = false }: CardProps) {
  const sc = getStatusConfig(app.status);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: app._id, data: { status: app.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
    >
      <div
        className="kcard"
        style={{
          background:    overlay ? 'rgba(23,31,48,0.98)' : 'linear-gradient(180deg, rgba(22,30,46,0.98), rgba(15,22,35,0.98))',
          border:        `1px solid ${overlay ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius:  '18px',
          padding:       '14px',
          boxShadow:     overlay ? '0 20px 56px rgba(0,0,0,0.7)' : '0 12px 24px rgba(0,0,0,0.16)',
          transform:     overlay ? 'rotate(2deg) scale(1.02)' : undefined,
          cursor:        'default',
          position:      'relative',
          transition:    'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {/* status badge + drag grip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 700, padding: '5px 10px', borderRadius: '999px',
            background: `${sc.hex}18`, color: sc.hex, textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sc.hex }} />
            {sc.label}
          </span>
          <button
            {...attributes} {...listeners}
            className="drag-handle"
            style={{
              opacity: 0, background: 'none', border: 'none', cursor: 'grab',
              padding: '2px', marginRight: '-2px', marginTop: '-2px', color: 'var(--text-muted)', borderRadius: '8px',
              touchAction: 'none', display: 'flex', transition: 'opacity 0.15s',
            }}
          >
            <GripVertical size={14} />
          </button>
        </div>

        {/* role */}
        <p style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text)', lineHeight: 1.3, marginBottom: '4px' }}>
          {app.position}
        </p>

        {/* company */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>{app.companyName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{app.companyName}</p>
          </div>
        </div>

        {/* notes preview */}
        {app.notes && (
          <p style={{
            fontSize: '12px', color: 'var(--text-muted)',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: '10px', paddingBottom: '10px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {app.notes}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
            {app.linkedResume?.title ? 'Resume attached' : 'No resume linked'}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
            Applied {fmtDate(app.appliedDate)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-actions" style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.15s' }}>
            {app.jobDescriptionLink && (
              <a
                href={app.jobDescriptionLink} target="_blank" rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ padding: '7px', borderRadius: '10px', color: 'var(--text-muted)', display: 'flex', background: 'rgba(255,255,255,0.04)' }}
              >
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(app); }}
              style={{ padding: '7px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(app._id); }}
              style={{ padding: '7px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* scoped hover styles */}
      <style>{`
        .kcard:hover .drag-handle  { opacity: 1 !important; }
        .kcard:hover .card-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

/* ─────────────────────── KanbanColumn ────────────────────────────────────── */
interface ColProps {
  status:   typeof JOB_STATUSES[number];
  apps:     JobApplication[];
  onEdit:   (a: JobApplication) => void;
  onDelete: (id: string) => void;
}

function KanbanColumn({ status, apps, onEdit, onDelete }: ColProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });

  return (
    <div style={{ width: '278px', minWidth: '278px', display: 'flex', flexDirection: 'column' }}>
      {/* column header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderRadius: '16px', marginBottom: '10px',
        background: `${status.hex}12`, border: `1px solid ${status.hex}28`,
        position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.hex, display: 'block' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: status.hex }}>{status.label}</span>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
          background: `${status.hex}22`, color: status.hex,
        }}>
          {apps.length}
        </span>
      </div>

      {/* droppable zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, minHeight: '240px', padding: '8px', borderRadius: '18px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: isOver ? `${status.hex}10` : 'rgba(255,255,255,0.018)',
          border:     `1px solid ${isOver ? status.hex + '55' : 'rgba(255,255,255,0.04)'}`,
          transition: 'all 0.15s',
        }}
      >
        <SortableContext items={apps.map((a) => a._id)} strategy={verticalListSortingStrategy}>
          {apps.length === 0 ? (
            <div style={{
              height: '100px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)',
            }}>
              <span style={{ fontSize: '20px', opacity: 0.25 }}>○</span>
              <span style={{ fontSize: '11px' }}>Drop here</span>
            </div>
          ) : (
            apps.map((app) => (
              <AppCard key={app._id} app={app} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

/* ─────────────────────── KanbanBoard (main export) ──────────────────────── */
interface BoardProps {
  applications:   JobApplication[];
  onStatusChange: (id: string, newStatus: JobStatus) => Promise<void>;
  onEdit:         (app: JobApplication) => void;
  onDelete:       (id: string) => void;
}

export default function KanbanBoard({ applications, onStatusChange, onEdit, onDelete }: BoardProps) {
  const [local, setLocal]   = useState<JobApplication[]>(applications);
  const [active, setActive] = useState<JobApplication | null>(null);

  // keep local state in sync when parent refreshes
  const parentKey = applications.map((a) => a._id + a.status).join();
  const localKey  = local.map((a) => a._id + a.status).join();
  if (parentKey !== localKey) setLocal(applications);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active: a }: DragStartEvent) {
    setActive(local.find((x) => x._id === a.id) ?? null);
  }

  function handleDragOver({ active: a, over }: DragOverEvent) {
    if (!over) return;
    const overId = String(over.id);
    // over.id is either a column (status value) or another card's _id
    const isColumn  = JOB_STATUSES.some((s) => s.value === overId);
    const newStatus = isColumn
      ? (overId as JobStatus)
      : (local.find((x) => x._id === overId)?.status ?? 'applied');

    setLocal((prev) =>
      prev.map((x) =>
        x._id === a.id && x.status !== newStatus ? { ...x, status: newStatus } : x
      )
    );
  }

  async function handleDragEnd({ active: a, over }: DragEndEvent) {
  setActive(null);

  if (!over) return;

  const moved = local.find((x) => x._id === a.id);
  if (!moved) return;

  const newStatus = String(over.id) as JobStatus;

  if (moved.status !== newStatus) {
    const updated = local.map((x) =>
      x._id === a.id ? { ...x, status: newStatus } : x
    );

    setLocal(updated);

    try {
      await onStatusChange(String(a.id), newStatus);
    } catch {
      setLocal(local);
    }
  }
}

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '560px' }}>
        {JOB_STATUSES.map((s) => (
          <KanbanColumn
            key={s.value}
            status={s}
            apps={local.filter((a) => a.status === s.value)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {active
          ? <AppCard app={active} onEdit={() => {}} onDelete={() => {}} overlay />
          : null
        }
      </DragOverlay>
    </DndContext>
  );
}

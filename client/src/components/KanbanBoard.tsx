import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JobApplication, JobStatus, JOB_STATUSES, getStatusConfig } from '@/types';
import { GripVertical, Pencil, Trash2, Building2, Calendar, ExternalLink } from 'lucide-react';

// ── Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  app: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  isDragOverlay?: boolean;
}

function AppCard({ app, onEdit, onDelete, isDragOverlay }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app._id,
    data: { status: app.status, app },
  });

  const sc = getStatusConfig(app.status);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="group rounded-xl p-3.5 transition-all duration-150 animate-fade-in"
        style={{
          background: isDragOverlay ? 'var(--surface-3)' : 'var(--surface-2)',
          border: `1px solid ${isDragOverlay ? 'rgba(99,102,241,0.4)' : 'var(--border-strong)'}`,
          boxShadow: isDragOverlay ? '0 12px 40px rgba(0,0,0,0.6)' : 'var(--shadow-sm)',
          transform: isDragOverlay ? 'rotate(2deg)' : undefined,
          cursor: 'default',
        }}
      >
        {/* Status badge + drag grip */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${sc.hex}18`, color: sc.hex }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.hex }} />
            {sc.label}
          </span>
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity cursor-grab active:cursor-grabbing"
            style={{ color: 'var(--text-muted)', touchAction: 'none' }}
          >
            <GripVertical size={14} />
          </button>
        </div>

        {/* Role */}
        <p className="font-semibold text-sm leading-snug mb-0.5" style={{ color: 'var(--text)' }}>
          {app.position}
        </p>

        {/* Company */}
        <div className="flex items-center gap-1 mb-3">
          <Building2 size={11} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{app.companyName}</span>
        </div>

        {/* Notes preview */}
        {app.notes && (
          <p
            className="text-xs line-clamp-2 mb-3 pb-3"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
          >
            {app.notes}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {app.jobDescriptionLink && (
              <a
                href={app.jobDescriptionLink} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(app); }}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(app._id); }}
              className="p-1.5 rounded-md hover:bg-red-500/15 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────

import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  status: typeof JOB_STATUSES[number];
  apps: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

function KanbanColumn({ status, apps, onEdit, onDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: '264px', minWidth: '264px' }}>
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2.5"
        style={{
          background: `${status.hex}12`,
          border: `1px solid ${status.hex}28`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: status.hex }} />
          <span className="text-sm font-semibold" style={{ color: status.hex }}>
            {status.label}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${status.hex}20`, color: status.hex }}
        >
          {apps.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 rounded-xl space-y-2 transition-all duration-150"
        style={{
          minHeight: '200px',
          background: isOver ? `${status.hex}08` : 'rgba(255,255,255,0.012)',
          border: `2px dashed ${isOver ? status.hex + '55' : 'transparent'}`,
        }}
      >
        <SortableContext items={apps.map((a) => a._id)} strategy={verticalListSortingStrategy}>
          {apps.length === 0 ? (
            <div
              className="h-28 flex flex-col items-center justify-center gap-1.5 rounded-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="text-xl opacity-25">○</span>
              <span className="text-xs">Drop here</span>
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

// ── Board ──────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, status: JobStatus) => Promise<void>;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

export default function KanbanBoard({ applications, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  const [localApps, setLocalApps] = useState<JobApplication[]>(applications);
  const [activeApp, setActiveApp] = useState<JobApplication | null>(null);

  // Sync when parent updates
  const parentKey = applications.map((a) => a._id + a.status).join();
  const localKey = localApps.map((a) => a._id + a.status).join();
  if (parentKey !== localKey) setLocalApps(applications);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveApp(localApps.find((a) => a._id === active.id) ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const overId = over.id as string;
    const isColumn = JOB_STATUSES.some((s) => s.value === overId);
    const newStatus: JobStatus = isColumn
      ? (overId as JobStatus)
      : (localApps.find((a) => a._id === overId)?.status ?? 'applied');

    setLocalApps((prev) =>
      prev.map((a) => (a._id === active.id && a.status !== newStatus ? { ...a, status: newStatus } : a))
    );
  }

  async function handleDragEnd({ active }: DragEndEvent) {
    setActiveApp(null);
    const moved = localApps.find((a) => a._id === active.id);
    const original = applications.find((a) => a._id === active.id);
    if (moved && original && moved.status !== original.status) {
      try {
        await onStatusChange(active.id as string, moved.status);
      } catch {
        setLocalApps(applications); // revert on error
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
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '520px' }}>
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status}
            apps={localApps.filter((a) => a.status === status.value)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp ? (
          <AppCard app={activeApp} onEdit={() => {}} onDelete={() => {}} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

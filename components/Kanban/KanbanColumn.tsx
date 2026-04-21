'use client';

import { JobApplication, JobStatus } from '@/types';
import { ApplicationCard } from './ApplicationCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface StatusConfig {
  value: JobStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}

interface KanbanColumnProps {
  status: StatusConfig;
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

// Derive actual CSS color from tailwind class name string
function resolveColor(cls: string): string {
  if (cls.includes('sky')) return '#38bdf8';
  if (cls.includes('violet')) return '#a78bfa';
  if (cls.includes('amber')) return '#fbbf24';
  if (cls.includes('emerald')) return '#34d399';
  if (cls.includes('rose')) return '#f87171';
  return '#6366f1';
}

export function KanbanColumn({ status, applications, onEdit, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  const color = resolveColor(status.color);
  const ids = applications.map((a) => a.id);

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: '280px', minWidth: '280px' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2"
        style={{
          background: `${color}12`,
          border: `1px solid ${color}28`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold" style={{ color }}>
            {status.label}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}
        >
          {applications.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-all duration-150"
        style={{
          background: isOver ? `${color}08` : 'rgba(255,255,255,0.015)',
          border: `2px dashed ${isOver ? color + '60' : 'transparent'}`,
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {applications.length === 0 ? (
            <div
              className="h-32 flex flex-col items-center justify-center gap-2 rounded-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="text-2xl opacity-30">○</span>
              <span className="text-xs">Drop here</span>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

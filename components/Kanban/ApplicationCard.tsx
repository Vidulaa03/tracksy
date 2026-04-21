'use client';

import { JobApplication } from '@/types';
import { getStatusConfig } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';
import { ExternalLink, Pencil, Trash2, GripVertical, Building2, Calendar } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

export function ApplicationCard({ application, onEdit, onDelete, isDragging }: ApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: application.id, data: { status: application.status, application } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const statusConfig = getStatusConfig(application.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-xl p-3.5 cursor-default select-none animate-fade-in"
      css-bg="surface-2"
      data-dragging={isDragging}
    >
      <div
        className="rounded-xl p-3.5 transition-all duration-150"
        style={{
          background: isDragging ? 'var(--surface-3)' : 'var(--surface-2)',
          border: `1px solid ${isDragging ? 'var(--primary-border)' : 'var(--border-strong)'}`,
          boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.5)' : 'var(--shadow-sm)',
        }}
      >
        {/* Drag handle + status badge */}
        <div className="flex items-start justify-between mb-2.5">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: statusConfig.color.replace('text-', '').includes('sky') ? '#38bdf8'
                : statusConfig.color.replace('text-', '').includes('violet') ? '#a78bfa'
                : statusConfig.color.replace('text-', '').includes('amber') ? '#fbbf24'
                : statusConfig.color.replace('text-', '').includes('emerald') ? '#34d399'
                : '#f87171',
              background: statusConfig.bg.replace('bg-', '').includes('sky') ? 'rgba(56,189,248,0.1)'
                : statusConfig.bg.replace('bg-', '').includes('violet') ? 'rgba(167,139,250,0.1)'
                : statusConfig.bg.replace('bg-', '').includes('amber') ? 'rgba(251,191,36,0.1)'
                : statusConfig.bg.replace('bg-', '').includes('emerald') ? 'rgba(52,211,153,0.1)'
                : 'rgba(248,113,113,0.1)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: statusConfig.color.replace('text-', '').includes('sky') ? '#38bdf8'
                  : statusConfig.color.replace('text-', '').includes('violet') ? '#a78bfa'
                  : statusConfig.color.replace('text-', '').includes('amber') ? '#fbbf24'
                  : statusConfig.color.replace('text-', '').includes('emerald') ? '#34d399'
                  : '#f87171',
              }}
            />
            {statusConfig.label}
          </span>
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded"
            style={{ color: 'var(--text-muted)', touchAction: 'none' }}
          >
            <GripVertical size={14} />
          </button>
        </div>

        {/* Role & Company */}
        <h4
          className="font-semibold text-sm leading-snug mb-1 line-clamp-2"
          style={{ color: 'var(--text)' }}
        >
          {application.jobTitle}
        </h4>
        <div className="flex items-center gap-1.5 mb-3">
          <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {application.companyName}
          </span>
        </div>

        {/* Notes preview */}
        {application.notes && (
          <p
            className="text-xs line-clamp-2 mb-3 pb-3"
            style={{
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {application.notes}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDate(application.applicationDate)}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {application.jobDescriptionLink && (
              <a
                href={application.jobDescriptionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={13} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(application); }}
              className="p-1.5 rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(application.id); }}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

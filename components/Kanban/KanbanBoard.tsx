'use client';

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
import { arrayMove } from '@dnd-kit/sortable';
import { JobApplication, JobStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';
import { JOB_STATUSES } from '@/lib/utils/constants';

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, newStatus: JobStatus) => Promise<void>;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

export function KanbanBoard({ applications, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  const [activeApp, setActiveApp] = useState<JobApplication | null>(null);
  const [localApps, setLocalApps] = useState<JobApplication[]>(applications);

  // Keep local state in sync when parent updates
  if (JSON.stringify(applications.map((a) => a.id + a.status)) !==
    JSON.stringify(localApps.map((a) => a.id + a.status))) {
    setLocalApps(applications);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    const app = localApps.find((a) => a.id === active.id);
    if (app) setActiveApp(app);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const overId = over.id as string;

    // Check if dragging over a column (status value) or a card
    const isOverColumn = JOB_STATUSES.some((s) => s.value === overId);

    if (isOverColumn) {
      const newStatus = overId as JobStatus;
      const activeAppCurrent = localApps.find((a) => a.id === active.id);
      if (activeAppCurrent && activeAppCurrent.status !== newStatus) {
        setLocalApps((prev) =>
          prev.map((a) => (a.id === active.id ? { ...a, status: newStatus } : a))
        );
      }
    } else {
      // Dragging over another card — move to that card's column
      const overApp = localApps.find((a) => a.id === overId);
      const activeAppCurrent = localApps.find((a) => a.id === active.id);
      if (overApp && activeAppCurrent && overApp.status !== activeAppCurrent.status) {
        setLocalApps((prev) =>
          prev.map((a) => (a.id === active.id ? { ...a, status: overApp.status } : a))
        );
      }
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveApp(null);
    if (!over) return;

    const movedApp = localApps.find((a) => a.id === active.id);
    const originalApp = applications.find((a) => a.id === active.id);

    if (movedApp && originalApp && movedApp.status !== originalApp.status) {
      try {
        await onStatusChange(active.id as string, movedApp.status);
      } catch {
        // Revert on failure
        setLocalApps(applications);
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
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status}
            applications={localApps.filter((a) => a.status === status.value)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div style={{ transform: 'rotate(2deg)', opacity: 0.9 }}>
            <ApplicationCard
              application={activeApp}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

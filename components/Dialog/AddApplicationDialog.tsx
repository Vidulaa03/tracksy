'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ApplicationForm } from '@/components/Forms/ApplicationForm';
import { JobApplication } from '@/types';
import { Plus, X } from 'lucide-react';

interface AddApplicationDialogProps {
  onSubmit: (data: Partial<JobApplication>) => Promise<void>;
  trigger?: React.ReactNode;
  editApplication?: JobApplication;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddApplicationDialog({
  onSubmit,
  trigger,
  editApplication,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddApplicationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  async function handleSubmit(data: Partial<JobApplication>) {
    setIsLoading(true);
    try {
      await onSubmit(data);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  const defaultTrigger = (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={{ background: 'var(--primary)', color: 'white' }}
    >
      <Plus size={16} />
      Add Application
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <DialogHeader
          className="px-6 py-5 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <DialogTitle className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {editApplication ? 'Edit Application' : 'New Application'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5">
          <ApplicationForm
            application={editApplication}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

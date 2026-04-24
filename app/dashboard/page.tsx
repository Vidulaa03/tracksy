'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobApplication, JobStatus } from '@/types';
import { KanbanBoard } from '@/components/Kanban/KanbanBoard';
import { AddApplicationDialog } from '@/components/Dialog/AddApplicationDialog';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { JOB_STATUSES } from '@/lib/utils/constants';

export default function DashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch applications
  async function fetchApplications() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/applications');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (response.status === 503) {
          throw new Error('Database not configured. Please set MONGODB_URI in .env.local to enable the full application.');
        }
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, [router]);

  // Add new application
  async function handleAddApplication(formData: any) {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add application');

      const data = await response.json();
      setApplications([...applications, data.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add application');
    }
  }

  // Edit application
  async function handleEditApplication(app: JobApplication) {
    // This would open an edit dialog - for now just navigate
    router.push(`/dashboard/applications/${app.id}`);
  }

  // Delete application
  async function handleDeleteApplication(id: string) {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete application');

      setApplications(applications.filter((app) => app.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    }
  }

  async function handleStatusChange(id: string, status: JobStatus) {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      fetchApplications();
    }
  }

  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'applied').length,
    screening: applications.filter((a) => a.status === 'phone_screen').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    accepted: applications.filter((a) => a.status === 'offer').length,
    archived: applications.filter((a) => a.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Track your job applications and manage your search</p>
        </div>
        <AddApplicationDialog onSubmit={handleAddApplication} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="text-slate-400 text-sm mb-1">Total Applications</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </Card>
        {JOB_STATUSES.map((status) => {
          const statusColors: Record<string, string> = {
            applied: 'text-blue-400',
            phone_screen: 'text-violet-400',
            interview: 'text-amber-400',
            offer: 'text-emerald-400',
            rejected: 'text-red-400',
          };

          const displayValue = status.value === 'phone_screen'
            ? stats.screening
            : status.value === 'offer'
            ? stats.accepted
            : status.value === 'rejected'
            ? stats.archived
            : stats[status.value];

          return (
            <Card key={status.value} className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">{status.label}</div>
              <div className={`text-3xl font-bold ${statusColors[status.value]}`}>{displayValue}</div>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Applications Board</h2>
        {applications.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-center">
            <div>
              <p className="mb-2">No applications yet</p>
              <p className="text-sm">Click "Add Application" to get started</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            applications={applications}
            onStatusChange={handleStatusChange}
            onEdit={handleEditApplication}
            onDelete={handleDeleteApplication}
          />
        )}
      </div>
    </div>
  );
}

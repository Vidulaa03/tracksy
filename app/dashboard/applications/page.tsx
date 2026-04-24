'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobApplication } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { JOB_APPLICATION_STATUSES, getStatusConfig } from '@/lib/utils/constants';

export default function ApplicationsListPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch applications
  async function fetchApplications() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/applications');
      
      if (!response.ok) throw new Error('Failed to fetch applications');

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
  }, []);

  // Delete application
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete application');

      setApplications(applications.filter((app) => app.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  // Filter applications
  const filtered = filterStatus === 'all' 
    ? applications 
    : applications.filter((app) => app.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        onClick={() => router.push('/dashboard')}
        variant="outline"
        className="border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
        <p className="text-slate-400">View all your job applications</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          onClick={() => setFilterStatus('all')}
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          className={filterStatus === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300'}
        >
          All ({applications.length})
        </Button>
        {JOB_APPLICATION_STATUSES.map((status) => {
          const count = applications.filter((app) => app.status === status.value).length;
          return (
            <Button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              variant={filterStatus === status.value ? 'default' : 'outline'}
              className={filterStatus === status.value ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300'}
            >
              {status.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 p-8 text-center">
            <p className="text-slate-400">No applications found</p>
          </Card>
        ) : (
          filtered.map((application) => (
            <Card key={application.id} className="bg-slate-800 border-slate-700 p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{application.jobTitle}</h3>
                  <p className="text-slate-400 mb-2">{application.companyName}</p>
                  {application.notes && (
                    <p className="text-slate-500 text-sm line-clamp-2">{application.notes}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-slate-500">
                    <span>
                      Status: <span className="text-white capitalize font-semibold">{getStatusConfig(application.status).label}</span>
                    </span>
                    <span>
                      Applied: {new Date(application.applicationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/dashboard/applications/${application.id}`)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Edit2 size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(application.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-900/20 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

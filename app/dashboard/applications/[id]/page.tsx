'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { JobApplication } from '@/types';
import { ApplicationForm } from '@/components/Forms/ApplicationForm';
import { AIInsights } from '@/components/AI/AIInsights';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { getStatusConfig } from '@/lib/utils/constants';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch application
  useEffect(() => {
    async function fetchApplication() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/applications/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Application not found');
            return;
          }
          throw new Error('Failed to fetch application');
        }

        const data = await response.json();
        setApplication(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplication();
  }, [id]);

  // Update application
  async function handleSubmit(formData: any) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update application');

      const data = await response.json();
      setApplication(data.data);
      
      // Show success and redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Card className="bg-slate-800 border-slate-700 p-8 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
          <p className="text-red-400 mb-4">{error || 'Application not found'}</p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Button>
        </Card>
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
        Back
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form and AI Insights */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Application</h2>
            
            {error && (
              <div className="mb-6 flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <ApplicationForm
              application={application}
              onSubmit={handleSubmit}
              isLoading={isSaving}
            />
          </Card>

          {/* AI Insights */}
          <div>
            <AIInsights
              jobDescription={application.description}
              onInsightsFetched={(data) => {
                console.log('Job insights:', data);
              }}
            />
          </div>
        </div>

        {/* Details */}
        <div>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-500 text-sm">Status</p>
                <p className="text-white font-semibold">{getStatusConfig(application.status).label}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Applied Date</p>
                <p className="text-white">
                  {new Date(application.applicationDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Created</p>
                <p className="text-white text-sm">
                  {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

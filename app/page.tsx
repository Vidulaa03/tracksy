'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Briefcase, Zap, Brain } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', {
          method: 'GET',
        });
        if (res.ok) {
          router.push('/dashboard');
        }
      } catch {
        // Not authenticated, show landing page
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Job Tracker</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Sign in
            </Button>
            <Button
              onClick={() => router.push('/auth/signup')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Track Your Job <span className="text-blue-400">Applications</span> Smarter
        </h2>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Manage your job search with an intuitive Kanban board. Get AI-powered insights to optimize your resume and land your dream job.
        </p>
        <Button
          onClick={() => router.push('/auth/signup')}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
        >
          Start for free
        </Button>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <Briefcase className="text-blue-400 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Kanban Board</h3>
            <p className="text-slate-400">
              Organize applications by status: Applied, Screening, Interview, Accepted, or Archived.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <Zap className="text-blue-400 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Stay Organized</h3>
            <p className="text-slate-400">
              Track all your job applications in one place with detailed notes and dates.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <Brain className="text-blue-400 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">AI Insights</h3>
            <p className="text-slate-400">
              Get smart suggestions to improve your resume and match job requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 px-6 py-8 text-center text-slate-400">
        <p>&copy; 2024 Job Application Tracker. All rights reserved.</p>
      </div>
    </div>
  );
}

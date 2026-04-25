'use client';

import { Resume } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

interface ResumeListProps {
  resumes: Resume[];
  onEdit: (resume: Resume) => void;
  onPreview: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onImprove: (resume: Resume) => void;
  onExport: (resume: Resume) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ResumeList({
  resumes,
  onEdit,
  onPreview,
  onDuplicate,
  onImprove,
  onExport,
  onDelete,
  isLoading = false,
}: ResumeListProps) {
  if (resumes.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-8 text-center">
        <FileText className="text-slate-500 mx-auto mb-3" size={40} />
        <p className="text-slate-400 mb-2">No resumes yet</p>
        <p className="text-slate-500 text-sm">Create your first resume to get started</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <Card
          key={resume.id}
          className="bg-slate-800 border-slate-700 p-4 hover:border-blue-500/50 transition-colors"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <FileText className="text-blue-400" size={20} />
                  <div>
                    <p className="text-white font-semibold">{resume.title || 'General Resume'}</p>
                    <p className="text-slate-500 text-sm">{resume.version || 'v1'} · Last edited {formatDate(resume.updatedAt)}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm line-clamp-3">
                  {typeof resume.structuredData === 'object' && resume.structuredData?.summary
                    ? ((resume.structuredData as any).summary.intro || (resume.structuredData as any).summary.objective || resume.content.substring(0, 220))
                    : resume.content.substring(0, 220)
                  }
                  ...
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-700/80 px-3 py-1 text-xs text-slate-300">
                  Interviews {Math.floor(Math.min(88, Math.max(5, resume.content.length / 18)))}%
                </span>
                <span className="rounded-full bg-slate-700/80 px-3 py-1 text-xs text-slate-300">
                  Used in {Math.max(1, Math.floor(resume.content.length / 250))} apps
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button
                onClick={() => onPreview(resume)}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Preview
              </Button>
              <Button
                onClick={() => onEdit(resume)}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Edit2 size={16} className="mr-1" />
                Edit
              </Button>
              <Button
                onClick={() => onDuplicate(resume)}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Duplicate
              </Button>
              <Button
                onClick={() => onImprove(resume)}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Improve AI
              </Button>
              <Button
                onClick={() => onExport(resume)}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Export PDF
              </Button>
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this resume?')) {
                    onDelete(resume.id);
                  }
                }}
                disabled={isLoading}
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
      ))}
    </div>
  );
}

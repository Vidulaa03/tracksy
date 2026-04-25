'use client';

import { useEffect, useState } from 'react';
import { Resume } from '@/types';
import { ResumeEditor } from '@/components/ResumeEditor/ResumeEditor';
import { ResumeList } from '@/components/ResumeList/ResumeList';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Plus, UploadCloud, Sparkles, FileSearch } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [importedContent, setImportedContent] = useState<string | null>(null);
  const [importedTitle, setImportedTitle] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ suggestions: string[]; bullets: string[] } | null>(null);

  async function fetchResumes() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/resumes');
      if (!response.ok) throw new Error('Failed to fetch resumes');
      const data = await response.json();
      setResumes(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchResumes();
  }, []);

  async function handleSaveResume(payload: { content: string; title?: string; version?: string }) {
    setIsBusy(true);
    setError(null);

    try {
      if (selectedResume) {
        const response = await fetch(`/api/resumes/${selectedResume.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload }),
        });

        if (!response.ok) throw new Error('Failed to update resume');
        const data = await response.json();
        setResumes(resumes.map((r) => (r.id === selectedResume.id ? data.data : r)));
      } else {
        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload }),
        });

        if (!response.ok) throw new Error('Failed to create resume');
        const data = await response.json();
        setResumes([data.data, ...resumes]);
      }

      setSelectedResume(null);
      setImportedContent(null);
      setImportedTitle(null);
      setShowEditor(false);
      setPreviewResume(null);
      setAiSuggestions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resume');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteResume(id: string) {
    try {
      const response = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete resume');
      setResumes(resumes.filter((r) => r.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(null);
        setShowEditor(false);
      }
      if (previewResume?.id === id) {
        setPreviewResume(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume');
    }
  }

  async function handleDuplicateResume(resume: Resume) {
    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: resume.content,
          title: `${resume.title || 'Resume'} Copy`,
          version: resume.version || 'v1',
          structuredData: resume.structuredData || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to duplicate resume');
      const data = await response.json();
      setResumes([data.data, ...resumes]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImproveResume(resume: Resume) {
    setIsBusy(true);
    setError(null);
    setAiSuggestions(null);

    try {
      const response = await fetch('/api/ai/resume-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: resume.content,
          jobDescription: resume.content.slice(0, 1200),
        }),
      });

      if (!response.ok) throw new Error('Failed to improve resume');
      const data = await response.json();
      setAiSuggestions({
        suggestions: data.suggestions || [],
        bullets: data.bullets || [],
      });
      setSelectedResume(resume);
      setShowEditor(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve resume');
    } finally {
      setIsBusy(false);
    }
  }

  function handlePreviewResume(resume: Resume) {
    setPreviewResume(resume);
    setShowEditor(false);
  }

  function printResumePDF(content: string, title = 'Resume') {
    if (typeof window === 'undefined') return;
    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
      body{font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; color:#111827; margin:0; padding:32px;}
      .resume{max-width:900px;margin:auto;}
      h1,h2,h3{margin:0;}
      .section{margin-top:24px;}
      pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:12pt;}
    </style></head><body><div class="resume"><pre>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div></body></html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  }

  async function parseUploadedResume(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(buffer);
      const matches = [...text.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
      return matches.join(' ').replace(/\s+/g, ' ').trim();
    }

    return await file.text();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-slate-900 border-slate-700 p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="uppercase text-blue-400 text-xs font-semibold tracking-[0.24em] mb-4">Resume builder</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Build resumes that get noticed
            </h1>
            <p className="mt-4 text-slate-400 max-w-2xl">
              Create, edit, tailor and export professional resumes in minutes. Save versions, improve content with AI, and manage all resume workspaces from one premium dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                onClick={() => {
                  setSelectedResume(null);
                  setShowEditor(true);
                  setAiSuggestions(null);
                  setPreviewResume(null);
                }}
              >
                <Plus size={16} className="mr-2" />
                Create New Resume
              </Button>
              <Button
                className="bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.txt,.md';
                  input.onchange = async () => {
                    const file = input.files?.[0];
                                  if (!file) return;
                    setShowEditor(true);
                    setSelectedResume(null);
                    setImportedTitle(file.name.replace(/\.[^/.]+$/, ''));
                    setImportedContent(await parseUploadedResume(file));
                    setAiSuggestions(null);
                    setPreviewResume(null);
                  };
                  input.click();
                }}
              >
                <UploadCloud size={16} className="mr-2" />
                Import PDF
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex items-center gap-3 text-slate-300 mb-5">
              <Sparkles size={20} />
              <p className="font-semibold">Live workspace</p>
            </div>
            <div className="space-y-4 text-slate-400 text-sm">
              <p>Manage resume versions, save drafts, and export polished PDF output from a modern editing experience.</p>
              <p>Every resume can be improved by AI, duplicated for different job goals, and exported with clean formatting.</p>
              <p className="text-slate-300">Resume cards now behave like an actual product hub — not just file storage.</p>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Resume Builder Workspace</h2>
                <p className="text-slate-400 mt-1">Jump into the editor, improve with AI, or export your work instantly.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => {
                    setSelectedResume(null);
                    setShowEditor(true);
                    setPreviewResume(null);
                    setAiSuggestions(null);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Start a new version
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => {
                    setPreviewResume(null);
                    setShowEditor(false);
                  }}
                >
                  <FileSearch size={16} className="mr-2" />
                  Focus on cards
                </Button>
              </div>
            </div>
            {showEditor ? (
              <ResumeEditor
                resume={selectedResume || undefined}
                initialContent={importedContent || undefined}
                initialTitle={selectedResume?.title || importedTitle || undefined}
                onSubmit={handleSaveResume}
                isLoading={isBusy}
                initialAISuggestions={aiSuggestions}
              />
            ) : (
              <div className="rounded-3xl border border-slate-700 p-8 bg-slate-950/60 min-h-[320px] flex flex-col justify-center items-center text-center gap-4">
                <p className="text-slate-400">Open the builder to edit an existing resume, create a new version, or import a PDF resume into editable fields.</p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setSelectedResume(null);
                    setShowEditor(true);
                    setAiSuggestions(null);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Create New Resume
                </Button>
              </div>
            )}
          </Card>

          {previewResume && (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Instant Resume Preview</h3>
              <pre className="whitespace-pre-wrap text-slate-300 text-sm rounded-xl bg-slate-900 p-4 border border-slate-700 max-h-96 overflow-y-auto">
                {previewResume.content}
              </pre>
              <div className="mt-4 flex gap-3 flex-wrap">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => printResumePDF(previewResume.content, previewResume.title)}>
                  Export PDF
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => setPreviewResume(null)}>
                  Close Preview
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Card className="bg-slate-800 border-slate-700 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Your Resumes</h3>
              <p className="text-slate-400 text-sm">Organize multiple versions, compare updates, and keep polished export-ready copies.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Version hub</span>
          </div>

          <ResumeList
            resumes={resumes}
            onEdit={(resume) => {
              setSelectedResume(resume);
              setShowEditor(true);
              setPreviewResume(null);
            }}
            onPreview={handlePreviewResume}
            onDuplicate={handleDuplicateResume}
            onImprove={handleImproveResume}
            onExport={(resume) => printResumePDF(resume.content, resume.title)}
            onDelete={handleDeleteResume}
            isLoading={isBusy}
          />
        </Card>
      </div>
    </div>
  );
}

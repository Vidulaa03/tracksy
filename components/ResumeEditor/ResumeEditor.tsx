'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Resume } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, ShieldCheck } from 'lucide-react';

interface ResumeEditorProps {
  resume?: Resume;
  initialContent?: string;
  initialTitle?: string;
  onSubmit: (payload: { content: string; title?: string; version?: string; structuredData?: any }) => Promise<void>;
  isLoading?: boolean;
  initialAISuggestions?: { suggestions: string[]; bullets: string[] } | null;
}

type EducationItem = {
  id: string;
  college: string;
  degree: string;
  gpa: string;
  graduation: string;
};

type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  dates: string;
  bullets: string[];
};

type ProjectItem = {
  id: string;
  name: string;
  stack: string;
  description: string;
  achievements: string;
};

type CertificationItem = {
  id: string;
  name: string;
  provider: string;
};

type ResumeDraft = {
  title: string;
  version: string;
  personal: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
    location: string;
  };
  summary: {
    intro: string;
    objective: string;
  };
  education: EducationItem[];
  skills: {
    technical: string[];
    tools: string[];
    soft: string[];
  };
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: string[];
};

const EMPTY_DRAFT: ResumeDraft = {
  title: 'Professional Resume',
  version: 'v1',
  personal: {
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    location: '',
  },
  summary: {
    intro: '',
    objective: '',
  },
  education: [
    { id: 'edu-1', college: '', degree: '', gpa: '', graduation: '' },
  ],
  skills: {
    technical: [],
    tools: [],
    soft: [],
  },
  experience: [
    { id: 'exp-1', company: '', role: '', dates: '', bullets: [''] },
  ],
  projects: [
    { id: 'proj-1', name: '', stack: '', description: '', achievements: '' },
  ],
  certifications: [{ id: 'cert-1', name: '', provider: '' }],
  achievements: [''],
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseLegacyResume(content: string, title: string, version: string): ResumeDraft {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && parsed.personal) {
        return {
          title: parsed.title || title || 'Professional Resume',
          version: parsed.version || version || 'v1',
          personal: {
            fullName: parsed.personal.fullName || '',
            email: parsed.personal.email || '',
            phone: parsed.personal.phone || '',
            linkedin: parsed.personal.linkedin || '',
            github: parsed.personal.github || '',
            portfolio: parsed.personal.portfolio || '',
            location: parsed.personal.location || '',
          },
          summary: {
            intro: parsed.summary?.intro || '',
            objective: parsed.summary?.objective || '',
          },
          education: Array.isArray(parsed.education)
            ? parsed.education.map((item: any, index: number) => ({
                id: `edu-${index}`,
                college: item.college || '',
                degree: item.degree || '',
                gpa: item.gpa || '',
                graduation: item.graduation || '',
              }))
            : [...EMPTY_DRAFT.education],
          skills: {
            technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
            tools: Array.isArray(parsed.skills?.tools) ? parsed.skills.tools : [],
            soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : [],
          },
          experience: Array.isArray(parsed.experience)
            ? parsed.experience.map((item: any, index: number) => ({
                id: `exp-${index}`,
                company: item.company || '',
                role: item.role || '',
                dates: item.dates || '',
                bullets: Array.isArray(item.bullets) ? item.bullets : [''],
              }))
            : [...EMPTY_DRAFT.experience],
          projects: Array.isArray(parsed.projects)
            ? parsed.projects.map((item: any, index: number) => ({
                id: `proj-${index}`,
                name: item.name || '',
                stack: item.stack || '',
                description: item.description || '',
                achievements: item.achievements || '',
              }))
            : [...EMPTY_DRAFT.projects],
          certifications: Array.isArray(parsed.certifications)
            ? parsed.certifications.map((item: any, index: number) => ({
                id: `cert-${index}`,
                name: item.name || '',
                provider: item.provider || '',
              }))
            : [...EMPTY_DRAFT.certifications],
          achievements: Array.isArray(parsed.achievements)
            ? parsed.achievements
            : [parsed.achievements || ''],
        };
      }
    } catch {
      // ignore invalid JSON and fall back to text parsing
    }
  }

  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const emailMatch = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const locationLine = lines.find((line) => line.toLowerCase().includes('city') || line.toLowerCase().includes('location')) || '';

  return {
    title: title || 'Professional Resume',
    version: version || 'v1',
    personal: {
      fullName: lines[0] || '',
      email: emailMatch?.[0] || '',
      phone: '',
      linkedin: '',
      github: '',
      portfolio: '',
      location: locationLine || '',
    },
    summary: {
      intro: lines.slice(1, 3).join(' '),
      objective: lines.slice(3, 5).join(' '),
    },
    education: [...EMPTY_DRAFT.education],
    skills: { technical: [], tools: [], soft: [] },
    experience: [...EMPTY_DRAFT.experience],
    projects: [...EMPTY_DRAFT.projects],
    certifications: [...EMPTY_DRAFT.certifications],
    achievements: [''],
  };
}

function buildMarkdown(draft: ResumeDraft) {
  const lines = [
    `# ${draft.title}`,
    `Version: ${draft.version}`,
    '',
    '## Personal Info',
    `Full Name: ${draft.personal.fullName}`,
    `Email: ${draft.personal.email}`,
    `Phone: ${draft.personal.phone}`,
    `LinkedIn: ${draft.personal.linkedin}`,
    `GitHub: ${draft.personal.github}`,
    `Portfolio: ${draft.personal.portfolio}`,
    `Location: ${draft.personal.location}`,
    '',
    '## Professional Summary',
    draft.summary.intro,
    draft.summary.objective,
    '',
    '## Education',
  ];

  draft.education.forEach((item) => {
    lines.push(`### ${item.college}`);
    lines.push(`${item.degree} • ${item.graduation} • GPA: ${item.gpa}`);
    lines.push('');
  });

  lines.push('## Skills');
  lines.push(`Technical: ${draft.skills.technical.join(', ')}`);
  lines.push(`Tools: ${draft.skills.tools.join(', ')}`);
  lines.push(`Soft Skills: ${draft.skills.soft.join(', ')}`);
  lines.push('');
  lines.push('## Experience');

  draft.experience.forEach((item) => {
    lines.push(`### ${item.role} @ ${item.company}`);
    lines.push(`${item.dates}`);
    item.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
    lines.push('');
  });

  lines.push('## Projects');
  draft.projects.forEach((item) => {
    lines.push(`### ${item.name}`);
    lines.push(`Tech stack: ${item.stack}`);
    lines.push(item.description);
    lines.push(`Results: ${item.achievements}`);
    lines.push('');
  });

  lines.push('## Certifications');
  draft.certifications.forEach((item) => {
    lines.push(`- ${item.name} · ${item.provider}`);
  });
  lines.push('');

  lines.push('## Achievements');
  draft.achievements.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join('\n');
}

export function ResumeEditor({
  resume,
  onSubmit,
  isLoading = false,
  initialAISuggestions = null,
}: ResumeEditorProps) {
  const [draft, setDraft] = useState<ResumeDraft>(EMPTY_DRAFT);
  const [activeSection, setActiveSection] = useState<string>('Personal Info');
  const [undoStack, setUndoStack] = useState<ResumeDraft[]>([]);
  const [redoStack, setRedoStack] = useState<ResumeDraft[]>([]);

  const saveKey = resume?.id ? `resume-editor-draft-${resume.id}` : 'resume-editor-draft-new';

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(saveKey) : null;
    if (stored) {
      try {
        setDraft(JSON.parse(stored));
        return;
      } catch {
        // ignore
      }
    }

    if (resume) {
      setDraft(parseLegacyResume(resume.content, resume.title || 'Professional Resume', resume.version || 'v1'));
      return;
    }

    if (initialContent) {
      setDraft(parseLegacyResume(initialContent, initialTitle || 'Imported Resume', 'Imported'));
      return;
    }

    setDraft(EMPTY_DRAFT);
  }, [resume?.id, initialContent, initialTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(saveKey, JSON.stringify(draft));
  }, [draft, saveKey]);

  function snapshot(nextDraft: ResumeDraft) {
    setUndoStack((prev) => [...prev, draft]);
    setRedoStack([]);
    setDraft(nextDraft);
  }

  function updateField(path: string[], value: any) {
    snapshot(path.reduceRight((acc, key, index) => ({ [key]: acc }), value) as ResumeDraft);
  }

  function updateDraft(mutator: (current: ResumeDraft) => ResumeDraft) {
    snapshot(mutator(draft));
  }

  function addEducation() {
    updateDraft((current) => ({
      ...current,
      education: [...current.education, { id: generateId('edu'), college: '', degree: '', gpa: '', graduation: '' }],
    }));
  }

  function addExperience() {
    updateDraft((current) => ({
      ...current,
      experience: [...current.experience, { id: generateId('exp'), company: '', role: '', dates: '', bullets: [''] }],
    }));
  }

  function addProject() {
    updateDraft((current) => ({
      ...current,
      projects: [...current.projects, { id: generateId('proj'), name: '', stack: '', description: '', achievements: '' }],
    }));
  }

  function addCertification() {
    updateDraft((current) => ({
      ...current,
      certifications: [...current.certifications, { id: generateId('cert'), name: '', provider: '' }],
    }));
  }

  function addAchievement() {
    updateDraft((current) => ({ ...current, achievements: [...current.achievements, ''] }));
  }

  function addBullet(sectionId: string) {
    updateDraft((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === sectionId ? { ...item, bullets: [...item.bullets, ''] } : item
      ),
    }));
  }

  function moveArrayItem<T>(array: T[], index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return array;
    if (direction === 'down' && index === array.length - 1) return array;
    const copy = [...array];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    return copy;
  }

  const charCount = useMemo(() => buildMarkdown(draft).length, [draft]);
  const bulletScore = useMemo(() => Math.min(100, Math.max(15, draft.experience.reduce((sum, exp) => sum + exp.bullets.length, 0) * 15)), [draft]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ content: buildMarkdown(draft), title: draft.title, version: draft.version, structuredData: draft });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid lg:grid-cols-[0.9fr_0.7fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <p className="text-slate-400 text-sm">Resume version</p>
                <h2 className="text-xl font-semibold text-white">{draft.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" type="button" onClick={() => setActiveSection('Personal Info')}>
                  Personal
                </Button>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" type="button" onClick={() => setActiveSection('Experience')}>
                  Experience
                </Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <label className="block text-sm text-slate-300">
                Resume title
                <input
                  value={draft.title}
                  onChange={(e) => updateDraft((current) => ({ ...current, title: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Version name
                <input
                  value={draft.version}
                  onChange={(e) => updateDraft((current) => ({ ...current, version: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
              <p className="text-slate-400 text-sm">Bullet quality score</p>
              <p className="text-3xl font-semibold text-white">{bulletScore}%</p>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
              <p className="text-slate-400 text-sm">Character count</p>
              <p className="text-3xl font-semibold text-white">{charCount}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <p className="text-slate-400 text-sm">Section navigation</p>
                <h3 className="text-lg font-semibold text-white">{activeSection}</h3>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => setActiveSection('Personal Info')}>
                  Personal
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => setActiveSection('Summary')}>
                  Summary
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => setActiveSection('Skills')}>
                  Skills
                </Button>
              </div>
            </div>

            {activeSection === 'Personal Info' && (
              <div className="space-y-4">
                {Object.entries(draft.personal).map(([key, value]) => (
                  <label key={key} className="block text-sm text-slate-300">
                    {key === 'fullName' ? 'Full Name' : key.charAt(0).toUpperCase() + key.slice(1)}
                    <input
                      value={(draft.personal as any)[key]}
                      onChange={(e) => updateDraft((current) => ({
                        ...current,
                        personal: { ...current.personal, [key]: e.target.value },
                      }))}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </label>
                ))}
              </div>
            )}

            {activeSection === 'Summary' && (
              <div className="space-y-4">
                <label className="block text-sm text-slate-300">
                  Short intro
                  <textarea
                    value={draft.summary.intro}
                    onChange={(e) => updateDraft((current) => ({ ...current, summary: { ...current.summary, intro: e.target.value } }))}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Career objective
                  <textarea
                    value={draft.summary.objective}
                    onChange={(e) => updateDraft((current) => ({ ...current, summary: { ...current.summary, objective: e.target.value } }))}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
              </div>
            )}

            {activeSection === 'Skills' && (
              <div className="space-y-4">
                {(['technical', 'tools', 'soft'] as const).map((category) => (
                  <label key={category} className="block text-sm text-slate-300">
                    {category === 'technical' ? 'Technical Skills' : category === 'tools' ? 'Tools' : 'Soft Skills'}
                    <input
                      value={draft.skills[category].join(', ')}
                      onChange={(e) => updateDraft((current) => ({
                        ...current,
                        skills: { ...current.skills, [category]: e.target.value.split(',').map((skill) => skill.trim()).filter(Boolean) },
                      }))}
                      placeholder="Separate with commas"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-slate-950/90 border border-slate-700 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-slate-400 text-sm">AI improvement</p>
                <h3 className="text-lg text-white font-semibold">Smart assist</h3>
              </div>
              <Sparkles className="text-sky-400" size={24} />
            </div>
            <div className="space-y-3 text-slate-300 text-sm">
              <p>Use AI suggestions to make bullet points stronger, more measurable, and ATS-friendly.</p>
              <div className="grid gap-2">
                <span className="rounded-2xl bg-slate-900/80 px-3 py-2">Improve Bullet</span>
                <span className="rounded-2xl bg-slate-900/80 px-3 py-2">More Impactful</span>
                <span className="rounded-2xl bg-slate-900/80 px-3 py-2">ATS Friendly Rewrite</span>
                <span className="rounded-2xl bg-slate-900/80 px-3 py-2">Professional Tone</span>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-950/90 border border-slate-700 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-slate-400 text-sm">Live preview</p>
                <h3 className="text-lg text-white font-semibold">Draft snapshot</h3>
              </div>
              <ShieldCheck className="text-sky-400" size={24} />
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-300 text-sm max-h-[420px] overflow-y-auto">
              <p className="font-semibold text-white">{draft.personal.fullName || 'Full Name'}</p>
              <p>{draft.personal.email || 'you@example.com'} · {draft.personal.phone || '(000) 000-0000'}</p>
              <p className="mt-3 text-slate-300">{draft.summary.intro || 'A strong summary that highlights your experience, impact, and career goals.'}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Experience and projects</h3>
            <p className="text-slate-400 text-sm">Add rich, editable sections for experience, education, certifications and career highlights.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" disabled={!undoStack.length} onClick={() => {
              const prev = undoStack[undoStack.length - 1];
              setRedoStack((current) => [draft, ...current]);
              setUndoStack((current) => current.slice(0, -1));
              setDraft(prev);
            }}>
              Undo
            </Button>
            <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" disabled={!redoStack.length} onClick={() => {
              const next = redoStack[0];
              setRedoStack((current) => current.slice(1));
              setUndoStack((current) => [...current, draft]);
              setDraft(next);
            }}>
              Redo
            </Button>
            <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => addExperience()}>
              <Plus size={16} className="mr-2" /> Add experience
            </Button>
            <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => addProject()}>
              <Plus size={16} className="mr-2" /> Add project
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Education</h4>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={addEducation}>
                Add item
              </Button>
            </div>
            <div className="space-y-4">
              {draft.education.map((item, index) => (
                <div key={item.id} className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                  <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                    <div className="text-sm text-slate-400">Education {index + 1}</div>
                    <div className="flex gap-2">
                      <Button type="button" size="xs" variant="outline" className="border-slate-700 text-slate-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        education: moveArrayItem(current.education, index, 'up'),
                      }))}>
                        <ArrowUp size={16} />
                      </Button>
                      <Button type="button" size="xs" variant="outline" className="border-slate-700 text-slate-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        education: moveArrayItem(current.education, index, 'down'),
                      }))}>
                        <ArrowDown size={16} />
                      </Button>
                      <Button type="button" size="xs" variant="outline" className="border-red-600 text-red-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        education: current.education.filter((entry) => entry.id !== item.id),
                      }))}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-slate-300">
                      College
                      <input value={item.college} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        education: current.education.map((entry) => entry.id === item.id ? { ...entry, college: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Degree
                      <input value={item.degree} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        education: current.education.map((entry) => entry.id === item.id ? { ...entry, degree: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      GPA / Percentage
                      <input value={item.gpa} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        education: current.education.map((entry) => entry.id === item.id ? { ...entry, gpa: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Graduation Year
                      <input value={item.graduation} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        education: current.education.map((entry) => entry.id === item.id ? { ...entry, graduation: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Experience</h4>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={addExperience}>
                Add experience
              </Button>
            </div>
            <div className="space-y-4">
              {draft.experience.map((item, index) => (
                <div key={item.id} className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="text-slate-300">{item.role || 'Role'} @ {item.company || 'Company'}</div>
                    <div className="flex gap-2">
                      <Button type="button" size="xs" variant="outline" className="border-slate-700 text-slate-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        experience: moveArrayItem(current.experience, index, 'up'),
                      }))}>
                        <ArrowUp size={16} />
                      </Button>
                      <Button type="button" size="xs" variant="outline" className="border-slate-700 text-slate-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        experience: moveArrayItem(current.experience, index, 'down'),
                      }))}>
                        <ArrowDown size={16} />
                      </Button>
                      <Button type="button" size="xs" variant="outline" className="border-red-600 text-red-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        experience: current.experience.filter((entry) => entry.id !== item.id),
                      }))}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <label className="block text-sm text-slate-300">
                      Company
                      <input value={item.company} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        experience: current.experience.map((entry) => entry.id === item.id ? { ...entry, company: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Role
                      <input value={item.role} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        experience: current.experience.map((entry) => entry.id === item.id ? { ...entry, role: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Dates
                      <input value={item.dates} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        experience: current.experience.map((entry) => entry.id === item.id ? { ...entry, dates: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                  </div>
                  <div className="space-y-3">
                    {item.bullets.map((bullet, bulletIndex) => (
                      <div key={`${item.id}-${bulletIndex}`} className="flex gap-3">
                        <span className="mt-3 text-slate-400">•</span>
                        <input
                          value={bullet}
                          onChange={(e) => updateDraft((current) => ({
                            ...current,
                            experience: current.experience.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, bullets: entry.bullets.map((text, idx) => (idx === bulletIndex ? e.target.value : text)) }
                                : entry
                            ),
                          }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <Button type="button" size="xs" variant="outline" className="border-red-600 text-red-300" onClick={() => updateDraft((current) => ({
                          ...current,
                          experience: current.experience.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, bullets: entry.bullets.filter((_, idx) => idx !== bulletIndex) }
                              : entry
                          ),
                        }))}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => addBullet(item.id)}>
                      <Plus size={16} className="mr-2" /> Add bullet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Projects</h4>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={addProject}>
                Add project
              </Button>
            </div>
            <div className="space-y-4">
              {draft.projects.map((item, index) => (
                <div key={item.id} className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="text-slate-300">{item.name || `Project ${index + 1}`}</div>
                    <div className="flex gap-2">
                      <Button type="button" size="xs" variant="outline" className="border-slate-700 text-slate-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        projects: moveArrayItem(current.projects, index, 'up'),
                      }))}>
                        <ArrowUp size={16} />
                      </Button>
                      <Button type="button" size="xs" variant="outline" className="border-slate-700 text-slate-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        projects: moveArrayItem(current.projects, index, 'down'),
                      }))}>
                        <ArrowDown size={16} />
                      </Button>
                      <Button type="button" size="xs" variant="outline" className="border-red-600 text-red-300" onClick={() => updateDraft((current) => ({
                        ...current,
                        projects: current.projects.filter((entry) => entry.id !== item.id),
                      }))}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-slate-300">
                      Project Name
                      <input value={item.name} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        projects: current.projects.map((entry) => entry.id === item.id ? { ...entry, name: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Tech Stack
                      <input value={item.stack} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        projects: current.projects.map((entry) => entry.id === item.id ? { ...entry, stack: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300 sm:col-span-2">
                      Description
                      <textarea value={item.description} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        projects: current.projects.map((entry) => entry.id === item.id ? { ...entry, description: e.target.value } : entry),
                      }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300 sm:col-span-2">
                      Achievements
                      <textarea value={item.achievements} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        projects: current.projects.map((entry) => entry.id === item.id ? { ...entry, achievements: e.target.value } : entry),
                      }))} rows={2} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">Certifications & Achievements</h4>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={addCertification}>
                  Add certification
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={addAchievement}>
                  Add achievement
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {draft.certifications.map((item, index) => (
                <div key={item.id} className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="text-slate-300">Certification {index + 1}</div>
                    <Button type="button" size="xs" variant="outline" className="border-red-600 text-red-300" onClick={() => updateDraft((current) => ({
                      ...current,
                      certifications: current.certifications.filter((entry) => entry.id !== item.id),
                    }))}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-slate-300">
                      Name
                      <input value={item.name} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        certifications: current.certifications.map((entry) => entry.id === item.id ? { ...entry, name: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Provider
                      <input value={item.provider} onChange={(e) => updateDraft((current) => ({
                        ...current,
                        certifications: current.certifications.map((entry) => entry.id === item.id ? { ...entry, provider: e.target.value } : entry),
                      }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </label>
                  </div>
                </div>
              ))}
              <div className="space-y-3">
                {draft.achievements.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-3 items-start">
                    <span className="mt-3 text-slate-400">•</span>
                    <input
                      value={item}
                      onChange={(e) => updateDraft((current) => ({
                        ...current,
                        achievements: current.achievements.map((value, idx) => (idx === index ? e.target.value : value)),
                      }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <Button type="button" size="xs" variant="outline" className="border-red-600 text-red-300" onClick={() => updateDraft((current) => ({
                      ...current,
                      achievements: current.achievements.filter((_, idx) => idx !== index),
                    }))}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                'Save resume'
              )}
            </Button>
          </div>
        </div>
      </div>

      {initialAISuggestions && (
        <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-sky-400" size={22} />
            <div>
              <p className="text-white font-semibold">AI suggestions</p>
              <p className="text-slate-400 text-sm">Use these ideas to rewrite bullets and strengthen your resume tone.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {initialAISuggestions.bullets.map((bullet, index) => (
              <div key={index} className="rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
                <p className="text-sm">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

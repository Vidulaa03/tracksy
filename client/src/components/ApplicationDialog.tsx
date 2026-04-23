import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarClock, Check, ChevronDown, FileUp, Loader2, Plus, Sparkles, Upload, X } from 'lucide-react';

import { aiAPI, resumesAPI } from '../services/api';
import ScheduleStageModal from './ScheduleStageModal';
import { ApplicationEvent, JobApplication, JobStatus, JOB_STATUSES, Resume } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<JobApplication>) => Promise<void>;
  editApp?: JobApplication;
}

const EMPTY = {
  position: '',
  companyName: '',
  description: '',
  jobDescriptionLink: '',
  notes: '',
  salaryRange: '',
  status: 'applied' as JobStatus,
  appliedDate: new Date().toISOString().split('T')[0],
  linkedResumeId: '',
};

const QUICK_UPLOAD_EMPTY = {
  title: '',
  targetRole: '',
  tags: '',
};

function tokenize(value: string) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [])];
}

function getResumeMatch(resume: Resume, description: string) {
  const tokens = new Set(tokenize(description));
  const titleTokens = tokenize(`${resume.title} ${resume.targetRole ?? ''}`);
  const tagMatches = (resume.tags ?? []).filter((tag) => tokens.has(tag.toLowerCase()));
  const skillMatches = (resume.skills ?? []).filter((skill) => tokens.has(skill.toLowerCase()));
  let score = 42;
  score += titleTokens.some((token) => tokens.has(token)) ? 16 : 0;
  score += tagMatches.length * 10;
  score += skillMatches.length * 7;
  score += resume.isDefault ? 4 : 0;
  return {
    score: Math.min(score, 99),
    tagMatches,
    skillMatches,
  };
}

function mapStatusToStage(status: JobStatus): ApplicationEvent['stage'] | null {
  if (status === 'phone_screen') return 'Phone Screen';
  if (status === 'interview') return 'Interview';
  if (status === 'offer') return 'Offer';
  return null;
}

export default function ApplicationDialog({ open, onClose, onSubmit, editApp }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [resumeSearch, setResumeSearch] = useState('');
  const [quickUploadOpen, setQuickUploadOpen] = useState(false);
  const [quickUpload, setQuickUpload] = useState(QUICK_UPLOAD_EMPTY);
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickUploading, setQuickUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeDropdownOpen, setResumeDropdownOpen] = useState(false);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleSeed, setScheduleSeed] = useState<ApplicationEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editApp) {
      setForm({
        position: editApp.position ?? '',
        companyName: editApp.companyName ?? '',
        description: editApp.description ?? '',
        jobDescriptionLink: editApp.jobDescriptionLink ?? '',
        notes: editApp.notes ?? '',
        salaryRange: editApp.salaryRange ?? '',
        status: editApp.status ?? 'applied',
        appliedDate: (editApp.appliedDate ?? '').split('T')[0] || EMPTY.appliedDate,
        linkedResumeId: editApp.linkedResumeId ?? '',
      });
      setBullets(editApp.resumeBullets ?? []);
      setEvents(editApp.events ?? []);
    } else {
      setForm(EMPTY);
      setBullets([]);
      setEvents([]);
    }

    setErrors({});
    setAiError('');
    setResumeError('');
    setResumeSearch('');
    setQuickUploadOpen(false);
    setResumeDropdownOpen(false);
    setQuickUpload(QUICK_UPLOAD_EMPTY);
    setQuickFile(null);
    setScheduleOpen(false);
    setScheduleSeed(null);
  }, [open, editApp]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadResumes() {
      try {
        setLoadingResumes(true);
        const response = await resumesAPI.getAll();
        if (!cancelled) setResumes(Array.isArray(response.data) ? response.data : []);
      } catch {
        if (!cancelled) setResumeError('Could not load resumes');
      } finally {
        if (!cancelled) setLoadingResumes(false);
      }
    }
    loadResumes();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const recentResumes = useMemo(
    () =>
      [...resumes].sort((a, b) => {
        const left = new Date(a.lastUsedAt ?? a.updatedAt).getTime();
        const right = new Date(b.lastUsedAt ?? b.updatedAt).getTime();
        return right - left;
      }),
    [resumes]
  );

  const filteredResumes = useMemo(() => {
    const query = resumeSearch.trim().toLowerCase();
    if (!query) return recentResumes;
    return recentResumes.filter((resume) =>
      `${resume.title} ${resume.targetRole ?? ''} ${(resume.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(query)
    );
  }, [recentResumes, resumeSearch]);

  const smartSuggestions = useMemo(() => {
    if (!form.description.trim()) return [];
    return resumes
      .map((resume) => ({ resume, ...getResumeMatch(resume, form.description) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [resumes, form.description]);

  const selectedResume = resumes.find((resume) => resume._id === form.linkedResumeId) ?? null;
  const scheduledStage = mapStatusToStage(form.status);

  function setField(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateStatus(value: JobStatus) {
    setField('status', value);
    const stage = mapStatusToStage(value);
    if (stage) {
      const latestForStage = [...events].reverse().find((event) => event.stage === stage);
      setScheduleSeed(latestForStage ?? { stage, title: '', scheduledAt: '', notes: '' });
      setScheduleOpen(true);
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.position.trim()) next.position = 'Required';
    if (!form.companyName.trim()) next.companyName = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        linkedResumeId: form.linkedResumeId || null,
        resumeBullets: bullets,
        events,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleParse() {
    if (!form.description.trim()) {
      setAiError('Paste a job description first');
      return;
    }
    setParsing(true);
    setAiError('');
    try {
      const response = await aiAPI.parseJobDescription(form.description);
      const parsed = (response.data as any)?.parsedData ?? response.data;
      if (parsed?.companyName) setField('companyName', parsed.companyName);
      if (parsed?.role) setField('position', parsed.role);
      if (parsed?.salaryRange) setField('salaryRange', parsed.salaryRange);
    } catch {
      setAiError('Parsing failed. Check your server AI configuration.');
    } finally {
      setParsing(false);
    }
  }

  async function handleGenerate() {
    if (!form.description.trim()) {
      setAiError('Paste a job description first');
      return;
    }
    setGenerating(true);
    setAiError('');
    try {
      const response = await aiAPI.getResumeSuggestions(form.description);
      const data = response.data as any;
      setBullets(data?.bullets ?? data ?? []);
    } catch {
      setAiError('Failed to generate bullets. Check your server AI configuration.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyBullet(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }

  function onQuickFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setQuickFile(file);
    if (file && !quickUpload.title) {
      setQuickUpload((prev) => ({ ...prev, title: file.name.replace(/\.(pdf|docx|doc)$/i, '') }));
    }
  }

  async function handleQuickUpload() {
    if (!quickFile || !quickUpload.title.trim()) {
      setResumeError('Choose a file and add a resume name');
      return;
    }
    setQuickUploading(true);
    setResumeError('');
    try {
      const response = await resumesAPI.upload(quickFile, quickUpload.title.trim(), {
        targetRole: quickUpload.targetRole.trim() || undefined,
        tags: quickUpload.tags.split(',').map((item) => item.trim()).filter(Boolean),
      });
      const created = response.data;
      setResumes((prev) => [created, ...prev]);
      setField('linkedResumeId', created._id);
      setResumeDropdownOpen(false);
      setQuickUploadOpen(false);
      setQuickUpload(QUICK_UPLOAD_EMPTY);
      setQuickFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      setResumeError(error.response?.data?.message ?? 'Upload failed');
    } finally {
      setQuickUploading(false);
    }
  }

  function upsertEvent(nextEvent: ApplicationEvent) {
    setEvents((prev) => {
      const index = prev.findIndex(
        (event) =>
          event.stage === nextEvent.stage &&
          event.title.toLowerCase() === nextEvent.title.toLowerCase()
      );
      if (index >= 0) {
        const clone = [...prev];
        clone[index] = nextEvent;
        return clone.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
      }
      return [...prev, nextEvent].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    });
  }

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '14px',
    color: 'var(--text)',
    padding: '12px 14px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '7px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };

  return (
    <>
      <div
        onClick={(event) => event.target === event.currentTarget && onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px',
          background: 'rgba(3,8,18,0.7)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '980px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, rgba(18,24,38,0.98), rgba(9,13,22,0.98))',
            border: '1px solid rgba(129, 140, 248, 0.18)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(124,58,237,0.12), rgba(124,58,237,0))' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Application workspace</p>
              <h2 style={{ fontWeight: 800, fontSize: '24px', color: 'var(--text)', marginTop: '4px' }}>
                {editApp ? 'Update application' : 'Add a new application'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>Track the role, attach the exact resume, and schedule each hiring milestone while you’re here.</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', minHeight: 0, flex: 1 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Core details</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Role *</label>
                      <input style={{ ...inputStyle, borderColor: errors.position ? '#f87171' : 'rgba(255,255,255,0.09)' }} value={form.position} onChange={(event) => setField('position', event.target.value)} placeholder="Senior Frontend Engineer" />
                    </div>
                    <div>
                      <label style={labelStyle}>Company *</label>
                      <input style={{ ...inputStyle, borderColor: errors.companyName ? '#f87171' : 'rgba(255,255,255,0.09)' }} value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} placeholder="Acme Inc" />
                    </div>
                    <div>
                      <label style={labelStyle}>Date Applied</label>
                      <input style={inputStyle} type="date" value={form.appliedDate} onChange={(event) => setField('appliedDate', event.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Salary</label>
                      <input style={inputStyle} value={form.salaryRange} onChange={(event) => setField('salaryRange', event.target.value)} placeholder="$100k - $140k" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Job Description Link</label>
                      <input style={inputStyle} type="url" value={form.jobDescriptionLink} onChange={(event) => setField('jobDescriptionLink', event.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                  {(errors.position || errors.companyName) && (
                    <p style={{ color: '#f87171', fontSize: '11px', marginTop: '10px' }}>Role and company are required.</p>
                  )}
                </div>

                <div style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))', border: '1px solid rgba(99,102,241,0.24)', borderRadius: '20px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '14px', background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={18} style={{ color: '#c4b5fd' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>Smart resume match</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Linear-style recommendations based on the JD you paste.</p>
                    </div>
                  </div>
                  {smartSuggestions.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>Paste the job description and we’ll surface the best resume variants, plus keep scheduling and notes close to the application.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {smartSuggestions.map(({ resume, score, tagMatches, skillMatches }) => (
                        <button key={resume._id} type="button" onClick={() => setField('linkedResumeId', resume._id)} style={{ width: '100%', textAlign: 'left', borderRadius: '14px', border: `1px solid ${form.linkedResumeId === resume._id ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.08)'}`, background: form.linkedResumeId === resume._id ? 'rgba(124,58,237,0.18)' : 'rgba(10,14,22,0.5)', padding: '12px 13px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{resume.title}</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#c4b5fd' }}>{score}%</span>
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{[resume.targetRole, tagMatches[0], skillMatches[0]].filter(Boolean).join(' • ') || 'General fit'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Status</label>
                  {scheduledStage && (
                    <button type="button" onClick={() => { setScheduleSeed({ stage: scheduledStage, title: '', scheduledAt: '', notes: '' }); setScheduleOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.22)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                      <CalendarClock size={13} />
                      Schedule this stage
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {JOB_STATUSES.map((status) => {
                    const active = form.status === status.value;
                    return (
                      <button key={status.value} type="button" onClick={() => updateStatus(status.value)} style={{ padding: '9px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: active ? `${status.hex}22` : 'rgba(255,255,255,0.03)', color: active ? status.hex : 'var(--text-secondary)', border: `1px solid ${active ? `${status.hex}55` : 'rgba(255,255,255,0.06)'}` }}>
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.12fr 0.88fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Job Description</label>
                    <button type="button" onClick={handleParse} disabled={parsing} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--primary-border)', background: 'var(--primary-muted)', color: '#c4b5fd', opacity: parsing ? 0.6 : 1 }}>
                      {parsing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {parsing ? 'Parsing...' : 'AI Parse'}
                    </button>
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: '190px', resize: 'vertical', lineHeight: 1.6 }} value={form.description} onChange={(event) => setField('description', event.target.value)} rows={7} placeholder="Paste the job description to score resume fit, autofill fields, and keep stage scheduling grounded in the actual process." />
                  {aiError && (
                    <p style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                      <AlertCircle size={12} />
                      {aiError}
                    </p>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ ...labelStyle, marginBottom: '4px' }}>Resume Used</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Now in a compact dropdown instead of a long list.</p>
                    </div>
                    <button type="button" onClick={() => setQuickUploadOpen((prev) => !prev)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                      <FileUp size={13} />
                      {quickUploadOpen ? 'Hide upload' : 'Upload new'}
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setResumeDropdownOpen((prev) => !prev)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedResume?.title || 'No linked resume'}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedResume ? [selectedResume.targetRole, selectedResume.lastUsedAt ? `Last used ${new Date(selectedResume.lastUsedAt).toLocaleDateString()}` : null].filter(Boolean).join(' • ') : 'Attach the exact version you submitted'}
                        </p>
                      </div>
                      <ChevronDown size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    </button>

                    {resumeDropdownOpen && (
                      <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 10px)', left: 0, right: 0, background: '#0c1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', boxShadow: '0 20px 48px rgba(0,0,0,0.45)', overflow: 'hidden' }}>
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                          <input style={{ ...inputStyle, padding: '10px 12px' }} value={resumeSearch} onChange={(event) => setResumeSearch(event.target.value)} placeholder="Search resumes by title, role, or tag" />
                        </div>
                        <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button type="button" onClick={() => { setField('linkedResumeId', ''); setResumeDropdownOpen(false); }} style={{ textAlign: 'left', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: !form.linkedResumeId ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)', padding: '11px 12px', cursor: 'pointer' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>No linked resume</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Save this application without attaching one yet.</p>
                          </button>
                          {loadingResumes ? (
                            <div style={{ padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>Loading resumes...</div>
                          ) : filteredResumes.length === 0 ? (
                            <div style={{ padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>No resumes found.</div>
                          ) : (
                            filteredResumes.map((resume) => {
                              const selected = form.linkedResumeId === resume._id;
                              return (
                                <button key={resume._id} type="button" onClick={() => { setField('linkedResumeId', resume._id); setResumeDropdownOpen(false); }} style={{ textAlign: 'left', borderRadius: '12px', border: `1px solid ${selected ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.08)'}`, background: selected ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)', padding: '11px 12px', cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ minWidth: 0 }}>
                                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resume.title}</p>
                                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{[resume.targetRole, resume.applicationsUsedIn ? `${resume.applicationsUsedIn} uses` : null].filter(Boolean).join(' • ')}</p>
                                    </div>
                                    {selected && <Check size={14} style={{ color: '#c4b5fd', flexShrink: 0 }} />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {quickUploadOpen && (
                    <div style={{ border: '1px dashed rgba(255,255,255,0.14)', borderRadius: '16px', padding: '14px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onQuickFileChange} />
                      <input style={inputStyle} value={quickUpload.title} onChange={(event) => setQuickUpload((prev) => ({ ...prev, title: event.target.value }))} placeholder="Resume name" />
                      <input style={inputStyle} value={quickUpload.targetRole} onChange={(event) => setQuickUpload((prev) => ({ ...prev, targetRole: event.target.value }))} placeholder="Target role" />
                      <input style={inputStyle} value={quickUpload.tags} onChange={(event) => setQuickUpload((prev) => ({ ...prev, tags: event.target.value }))} placeholder="Tags, comma separated" />
                      <button type="button" onClick={handleQuickUpload} disabled={quickUploading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '11px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', fontWeight: 700, cursor: quickUploading ? 'not-allowed' : 'pointer', opacity: quickUploading ? 0.7 : 1 }}>
                        {quickUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {quickUploading ? 'Uploading...' : 'Upload and select'}
                      </button>
                    </div>
                  )}
                  {resumeError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '10px' }}>{resumeError}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ ...labelStyle, marginBottom: '4px' }}>Scheduled Stages</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone screens, interviews, offer calls, and custom milestones.</p>
                    </div>
                    <button type="button" onClick={() => { setScheduleSeed({ stage: scheduledStage ?? 'Custom', title: '', scheduledAt: '', notes: '' }); setScheduleOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                      <Plus size={13} />
                      Add event
                    </button>
                  </div>
                  {events.length === 0 ? (
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No stage dates yet. When you move an application into phone screen, interview, or offer, we’ll prompt you to schedule it.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {events.map((event, index) => (
                        <button key={`${event.stage}-${event.title}-${index}`} type="button" onClick={() => { setScheduleSeed(event); setScheduleOpen(true); }} style={{ textAlign: 'left', padding: '12px 13px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{event.title}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{event.stage} • {new Date(event.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                            <CalendarClock size={16} style={{ color: '#c4b5fd', flexShrink: 0 }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ ...labelStyle, marginBottom: '4px' }}>AI Resume Bullets</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Keep tailored bullets close to the application before you update the resume.</p>
                    </div>
                    <button type="button" onClick={handleGenerate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', opacity: generating ? 0.6 : 1 }}>
                      {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Generate
                    </button>
                  </div>

                  {bullets.length === 0 ? (
                    <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No bullets generated yet. Paste the JD and let AI draft role-specific achievements.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {bullets.map((bullet, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 13px' }}>
                          <span style={{ color: '#c4b5fd', fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>•</span>
                          <p style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{bullet}</p>
                          <button type="button" onClick={() => copyBullet(bullet, index)} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', background: copied === index ? 'rgba(52,211,153,0.16)' : 'rgba(255,255,255,0.03)', color: copied === index ? '#34d399' : 'var(--text-muted)' }}>
                            {copied === index ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '20px', padding: '18px' }}>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: 1.6 }} value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={4} placeholder="Referral context, recruiter details, prep ideas, feedback from interviews..." />
              </div>
            </div>

            <div style={{ width: '240px', borderLeft: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', padding: '22px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</p>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '6px' }}>{events.length}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>scheduled milestone{events.length === 1 ? '' : 's'}</p>
                </div>
                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected resume</p>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginTop: '6px' }}>{selectedResume?.title ?? 'None linked'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedResume?.targetRole ?? 'Choose the exact version sent'}</p>
                </div>
              </div>

              <div style={{ position: 'sticky', bottom: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" onClick={onClose} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.72 : 1 }}>
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? 'Saving...' : editApp ? 'Update application' : 'Create application'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ScheduleStageModal
        open={scheduleOpen}
        stage={scheduleSeed?.stage ?? 'Custom'}
        initialEvent={scheduleSeed}
        companyName={form.companyName}
        position={form.position}
        onClose={() => setScheduleOpen(false)}
        onSkip={() => setScheduleOpen(false)}
        onSave={async (event) => {
          upsertEvent(event);
          setScheduleOpen(false);
        }}
      />
    </>
  );
}

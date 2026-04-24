'use client';

import { useState, useEffect, FormEvent } from 'react';
import { JobApplication, JobStatus, ParsedJobData } from '@/types';
import { JOB_STATUSES } from '@/lib/utils/constants';
import { Loader2, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface ApplicationFormProps {
  application?: JobApplication;
  onSubmit: (data: Partial<JobApplication>) => Promise<void>;
  isLoading?: boolean;
}

const emptyForm = {
  jobTitle: '',
  companyName: '',
  description: '',
  jobDescriptionLink: '',
  status: 'applied' as JobStatus,
  notes: '',
  salaryRange: '',
  applicationDate: new Date().toISOString().split('T')[0],
};

export function ApplicationForm({ application, onSubmit, isLoading = false }: ApplicationFormProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isGeneratingBullets, setIsGeneratingBullets] = useState(false);
  const [resumeBullets, setResumeBullets] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (application) {
      setFormData({
        jobTitle: application.jobTitle ?? '',
        companyName: application.companyName ?? '',
        description: application.description ?? '',
        jobDescriptionLink: application.jobDescriptionLink ?? '',
        status: application.status ?? 'applied',
        notes: application.notes ?? '',
        salaryRange: application.salaryRange ?? '',
        applicationDate: application.applicationDate
          ? application.applicationDate.split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
      setResumeBullets(application.resumeBullets ?? []);
    }
  }, [application]);

  function set(field: keyof typeof emptyForm, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const newErrors: Partial<typeof emptyForm> = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ ...formData, resumeBullets });
  }

  async function handleParseJD() {
    if (!formData.description.trim()) {
      setParseError('Paste a job description first');
      return;
    }
    setIsParsing(true);
    setParseError('');
    try {
      const res = await fetch('/api/ai/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: formData.description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const parsed: ParsedJobData = data.parsedData;
      // Autofill form fields
      setFormData((prev) => ({
        ...prev,
        companyName: parsed.companyName || prev.companyName,
        jobTitle: parsed.role || prev.jobTitle,
        salaryRange: parsed.salaryRange || prev.salaryRange,
      }));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Parsing failed');
    } finally {
      setIsParsing(false);
    }
  }

  async function handleGenerateBullets() {
    if (!formData.description.trim()) {
      setParseError('Paste a job description first to generate bullets');
      return;
    }
    setIsGeneratingBullets(true);
    try {
      const res = await fetch('/api/ai/resume-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: formData.description, resumeContent: '' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResumeBullets(data.bullets ?? []);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to generate bullets');
    } finally {
      setIsGeneratingBullets(false);
    }
  }

  async function copyBullet(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  const inputStyle = {
    background: 'var(--surface-3)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    padding: '0.5rem 0.75rem',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row: Role + Company */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Role / Job Title *</label>
          <input
            style={{
              ...inputStyle,
              borderColor: errors.jobTitle ? '#f87171' : 'var(--border-strong)',
            }}
            value={formData.jobTitle}
            onChange={(e) => set('jobTitle', e.target.value)}
            placeholder="Senior Engineer"
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = errors.jobTitle ? '#f87171' : 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
          {errors.jobTitle && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
              <AlertCircle size={11} />{errors.jobTitle}
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle}>Company *</label>
          <input
            style={{
              ...inputStyle,
              borderColor: errors.companyName ? '#f87171' : 'var(--border-strong)',
            }}
            value={formData.companyName}
            onChange={(e) => set('companyName', e.target.value)}
            placeholder="Acme Inc"
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = errors.companyName ? '#f87171' : 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
          {errors.companyName && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
              <AlertCircle size={11} />{errors.companyName}
            </p>
          )}
        </div>
      </div>

      {/* Row: Link + Date + Status */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label style={labelStyle}>
            <ExternalLink size={11} className="inline mr-1" />JD Link
          </label>
          <input
            style={inputStyle}
            type="url"
            value={formData.jobDescriptionLink}
            onChange={(e) => set('jobDescriptionLink', e.target.value)}
            placeholder="https://..."
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label style={labelStyle}>Date Applied</label>
          <input
            style={inputStyle}
            type="date"
            value={formData.applicationDate}
            onChange={(e) => set('applicationDate', e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label style={labelStyle}>Salary Range</label>
          <input
            style={inputStyle}
            value={formData.salaryRange}
            onChange={(e) => set('salaryRange', e.target.value)}
            placeholder="$90k – $130k"
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label style={labelStyle}>Status</label>
        <div className="flex gap-2 flex-wrap">
          {JOB_STATUSES.map((s) => {
            const color = s.color.includes('sky') ? '#38bdf8'
              : s.color.includes('violet') ? '#a78bfa'
              : s.color.includes('amber') ? '#fbbf24'
              : s.color.includes('emerald') ? '#34d399'
              : '#f87171';
            const active = formData.status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: active ? `${color}20` : 'var(--surface-3)',
                  color: active ? color : 'var(--text-secondary)',
                  border: `1px solid ${active ? `${color}50` : 'var(--border)'}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Description + AI Parse */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label style={{ ...labelStyle, marginBottom: 0 }}>Job Description</label>
          <button
            type="button"
            onClick={handleParseJD}
            disabled={isParsing}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--primary-muted)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)',
              opacity: isParsing ? 0.6 : 1,
            }}
          >
            {isParsing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {isParsing ? 'Parsing…' : 'AI Parse'}
          </button>
        </div>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
          value={formData.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Paste the full job description here. Click 'AI Parse' to auto-fill fields and generate resume bullets."
          rows={4}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
        />
        {parseError && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
            <AlertCircle size={11} />{parseError}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical' }}
          value={formData.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Referral, recruiter name, next steps…"
          rows={2}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Resume Bullets */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              AI Resume Bullets
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Role-tailored bullet points to add to your resume
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateBullets}
            disabled={isGeneratingBullets}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--primary)',
              color: 'white',
              opacity: isGeneratingBullets ? 0.6 : 1,
            }}
          >
            {isGeneratingBullets ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            Generate
          </button>
        </div>

        {resumeBullets.length > 0 && (
          <div className="space-y-2">
            {resumeBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex gap-3 items-start p-3 rounded-lg group"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }}>
                  •
                </span>
                <p className="flex-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {bullet}
                </p>
                <button
                  type="button"
                  onClick={() => copyBullet(bullet, idx)}
                  className="flex-shrink-0 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all font-medium"
                  style={{
                    background: copiedIdx === idx ? 'rgba(52,211,153,0.15)' : 'var(--surface-3)',
                    color: copiedIdx === idx ? '#34d399' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {copiedIdx === idx ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: isLoading ? 'var(--surface-3)' : 'var(--primary)',
          color: isLoading ? 'var(--text-muted)' : 'white',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading && <Loader2 size={15} className="animate-spin" />}
        {isLoading ? 'Saving…' : application ? 'Update Application' : 'Add Application'}
      </button>
    </form>
  );
}

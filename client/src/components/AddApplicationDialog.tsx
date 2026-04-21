import { useState, useEffect, FormEvent } from 'react';
import { JobApplication, JobStatus, JOB_STATUSES } from '@/types';
import { Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import { aiAPI } from '@/services/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<JobApplication>) => Promise<void>;
  editApplication?: JobApplication;
}

const empty = {
  companyName: '',
  position: '',
  description: '',
  jobDescriptionLink: '',
  notes: '',
  salaryRange: '',
  status: 'applied' as JobStatus,
  appliedDate: new Date().toISOString().split('T')[0],
};

export default function AddApplicationDialog({ open, onOpenChange, onSubmit, editApplication }: Props) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Partial<typeof empty>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parseError, setParseError] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (editApplication) {
      setForm({
        companyName: editApplication.companyName ?? '',
        position: editApplication.position ?? '',
        description: editApplication.description ?? '',
        jobDescriptionLink: editApplication.jobDescriptionLink ?? '',
        notes: editApplication.notes ?? '',
        salaryRange: editApplication.salaryRange ?? '',
        status: editApplication.status ?? 'applied',
        appliedDate: editApplication.appliedDate
          ? editApplication.appliedDate.split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
      setBullets(editApplication.resumeBullets ?? []);
    } else {
      setForm(empty);
      setBullets([]);
    }
    setErrors({});
    setParseError('');
  }, [editApplication, open]);

  function set(k: keyof typeof empty, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  }

  function validate() {
    const e: Partial<typeof empty> = {};
    if (!form.companyName.trim()) e.companyName = 'Required';
    if (!form.position.trim()) e.position = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSubmit({ ...form, resumeBullets: bullets });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleParse() {
    if (!form.description.trim()) { setParseError('Paste a job description first'); return; }
    setIsParsing(true);
    setParseError('');
    try {
      const res = await aiAPI.parseJobDescription(form.description);
      const parsed = (res as any).data?.parsedData ?? res.data;
      if (parsed?.companyName) set('companyName', parsed.companyName);
      if (parsed?.role) set('position', parsed.role);
      if (parsed?.salaryRange) set('salaryRange', parsed.salaryRange);
    } catch {
      setParseError('Parsing failed. Check your OPENAI_API_KEY.');
    } finally {
      setIsParsing(false);
    }
  }

  async function handleGenerate() {
    if (!form.description.trim()) { setParseError('Paste a job description first'); return; }
    setIsGenerating(true);
    setParseError('');
    try {
      const res = await aiAPI.getResumeSuggestions('', form.description);
      const data = (res as any).data;
      setBullets(data?.bullets ?? data ?? []);
    } catch {
      setParseError('Failed to generate bullets. Check your OPENAI_API_KEY.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyBullet(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  if (!open) return null;

  const inp = {
    background: 'var(--surface-3)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    color: 'var(--text)',
    padding: '0.55rem 0.75rem',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as React.CSSProperties;

  const lbl = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '5px',
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
            {editApplication ? 'Edit Application' : 'New Application'}
          </h2>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: position + company */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Role / Position *</label>
                <input style={{ ...inp, borderColor: errors.position ? '#f87171' : 'var(--border-strong)' }}
                  value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="Senior Engineer"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.position ? '#f87171' : 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
                {errors.position && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.position}</p>}
              </div>
              <div>
                <label style={lbl}>Company *</label>
                <input style={{ ...inp, borderColor: errors.companyName ? '#f87171' : 'var(--border-strong)' }}
                  value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Acme Inc"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.companyName ? '#f87171' : 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
                {errors.companyName && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.companyName}</p>}
              </div>
            </div>

            {/* Row 2: link + date + salary */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label style={lbl}>JD Link</label>
                <input style={inp} type="url" value={form.jobDescriptionLink} onChange={(e) => set('jobDescriptionLink', e.target.value)} placeholder="https://..."
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div>
                <label style={lbl}>Date Applied</label>
                <input style={inp} type="date" value={form.appliedDate} onChange={(e) => set('appliedDate', e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div>
                <label style={lbl}>Salary Range</label>
                <input style={inp} value={form.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} placeholder="$90k–$130k"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            {/* Status pills */}
            <div>
              <label style={lbl}>Status</label>
              <div className="flex gap-2 flex-wrap">
                {JOB_STATUSES.map((s) => (
                  <button key={s.value} type="button" onClick={() => set('status', s.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: form.status === s.value ? `${s.hex}20` : 'var(--surface-3)',
                      color: form.status === s.value ? s.hex : 'var(--text-secondary)',
                      border: `1px solid ${form.status === s.value ? `${s.hex}50` : 'var(--border)'}`,
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job description + AI parse */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...lbl, marginBottom: 0 }}>Job Description</label>
                <button type="button" onClick={handleParse} disabled={isParsing}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                  style={{ background: 'var(--primary-muted)', color: 'var(--primary)', border: '1px solid var(--primary-border)', opacity: isParsing ? 0.6 : 1 }}>
                  {isParsing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {isParsing ? 'Parsing…' : 'AI Parse & Autofill'}
                </button>
              </div>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: '90px' } as React.CSSProperties}
                value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Paste the full job description — click 'AI Parse' to autofill company, role, salary and generate resume bullets."
                rows={4}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
              {parseError && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertCircle size={11} />{parseError}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties}
                value={form.notes} onChange={(e) => set('notes', e.target.value)}
                placeholder="Referral, recruiter contact, next steps…" rows={2}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            {/* Resume bullets */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>AI Resume Bullets</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tailored to this role — copy into your resume</p>
                </div>
                <button type="button" onClick={handleGenerate} disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ background: 'var(--primary)', color: 'white', opacity: isGenerating ? 0.6 : 1 }}>
                  {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Generate
                </button>
              </div>
              {bullets.length > 0 && (
                <div className="space-y-2">
                  {bullets.map((b, idx) => (
                    <div key={idx} className="group flex gap-2 items-start p-3 rounded-lg"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }}>•</span>
                      <p className="flex-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{b}</p>
                      <button type="button" onClick={() => copyBullet(b, idx)}
                        className="flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-all"
                        style={{
                          background: copiedIdx === idx ? 'rgba(52,211,153,0.15)' : 'var(--surface)',
                          color: copiedIdx === idx ? '#34d399' : 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}>
                        {copiedIdx === idx ? '✓' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: isLoading ? 'var(--surface-3)' : 'var(--primary)',
                color: isLoading ? 'var(--text-muted)' : 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}>
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isLoading ? 'Saving…' : editApplication ? 'Update Application' : 'Add Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

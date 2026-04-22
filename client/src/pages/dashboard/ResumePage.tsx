import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { resumesAPI } from '@/services/api';
import { Resume, formatFileSize } from '@/types';
import {
  Upload, FileText, Star, Download, Eye, Pencil, Trash2,
  CheckCircle, AlertCircle, X, Loader2, File,
} from 'lucide-react';

// ── Toast ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error'; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

// ── Rename modal ──────────────────────────────────────────────────────────────
function RenameModal({ resume, onSave, onClose }: { resume: Resume; onSave: (t: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState(resume.title);
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '14px', padding: '24px', width: '380px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>Rename Resume</h3>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(title); if (e.key === 'Escape') onClose(); }}
          style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', padding: '9px 12px', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
          <button onClick={() => onSave(title)} disabled={!title.trim()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Resume Card ───────────────────────────────────────────────────────────────
function ResumeCard({
  resume, onRename, onDelete, onSetDefault, onPreview, onDownload,
}: {
  resume: Resume;
  onRename:     (r: Resume) => void;
  onDelete:     (r: Resume) => void;
  onSetDefault: (r: Resume) => void;
  onPreview:    (r: Resume) => void;
  onDownload:   (r: Resume) => void;
}) {
  const isPdf = !!resume.filepath;

  return (
    <div className="resume-card" style={{
      background: 'var(--surface-2)', border: `1px solid ${resume.isDefault ? 'var(--primary-border)' : 'var(--border-strong)'}`,
      borderRadius: '14px', padding: '20px', position: 'relative', transition: 'all 0.2s',
    }}>
      {/* default badge */}
      {resume.isDefault && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '99px', background: 'rgba(99,102,241,0.18)', border: '1px solid var(--primary-border)' }}>
          <Star size={10} style={{ color: 'var(--primary)' }} fill="currentColor" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)' }}>DEFAULT</span>
        </div>
      )}

      {/* icon + name */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
          background: isPdf ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
          border: `1px solid ${isPdf ? 'rgba(239,68,68,0.25)' : 'var(--primary-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isPdf
            ? <File size={22} style={{ color: '#ef4444' }} />
            : <FileText size={22} style={{ color: 'var(--primary)' }} />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: resume.isDefault ? '80px' : '0' }}>
            {resume.title}
          </p>
          {resume.originalName && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resume.originalName}
            </p>
          )}
        </div>
      </div>

      {/* meta */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Uploaded</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {resume.size && (
          <div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Size</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatFileSize(resume.size)}</p>
          </div>
        )}
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Type</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isPdf ? 'PDF' : 'Text'}</p>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {isPdf && (
          <button onClick={() => onPreview(resume)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <Eye size={12} />Preview
          </button>
        )}
        {isPdf && (
          <button onClick={() => onDownload(resume)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#34d399'; e.currentTarget.style.color = '#34d399'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <Download size={12} />Download
          </button>
        )}
        <button onClick={() => onRename(resume)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <Pencil size={12} />Rename
        </button>
        {!resume.isDefault && (
          <button onClick={() => onSetDefault(resume)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <Star size={12} />Set Default
          </button>
        )}
        <button onClick={() => onDelete(resume)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s', marginLeft: 'auto' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--surface-3)'; }}>
          <Trash2 size={12} />Delete
        </button>
      </div>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUpload }: { onUpload: (file: File, title: string) => Promise<void> }) {
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string {
    if (file.type !== 'application/pdf') return 'Only PDF files are accepted';
    if (file.size > 10 * 1024 * 1024)   return 'File must be smaller than 10 MB';
    return '';
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setPendingFile(file);
    setTitleInput(file.name.replace(/\.pdf$/i, ''));
    setError('');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setPendingFile(file);
    setTitleInput(file.name.replace(/\.pdf$/i, ''));
    setError('');
  }

  async function handleUpload() {
    if (!pendingFile || !titleInput.trim()) return;
    setUploading(true); setProgress(10);
    try {
      // simulate progress
      const interval = setInterval(() => setProgress((p) => Math.min(p + 15, 85)), 200);
      await onUpload(pendingFile, titleInput.trim());
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => { setProgress(0); setUploading(false); setPendingFile(null); setTitleInput(''); }, 600);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false); setProgress(0);
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>Upload Resume</h2>

      {!pendingFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`,
            borderRadius: '12px', padding: '40px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragging ? 'var(--primary-muted)' : 'var(--surface-2)',
          }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: dragging ? 'var(--primary-muted)' : 'var(--surface-3)', border: `1px solid ${dragging ? 'var(--primary-border)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={22} style={{ color: dragging ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', color: dragging ? 'var(--primary)' : 'var(--text)', marginBottom: '4px' }}>
              {dragging ? 'Drop your PDF here' : 'Drag & drop your PDF'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse · PDF only · max 10 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onFileChange} />
        </div>
      ) : (
        <div style={{ border: '1px solid var(--primary-border)', borderRadius: '12px', padding: '16px', background: 'var(--primary-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <File size={18} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatFileSize(pendingFile.size)}</p>
            </div>
            <button onClick={() => { setPendingFile(null); setTitleInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Resume Title
            </label>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="e.g. SWE Resume, Frontend Resume"
              style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--border-strong)'; }}
            />
          </div>

          {uploading && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ height: '4px', borderRadius: '2px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: 'var(--primary)', width: `${progress}%`, transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Uploading… {progress}%</p>
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading || !titleInput.trim()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px', borderRadius: '9px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload Resume'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '12px' }}>
          <AlertCircle size={13} />{error}
        </div>
      )}
    </div>
  );
}

// ── PDF Preview Modal ─────────────────────────────────────────────────────────
function PdfModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: 'min(900px, 95vw)', height: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px', borderRadius: '6px' }}>
            <X size={18} />
          </button>
        </div>
        <iframe src={url} style={{ flex: 1, border: 'none' }} title={title} />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileText size={28} style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>No resumes yet</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
          Upload a PDF resume above. You can store multiple versions — SWE, Frontend, Internship, etc.
        </p>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '14px', padding: '20px' }}>
      <div className="skeleton" style={{ height: '44px', width: '44px', borderRadius: '10px', marginBottom: '14px' }} />
      <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '11px', width: '40%', marginBottom: '18px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="skeleton" style={{ height: '30px', width: '80px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '30px', width: '80px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '30px', width: '80px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResumePage() {
  const [resumes,       setResumes]       = useState<Resume[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [renamingResume,setRenamingResume] = useState<Resume | null>(null);
  const [previewResume, setPreviewResume]  = useState<Resume | null>(null);
  const { toasts, show: showToast }       = useToast();

  async function load() {
    try {
      setLoading(true);
      const r = await resumesAPI.getAll();
      setResumes(Array.isArray(r.data) ? r.data : (r.data as any).data ?? []);
    } catch {
      showToast('Failed to load resumes', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(file: File, title: string) {
    await resumesAPI.upload(file, title);
    await load();
    showToast(`"${title}" uploaded successfully`);
  }

  async function handleRename(resume: Resume, title: string) {
    try {
      await resumesAPI.rename(resume._id, title);
      await load();
      setRenamingResume(null);
      showToast('Resume renamed');
    } catch {
      showToast('Rename failed', 'error');
    }
  }

  async function handleSetDefault(resume: Resume) {
    try {
      await resumesAPI.setDefault(resume._id);
      await load();
      showToast(`"${resume.title}" set as default`);
    } catch {
      showToast('Failed to set default', 'error');
    }
  }

  async function handleDelete(resume: Resume) {
    if (!confirm(`Delete "${resume.title}"? This cannot be undone.`)) return;
    try {
      await resumesAPI.delete(resume._id);
      setResumes((p) => p.filter((r) => r._id !== resume._id));
      showToast('Resume deleted');
    } catch {
      showToast('Delete failed', 'error');
    }
  }

  function handlePreview(resume: Resume) { setPreviewResume(resume); }

  function handleDownload(resume: Resume) {
    if (!resume.filepath) return;
    const url = resumesAPI.fileUrl(resume.filepath);
    const a   = document.createElement('a');
    a.href = url; a.download = resume.originalName || resume.title + '.pdf';
    a.click();
  }

  const defaultResume = resumes.find((r) => r.isDefault);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease' }}>
      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Resume Library</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {resumes.length} resume{resumes.length !== 1 ? 's' : ''} · {defaultResume ? `Default: ${defaultResume.title}` : 'No default set'}
          </p>
        </div>
      </div>

      {/* ── upload zone ── */}
      <UploadZone onUpload={handleUpload} />

      {/* ── library grid ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
          Your Resumes
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {resumes.map((r) => (
              <ResumeCard
                key={r._id}
                resume={r}
                onRename={setRenamingResume}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {renamingResume && (
        <RenameModal
          resume={renamingResume}
          onSave={(t) => handleRename(renamingResume, t)}
          onClose={() => setRenamingResume(null)}
        />
      )}
      {previewResume?.filepath && (
        <PdfModal
          url={resumesAPI.fileUrl(previewResume.filepath)}
          title={previewResume.title}
          onClose={() => setPreviewResume(null)}
        />
      )}

      {/* ── Toasts ── */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 300, pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 16px', borderRadius: '10px',
            background: t.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
            border: `1px solid ${t.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: t.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '13px', fontWeight: 500, animation: 'fadeIn 0.2s ease',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {t.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        .resume-card:hover { border-color: rgba(255,255,255,0.2) !important; box-shadow: var(--shadow-sm); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

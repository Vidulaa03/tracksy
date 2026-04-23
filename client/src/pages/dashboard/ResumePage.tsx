import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Download, Eye, FileText, Loader2, Pencil, RefreshCw, Star, Trash2, Upload, X } from 'lucide-react';

import { resumesAPI } from '@/services/api';
import { Resume, formatFileSize } from '@/types';

type Toast = { id: number; message: string; type: 'success' | 'error' };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function show(message: string, type: Toast['type'] = 'success') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500);
  }
  return { toasts, show };
}

function RenameModal({ resume, onSave, onClose }: { resume: Resume; onSave: (title: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState(resume.title);
  return (
    <div onClick={(event) => event.target === event.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '14px', padding: '24px', width: '380px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>Rename Resume</h3>
        <input value={title} onChange={(event) => setTitle(event.target.value)} style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', padding: '9px 12px', fontSize: '14px', outline: 'none', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
          <button onClick={() => onSave(title)} disabled={!title.trim()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function PdfModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div onClick={(event) => event.target === event.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: 'min(960px, 95vw)', height: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <iframe src={url} style={{ flex: 1, border: 'none' }} title={title} />
      </div>
    </div>
  );
}

function UploadZone({ onUpload }: { onUpload: (file: File, title: string, targetRole: string, tags: string) => Promise<void> }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [tags, setTags] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function validate(file: File) {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) return 'Only PDF, DOC, and DOCX files are accepted';
    if (file.size > 10 * 1024 * 1024) return 'File must be smaller than 10 MB';
    return '';
  }

  function pickFile(file: File) {
    const problem = validate(file);
    if (problem) {
      setError(problem);
      return;
    }
    setPendingFile(file);
    setTitle(file.name.replace(/\.(pdf|docx|doc)$/i, ''));
    setError('');
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) pickFile(file);
  }

  async function handleUpload() {
    if (!pendingFile || !title.trim()) return;
    setUploading(true);
    try {
      await onUpload(pendingFile, title.trim(), targetRole.trim(), tags);
      setPendingFile(null);
      setTitle('');
      setTargetRole('');
      setTags('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>Upload Resume</h2>
      {!pendingFile ? (
        <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`, borderRadius: '12px', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', background: dragging ? 'var(--primary-muted)' : 'var(--surface-2)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: dragging ? 'var(--primary-muted)' : 'var(--surface-3)', border: `1px solid ${dragging ? 'var(--primary-border)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={22} style={{ color: dragging ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', color: dragging ? 'var(--primary)' : 'var(--text)', marginBottom: '4px' }}>{dragging ? 'Drop your resume here' : 'Drag and drop your resume'}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse · PDF / DOCX / DOC · max 10 MB</p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={(event) => event.target.files?.[0] && pickFile(event.target.files[0])} />
        </div>
      ) : (
        <div style={{ border: '1px solid var(--primary-border)', borderRadius: '12px', padding: '16px', background: 'var(--primary-muted)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{pendingFile.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatFileSize(pendingFile.size)}</p>
            </div>
            <button onClick={() => { setPendingFile(null); setTitle(''); setTargetRole(''); setTags(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resume title" style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', padding: '8px 12px', fontSize: '13px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Target role" style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', padding: '8px 12px', fontSize: '13px' }} />
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags, comma separated" style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text)', padding: '8px 12px', fontSize: '13px' }} />
          </div>
          <button onClick={handleUpload} disabled={uploading || !title.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px', borderRadius: '9px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '12px' }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}

function ResumeCard({
  resume,
  onRename,
  onDelete,
  onSetDefault,
  onPreview,
  onDownload,
  onDuplicate,
  onReplace,
}: {
  resume: Resume;
  onRename: (resume: Resume) => void;
  onDelete: (resume: Resume) => void;
  onSetDefault: (resume: Resume) => void;
  onPreview: (resume: Resume) => void;
  onDownload: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onReplace: (resume: Resume) => void;
}) {
  return (
    <div className="resume-card" style={{ background: 'var(--surface-2)', border: `1px solid ${resume.isDefault ? 'var(--primary-border)' : 'var(--border-strong)'}`, borderRadius: '14px', padding: '20px', position: 'relative', transition: 'all 0.2s' }}>
      {resume.isDefault && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '99px', background: 'rgba(99,102,241,0.18)', border: '1px solid var(--primary-border)' }}>
          <Star size={10} style={{ color: 'var(--primary)' }} fill="currentColor" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)' }}>DEFAULT</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: resume.isDefault ? '80px' : '0' }}>{resume.title}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{[resume.targetRole, resume.originalName].filter(Boolean).join(' · ') || 'General resume'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>ATS Score</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resume.atsScore ?? '—'}</p>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Applications</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resume.applicationsUsedIn ?? 0}</p>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Last Used</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resume.lastUsedAt ? new Date(resume.lastUsedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not yet used'}</p>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Success Rate</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resume.successRate ?? 0}%</p>
        </div>
      </div>

      {!!resume.tags?.length && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {resume.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-border)', padding: '4px 8px', borderRadius: '999px' }}>{tag}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {resume.filepath && <button onClick={() => onPreview(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}><Eye size={12} />Preview</button>}
        {resume.filepath && <button onClick={() => onDownload(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}><Download size={12} />Download</button>}
        <button onClick={() => onRename(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}><Pencil size={12} />Rename</button>
        <button onClick={() => onDuplicate(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}><Copy size={12} />Duplicate</button>
        <button onClick={() => onReplace(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}><RefreshCw size={12} />Replace</button>
        {!resume.isDefault && <button onClick={() => onSetDefault(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}><Star size={12} />Set Default</button>}
        <button onClick={() => onDelete(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, marginLeft: 'auto' }}><Trash2 size={12} />Delete</button>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingResume, setRenamingResume] = useState<Resume | null>(null);
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<Resume | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const { toasts, show } = useToast();

  async function load() {
    try {
      setLoading(true);
      const response = await resumesAPI.getAll();
      setResumes(Array.isArray(response.data) ? response.data : []);
    } catch {
      show('Failed to load resumes', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(file: File, title: string, targetRole: string, tags: string) {
    await resumesAPI.upload(file, title, {
      targetRole: targetRole || undefined,
      tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
    });
    await load();
    show(`"${title}" uploaded successfully`);
  }

  async function handleRename(resume: Resume, title: string) {
    try {
      await resumesAPI.rename(resume._id, title);
      setRenamingResume(null);
      await load();
      show('Resume renamed');
    } catch {
      show('Rename failed', 'error');
    }
  }

  async function handleSetDefault(resume: Resume) {
    try {
      await resumesAPI.setDefault(resume._id);
      await load();
      show(`"${resume.title}" set as default`);
    } catch {
      show('Failed to set default', 'error');
    }
  }

  async function handleDelete(resume: Resume) {
    if (!confirm(`Delete "${resume.title}"?`)) return;
    try {
      await resumesAPI.delete(resume._id);
      setResumes((prev) => prev.filter((item) => item._id !== resume._id));
      show('Resume deleted');
    } catch (error: any) {
      show(error.response?.data?.message || 'Delete failed', 'error');
    }
  }

  async function handleDuplicate(resume: Resume) {
    try {
      await resumesAPI.duplicate(resume._id);
      await load();
      show('Resume duplicated');
    } catch {
      show('Duplicate failed', 'error');
    }
  }

  function handleDownload(resume: Resume) {
    if (!resume.filepath) return;
    const anchor = document.createElement('a');
    anchor.href = resumesAPI.fileUrl(resume.filepath);
    anchor.download = resume.originalName || `${resume.title}.pdf`;
    anchor.click();
  }

  function requestReplace(resume: Resume) {
    setReplaceTarget(resume);
    replaceInputRef.current?.click();
  }

  async function handleReplaceFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !replaceTarget) return;
    try {
      await resumesAPI.replace(replaceTarget._id, file);
      await load();
      show(`"${replaceTarget.title}" replaced`);
    } catch (error: any) {
      show(error.response?.data?.message || 'Replace failed', 'error');
    } finally {
      setReplaceTarget(null);
      event.target.value = '';
    }
  }

  const defaultResume = resumes.find((resume) => resume.isDefault);
  const totalLinked = resumes.reduce((sum, resume) => sum + (resume.applicationsUsedIn ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease' }}>
      <input ref={replaceInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleReplaceFile} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Resume Library</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{resumes.length} resumes · {defaultResume ? `Default: ${defaultResume.title}` : 'No default set'} · {totalLinked} linked applications</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: '10px', flex: 1, minWidth: '340px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Best Performing</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{[...resumes].sort((a, b) => (b.successRate ?? 0) - (a.successRate ?? 0))[0]?.title ?? '—'}</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Avg ATS Score</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{resumes.length ? Math.round(resumes.reduce((sum, resume) => sum + (resume.atsScore ?? 0), 0) / resumes.length) : 0}</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Interview Hits</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{resumes.reduce((sum, resume) => sum + (resume.interviewCount ?? 0), 0)}</p>
          </div>
        </div>
      </div>

      <UploadZone onUpload={handleUpload} />

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>My Resumes</h2>
        {loading ? (
          <div className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />
        ) : resumes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>No resumes uploaded yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>Upload your first resume and start linking the right version to each application.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {resumes.map((resume) => (
              <ResumeCard
                key={resume._id}
                resume={resume}
                onRename={setRenamingResume}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onPreview={setPreviewResume}
                onDownload={handleDownload}
                onDuplicate={handleDuplicate}
                onReplace={requestReplace}
              />
            ))}
          </div>
        )}
      </div>

      {renamingResume && <RenameModal resume={renamingResume} onSave={(title) => handleRename(renamingResume, title)} onClose={() => setRenamingResume(null)} />}
      {previewResume?.filepath && <PdfModal url={resumesAPI.fileUrl(previewResume.filepath)} title={previewResume.title} onClose={() => setPreviewResume(null)} />}

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 300, pointerEvents: 'none' }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', borderRadius: '10px', background: toast.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, color: toast.type === 'success' ? '#34d399' : '#f87171', fontSize: '13px', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`.resume-card:hover { border-color: rgba(255,255,255,0.2) !important; box-shadow: var(--shadow-sm); } @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

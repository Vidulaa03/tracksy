import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Download, Edit3, Eye, FileText, Loader2, Plus, Star, Trash2, Upload, UploadCloud, X } from 'lucide-react';

import { resumesAPI } from '@/services/api';
import { Resume, formatFileSize } from '@/types';

type Toast = { id: number; message: string; type: 'success' | 'error' };

type EditorState = {
  title: string;
  targetRole: string;
  skills: string;
  tags: string;
  experienceLevel: '' | 'student' | 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  content: string;
};

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

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function show(message: string, type: Toast['type'] = 'success') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500);
  }
  return { toasts, show };
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

  async function handleUpload() {
    if (!pendingFile || !title.trim()) return;
    setUploading(true);
    try {
      await onUpload(pendingFile, title.trim(), targetRole.trim(), tags);
      setPendingFile(null);
      setTitle('');
      setTargetRole('');
      setTags('');
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>Upload Resume</h2>
      {!pendingFile ? (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) pickFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`,
            borderRadius: '12px',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            background: dragging ? 'var(--primary-muted)' : 'var(--surface-2)',
          }}
        >
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
  onEdit,
  onPreview,
  onDownload,
  onDuplicate,
  onDelete,
}: {
  resume: Resume;
  onEdit: (resume: Resume) => void;
  onPreview: (resume: Resume) => void;
  onDownload: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onDelete: (resume: Resume) => void;
}) {
  return (
    <div className="resume-card" style={{ background: 'var(--surface-2)', border: `1px solid ${resume.isDefault ? 'var(--primary-border)' : 'var(--border-strong)'}`, borderRadius: '14px', padding: '20px', position: 'relative', transition: 'all 0.2s' }}>
      {resume.isDefault && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '99px', background: 'rgba(99,102,241,0.18)', border: '1px solid var(--primary-border)' }}>
          <Star size={10} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)' }}>DEFAULT</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: resume.isDefault ? '80px' : '0' }}>{resume.title}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{[resume.targetRole, resume.filename].filter(Boolean).join(' · ') || 'Editable resume version'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Uses</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resume.applicationsUsedIn ?? 0}</p>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Last updated</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
        </div>
      </div>

      {!!resume.tags?.length && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {resume.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-border)', padding: '4px 8px', borderRadius: '999px' }}>{tag}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => onEdit(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: resume.filepath ? 'not-allowed' : 'pointer', opacity: resume.filepath ? 0.55 : 1, fontSize: '12px', fontWeight: 600 }} disabled={!!resume.filepath}><Edit3 size={12} />Edit</button>
        <button onClick={() => onPreview(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}><Eye size={12} />Preview</button>
        {resume.filepath && (
          <button onClick={() => onDownload(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}><Download size={12} />Download</button>
        )}
        {resume.content && (
          <button onClick={() => onDuplicate(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}><Copy size={12} />Copy</button>
        )}
        <button onClick={() => onDelete(resume)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(248,113,113,0.22)', background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginLeft: 'auto' }}><Trash2 size={12} />Delete</button>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ suggestions: string[]; bullets: string[] } | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    title: '',
    targetRole: '',
    skills: '',
    tags: '',
    experienceLevel: '',
    content: '',
  });
  const { toasts, show } = useToast();

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      setLoading(true);
      const response = await resumesAPI.getAll();
      setResumes(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Unable to load resumes');
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof EditorState>(field: K, value: EditorState[K]) {
    setEditor((prev) => ({ ...prev, [field]: value }));
  }

  function openEditor(resume?: Resume) {
    if (resume) {
      setSelectedResume(resume);
      setEditor({
        title: resume.title,
        targetRole: resume.targetRole || '',
        skills: resume.skills?.join(', ') || '',
        tags: resume.tags?.join(', ') || '',
        experienceLevel: resume.experienceLevel || '',
        content: resume.content || '',
      });
      setSuggestions(null);
      setShowEditor(true);
      return;
    }
    setSelectedResume(null);
    setEditor({ title: '', targetRole: '', skills: '', tags: '', experienceLevel: '', content: '' });
    setSuggestions(null);
    setShowEditor(true);
  }

  function resetEditor() {
    setSelectedResume(null);
    setEditor({ title: '', targetRole: '', skills: '', tags: '', experienceLevel: '', content: '' });
    setSuggestions(null);
    setShowEditor(false);
  }

  async function handleSave() {
    if (!editor.title.trim() || !editor.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      title: editor.title.trim(),
      content: editor.content.trim(),
      targetRole: editor.targetRole.trim() || undefined,
      skills: editor.skills.split(',').map((item) => item.trim()).filter(Boolean),
      tags: editor.tags.split(',').map((item) => item.trim()).filter(Boolean),
      experienceLevel: editor.experienceLevel || undefined,
    };

    try {
      if (selectedResume) {
        await resumesAPI.update(selectedResume._id, payload);
        show('Resume updated');
      } else {
        await resumesAPI.create(payload);
        show('Resume created');
      }
      await loadResumes();
      setSelectedResume(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save resume');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(resume: Resume) {
    if (!confirm(`Delete "${resume.title}"?`)) return;
    try {
      await resumesAPI.delete(resume._id);
      setResumes((prev) => prev.filter((item) => item._id !== resume._id));
      if (selectedResume?._id === resume._id) resetEditor();
      show('Resume deleted');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  async function handleDuplicate(resume: Resume) {
    try {
      await resumesAPI.duplicate(resume._id);
      await loadResumes();
      show('Resume duplicated');
    } catch {
      setError('Duplicate failed');
    }
  }

  function handleDownload(resume: Resume) {
    if (!resume.filepath) return;
    const anchor = document.createElement('a');
    anchor.href = resumesAPI.fileUrl(resume.filepath);
    anchor.download = resume.originalName || resume.filename || `${resume.title}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function handlePreviewFile(resume: Resume) {
    if (!resume.filepath) return;
    setPreviewPdfUrl(resumesAPI.fileUrl(resume.filepath));
    setPreviewPdfTitle(resume.title);
    setPreviewResume(null);
  }

  function printResumePDF(content: string, title = 'Resume') {
    if (typeof window === 'undefined') return;
    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
      body{font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; color:#111827; margin:0; padding:32px;}
      .resume{max-width:900px;margin:auto;}
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

  function importFile(file: File) {
    if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      const title = file.name.replace(/\.[^/.]+$/, '');
      resumesAPI.upload(file, title, { targetRole: undefined, tags: [] })
        .then(async () => {
          await loadResumes();
          show(`Imported resume "${title}"`);
        })
        .catch(() => setError('Import failed'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setShowEditor(true);
      setSelectedResume(null);
      setEditor((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: text,
      }));
      setSuggestions(null);
    };
    reader.readAsText(file);
  }

  const summary = {
    total: resumes.length,
    linked: resumes.reduce((sum, resume) => sum + (resume.applicationsUsedIn ?? 0), 0),
    defaultTitle: resumes.find((resume) => resume.isDefault)?.title || 'None',
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '16px', padding: '16px 20px', color: '#b91c1c' }}>
          <p style={{ fontWeight: 700, margin: 0 }}>Oops — {error}</p>
        </div>
      )}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1.45fr 0.85fr' }}>
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '12px', fontWeight: 700, color: 'var(--cyan)' }}>Resume builder</p>
            <h1 style={{ marginTop: '16px', fontSize: '38px', lineHeight: 1.05, fontWeight: 800, color: 'var(--text)' }}>Build, improve, and export resumes from one live workspace.</h1>
            <p style={{ marginTop: '18px', maxWidth: '720px', fontSize: '15px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
              Manage editable resume versions, generate AI-powered improvements, and export polished PDF drafts without leaving your dashboard.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => openEditor()} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={16} /> Create new resume
              </button>
              <button onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx,.txt,.md';
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (file) {
                    if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                      const title = file.name.replace(/\.[^/.]+$/, '');
                      await resumesAPI.upload(file, title, { targetRole: undefined, tags: [] });
                      await loadResumes();
                      show(`Imported resume "${title}"`);
                    } else {
                      importFile(file);
                    }
                  }
                };
                input.click();
              }} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 700 }}>
                <UploadCloud size={16} /> Import resume
              </button>
            </div>
          </div>
          <div style={{ borderRadius: '24px', border: '1px solid var(--border)', background: 'rgba(99,102,241,0.06)', padding: '24px', display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Live resume workspace</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Create and manage real resume versions with no more plain storage.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Resumes</span>
                <strong style={{ fontSize: '20px', color: 'var(--text)' }}>{summary.total}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Linked apps</span>
                <strong style={{ fontSize: '20px', color: 'var(--text)' }}>{summary.linked}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default version</span>
                <strong style={{ fontSize: '20px', color: 'var(--text)' }}>{summary.defaultTitle}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1.4fr 0.9fr' }}>
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>Resume builder</h2>
                <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Edit existing versions, save drafts, and generate export-ready content from one workspace.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => openEditor()} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>New resume</button>
                <button onClick={() => previewResume?.content && printResumePDF(previewResume.content, previewResume.title)} disabled={!previewResume?.content} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: previewResume?.content ? 'var(--primary)' : 'rgba(209,213,219,0.4)', color: 'white', cursor: previewResume?.content ? 'pointer' : 'not-allowed', fontWeight: 700 }}>Export PDF</button>
              </div>
            </div>

            {showEditor ? (
              <div style={{ display: 'grid', gap: '18px' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Resume title</label>
                  <input value={editor.title} onChange={(event) => setField('title', event.target.value)} placeholder="Professional resume title" style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '14px 16px', fontSize: '14px' }} />
                </div>

                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Target role</label>
                    <input value={editor.targetRole} onChange={(event) => setField('targetRole', event.target.value)} placeholder="Product manager, designer, engineer" style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '14px 16px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Experience level</label>
                    <select value={editor.experienceLevel} onChange={(event) => setField('experienceLevel', event.target.value as any)} style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '14px 16px', fontSize: '14px' }}>
                      <option value="">Select level</option>
                      <option value="student">Student</option>
                      <option value="fresher">Fresher</option>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Skills</label>
                    <input value={editor.skills} onChange={(event) => setField('skills', event.target.value)} placeholder="e.g. product strategy, SQL" style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '14px 16px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Tags</label>
                    <input value={editor.tags} onChange={(event) => setField('tags', event.target.value)} placeholder="e.g. SaaS, executive" style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', padding: '14px 16px', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Resume content</label>
                  <textarea value={editor.content} onChange={(event) => setField('content', event.target.value)} rows={12} placeholder="Write or paste your resume content here" style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text)', padding: '18px', fontSize: '14px', lineHeight: 1.7, minHeight: '280px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleSave} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {selectedResume ? 'Save changes' : 'Save resume'}
                  </button>
                  <button onClick={resetEditor} style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>Close editor</button>
                </div>

                {suggestions && (
                  <div style={{ borderRadius: '18px', border: '1px solid var(--border)', background: 'rgba(99,102,241,0.04)', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>AI improvements ready</h3>
                      <button onClick={() => setSuggestions(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>Dismiss</button>
                    </div>
                    {suggestions.suggestions.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Suggested summary updates</p>
                        <ul style={{ display: 'grid', gap: '8px', listStyle: 'disc', marginLeft: '18px', color: 'var(--text-secondary)' }}>
                          {suggestions.suggestions.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {suggestions.bullets.length > 0 && (
                      <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bullet improvements</p>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {suggestions.bullets.map((bullet, index) => (
                            <button key={index} onClick={() => setField('content', `${editor.content}\n- ${bullet}`)} style={{ textAlign: 'left', width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}>
                              {bullet}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface-2)', padding: '42px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', textAlign: 'center' }}>
                <FileText size={38} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>Open the resume editor</h3>
                  <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>Create a new resume or select an existing version from the right panel to start editing.</p>
                </div>
                <button onClick={() => openEditor()} style={{ padding: '12px 18px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Create new draft</button>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>Resume preview</h2>
            {previewResume ? (
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gap: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{previewResume.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{previewResume.targetRole || 'No role set'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => openEditor(previewResume)} style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                      <button onClick={() => previewResume.content && printResumePDF(previewResume.content, previewResume.title)} disabled={!previewResume.content} style={{ padding: '8px 12px', borderRadius: '12px', border: 'none', background: previewResume.content ? 'var(--primary)' : 'rgba(209,213,219,0.4)', color: 'white', cursor: previewResume.content ? 'pointer' : 'not-allowed', fontSize: '12px' }}>Export PDF</button>
                    </div>
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{previewResume.content || 'No editable text content available.'}</pre>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '14px', borderRadius: '16px', border: '1px dashed var(--border)', padding: '32px', background: 'var(--surface-2)' }}>
                <FileText size={28} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>Select a resume card to preview its current text content and export it as a clean PDF.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>Resume library</h2>
                <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>All saved versions are available here. Edit, duplicate, improve, or remove any resume.</p>
              </div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--text-muted)' }}>Version hub</span>
            </div>

            {loading ? (
              <div style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Loader2 size={18} className="animate-spin" /> Loading resumes...</div>
            ) : resumes.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={28} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>No resume versions yet</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>Start by creating a new draft or importing an existing file.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume._id}
                    resume={resume}
                    onEdit={(item) => openEditor(item)}
                    onPreview={(item) => item.filepath && !item.content ? handlePreviewFile(item) : setPreviewResume(item)}
                    onDownload={handleDownload}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          <UploadZone onUpload={async (file, title, targetRole, tags) => {
            const metadata = {
              targetRole: targetRole.trim() || undefined,
              tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
            };

            if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
              await resumesAPI.upload(file, title, metadata);
            } else {
              const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
              });
              await resumesAPI.create({
                title,
                content: text,
                ...metadata,
              });
            }
            await loadResumes();
            show(`Imported resume "${title}"`);
          }} />
        </div>
      </div>

      {previewPdfUrl && <PdfModal url={previewPdfUrl} title={previewPdfTitle} onClose={() => setPreviewPdfUrl(null)} />}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 300, pointerEvents: 'none' }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '14px', background: toast.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, color: toast.type === 'success' ? '#16a34a' : '#ef4444', fontSize: '13px', fontWeight: 600, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

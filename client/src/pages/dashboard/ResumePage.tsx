import { useState, useEffect } from 'react';
import { resumesAPI } from '../../services/api';
import { Resume } from '../../types';
import { Plus, FileText, Trash2, Loader2, AlertCircle } from 'lucide-react';

function SkeletonResume() {
  return (
    <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ height: '13px', width: '60%', marginBottom: '5px' }} />
      <div className="skeleton" style={{ height: '11px', width: '40%' }} />
    </div>
  );
}

export default function ResumePage() {
  const [resumes,  setResumes]  = useState<Resume[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState<Resume | null>(null);
  const [editing,  setEditing]  = useState(false);
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');

  async function load() {
    try {
      setLoading(true);
      const r = await resumesAPI.getAll();
      setResumes(Array.isArray(r.data) ? r.data : (r.data as any).data ?? []);
    } catch { setError('Failed to load resumes'); }
    finally  { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startNew() { setSelected(null); setTitle(''); setContent(''); setEditing(true); }
  function startEdit(r: Resume) { setSelected(r); setTitle(r.title); setContent(r.content); setEditing(true); }

  async function handleSave() {
    if (!title.trim() || !content.trim()) { setError('Title and content are required'); return; }
    setSaving(true);
    try {
      if (selected) {
        await resumesAPI.update(selected._id, { title, content });
      } else {
        await resumesAPI.create({ title, content });
      }
      await load();
      setEditing(false); setSelected(null);
    } catch { setError('Failed to save resume'); }
    finally  { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resume?')) return;
    await resumesAPI.delete(id);
    setResumes((p) => p.filter((r) => r._id !== id));
    if (selected?._id === id) { setSelected(null); setEditing(false); }
  }

  const inp: React.CSSProperties = {
    background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
    borderRadius: '9px', color: 'var(--text)', padding: '9px 12px',
    width: '100%', fontSize: '13px', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
  };
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Resume</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Store resumes and generate AI bullets when adding applications</p>
        </div>
        {!editing && (
          <button onClick={startNew}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '13px' }}>
            <Plus size={14} />New Resume
          </button>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={14} />{error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: 0.6 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>

        {/* sidebar list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Saved</p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonResume /><SkeletonResume />
            </div>
          ) : resumes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <FileText size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No resumes yet</p>
            </div>
          ) : (
            resumes.map((r) => (
              <div key={r._id} className="resume-item"
                onClick={() => startEdit(r)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.12s', background: selected?._id === r._id ? 'var(--primary-muted)' : 'transparent', border: `1px solid ${selected?._id === r._id ? 'var(--primary-border)' : 'transparent'}` }}>
                <FileText size={14} style={{ color: selected?._id === r._id ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
                  className="del-btn"
                  style={{ opacity: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px', display: 'flex', transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* editor */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                  {selected ? 'Edit Resume' : 'New Resume'}
                </h2>
                <button onClick={() => { setEditing(false); setSelected(null); }}
                  style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>Title</label>
                <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Engineer Resume" onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Content <span style={{ color: 'var(--text-muted)' }}>({content.length} chars)</span>
                </label>
                <textarea
                  style={{ ...inp, resize: 'vertical', minHeight: '360px', fontFamily: 'DM Mono, monospace', fontSize: '12px', lineHeight: 1.7 } as React.CSSProperties}
                  value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder={'EXPERIENCE\nSenior Engineer, Acme (2022–present)\n• Built X using Y, reducing Z by 40%\n\nSKILLS\nTypeScript, React, Node.js, PostgreSQL'}
                  onFocus={focus as any} onBlur={blur as any}
                />
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', background: saving ? 'var(--surface-3)' : 'var(--primary)', color: saving ? 'var(--text-muted)' : 'white' }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving…' : selected ? 'Save Changes' : 'Create Resume'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
              <FileText size={32} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Select a resume to edit, or create a new one</p>
            </div>
          )}
        </div>
      </div>

      <style>{`.resume-item:hover .del-btn { opacity: 1 !important; }`}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Eye, FileText, Pencil, Trash2 } from 'lucide-react';

import ApplicationDialog from '../../components/ApplicationDialog';
import { applicationsAPI, resumesAPI } from '../../services/api';
import { JobApplication, getStatusConfig } from '../../types';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const response = await applicationsAPI.getById(id!);
      setApp(response.data);
    } catch {
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleEditSubmit(data: Partial<JobApplication>) {
    await applicationsAPI.update(id!, data);
    await load();
  }

  async function handleDelete() {
    if (!confirm('Delete this application?')) return;
    await applicationsAPI.delete(id!);
    navigate('/dashboard/applications');
  }

  function handleResumePreview() {
    if (!app?.linkedResume?.filepath) return;
    window.open(resumesAPI.fileUrl(app.linkedResume.filepath), '_blank', 'noopener,noreferrer');
  }

  function handleResumeDownload() {
    if (!app?.linkedResume?.filepath) return;
    const anchor = document.createElement('a');
    anchor.href = resumesAPI.fileUrl(app.linkedResume.filepath);
    anchor.download = app.linkedResume.originalName || `${app.linkedResume.title}.pdf`;
    anchor.click();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '920px' }}>
        <div className="skeleton" style={{ height: '16px', width: '100px' }} />
        <div className="skeleton" style={{ height: '240px', borderRadius: '14px' }} />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div style={{ padding: '24px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', color: '#f87171' }}>
        {error || 'Application not found'}
      </div>
    );
  }

  const statusConfig = getStatusConfig(app.status);

  const field = (label: string, value?: string) => value ? (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: 'var(--text)' }}>{value}</p>
    </div>
  ) : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '920px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/dashboard/applications')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
          <ArrowLeft size={15} />
          Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            <Pencil size={13} />
            Edit
          </button>
          <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{app.position}</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{app.companyName}</p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '99px', background: `${statusConfig.hex}18`, color: statusConfig.hex }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusConfig.hex }} />
              {statusConfig.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {field('Applied', new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}
            {field('Salary', app.salaryRange)}
            {app.jobDescriptionLink && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Job Post</p>
                <a href={app.jobDescriptionLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
                  <ExternalLink size={13} />
                  View posting
                </a>
              </div>
            )}
          </div>

          {app.notes && (
            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Notes</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{app.notes}</p>
            </div>
          )}

          {app.description && (
            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Job Description</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{app.description}</p>
            </div>
          )}

          {app.resumeBullets && app.resumeBullets.length > 0 && (
            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>AI Resume Bullets</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {app.resumeBullets.map((bullet, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>•</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Resume used</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>The exact version attached to this application.</p>
              </div>
            </div>

            {app.linkedResume ? (
              <>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{app.linkedResume.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {app.linkedResume.targetRole || 'General resume'}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <button onClick={handleResumePreview} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    <Eye size={13} />
                    Preview
                  </button>
                  <button onClick={handleResumeDownload} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    <Download size={13} />
                    Download
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Last edited {app.linkedResume.updatedAt ? new Date(app.linkedResume.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No resume linked yet. Edit this application to attach the right version.</p>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Resume history</p>
            {!app.resumeHistory || app.resumeHistory.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No resume changes recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {app.resumeHistory.map((entry) => (
                  <div key={entry._id} style={{ borderLeft: '2px solid var(--primary-border)', paddingLeft: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text)' }}>
                      {entry.oldResume?.title ?? 'No resume'} → {entry.newResume?.title ?? 'No resume'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(entry.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Timeline</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderLeft: '2px solid rgba(99,102,241,0.35)', paddingLeft: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>Applied</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              {(app.events ?? []).length === 0 ? (
                <div style={{ borderLeft: '2px dashed var(--border)', paddingLeft: '12px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No stage dates scheduled yet.</p>
                </div>
              ) : (
                [...(app.events ?? [])]
                  .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
                  .map((event, index) => (
                    <div key={`${event.stage}-${index}`} style={{ borderLeft: '2px solid rgba(251,191,36,0.35)', paddingLeft: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{event.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{event.stage}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(event.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ApplicationDialog open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleEditSubmit} editApp={app} />
    </div>
  );
}

import { useState } from 'react';
import { applicationsAPI } from '@/services/api';
import { JobApplication, JOB_STATUSES, getStatusConfig } from '@/types';
import { Download, FileText, Table, CheckCircle, AlertCircle, Loader2, BarChart2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(apps: JobApplication[]) {
  const headers = ['Company', 'Position', 'Status', 'Applied Date', 'Salary Range', 'Notes'];
  const rows = apps.map((a) => [
    a.companyName,
    a.position,
    getStatusConfig(a.status).label,
    new Date(a.appliedDate).toLocaleDateString(),
    a.salaryRange ?? '',
    (a.notes ?? '').replace(/,/g, ';').replace(/\n/g, ' '),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `tracksy-applications-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── PDF export ────────────────────────────────────────────────────────────────
function exportPDF(apps: JobApplication[]) {
  const doc    = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const width  = doc.internal.pageSize.getWidth();
  const now    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── cover / stats section ─────────────────────────────────────────
  doc.setFillColor(8, 12, 20);
  doc.rect(0, 0, width, 100, 'F');

  doc.setTextColor(240, 244, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Tracksy — Application Report', 40, 44);

  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.setTextColor(136, 146, 164);
  doc.text(`Generated ${now}`, 40, 62);

  // stat boxes
  const statData = [
    { label: 'Total',      value: apps.length,                                           color: [99,102,241]  as [number,number,number] },
    { label: 'Applied',    value: apps.filter((a) => a.status === 'applied').length,     color: [56,189,248]  as [number,number,number] },
    { label: 'Interviews', value: apps.filter((a) => a.status === 'interview').length,   color: [251,191,36]  as [number,number,number] },
    { label: 'Offers',     value: apps.filter((a) => a.status === 'offer').length,       color: [52,211,153]  as [number,number,number] },
    { label: 'Rejected',   value: apps.filter((a) => a.status === 'rejected').length,   color: [248,113,113] as [number,number,number] },
  ];

  const bw = 90, bh = 36, bGap = 12, startX = width - (statData.length * (bw + bGap)) - 20;
  statData.forEach((s, i) => {
    const x = startX + i * (bw + bGap);
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
    doc.roundedRect(x, 20, bw, bh, 6, 6, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    doc.setTextColor(s.color[0], s.color[1], s.color[2]);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(String(s.value), x + bw / 2, 37, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(s.label, x + bw / 2, 50, { align: 'center' });
  });

  // ── table ─────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 115,
    head: [['Company', 'Position', 'Status', 'Applied', 'Salary', 'Notes']],
    body: apps.map((a) => [
      a.companyName,
      a.position,
      getStatusConfig(a.status).label,
      new Date(a.appliedDate).toLocaleDateString(),
      a.salaryRange ?? '—',
      (a.notes ?? '').slice(0, 60) + (a.notes?.length > 60 ? '…' : ''),
    ]),
    headStyles:   { fillColor: [22, 30, 46], textColor: [136, 146, 164], fontStyle: 'bold', fontSize: 9 },
    bodyStyles:   { fillColor: [15, 22, 35], textColor: [240, 244, 255], fontSize: 9 },
    alternateRowStyles: { fillColor: [22, 30, 46] },
    columnStyles: {
      0: { cellWidth: 120 }, 1: { cellWidth: 150 }, 2: { cellWidth: 80 },
      3: { cellWidth: 80  }, 4: { cellWidth: 80  }, 5: { cellWidth: 'auto' },
    },
    margin: { left: 40, right: 40 },
    tableLineColor: [28, 38, 56],
    tableLineWidth: 0.5,
  });

  // ── status breakdown ──────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  if (finalY < doc.internal.pageSize.getHeight() - 60) {
    doc.setTextColor(240, 244, 255);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Status Breakdown', 40, finalY);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(136, 146, 164);

    let xOff = 40;
    statData.forEach((s) => {
      const pct = apps.length ? ((s.value / apps.length) * 100).toFixed(1) : '0.0';
      doc.setTextColor(s.color[0], s.color[1], s.color[2]);
      doc.text(`${s.label}: ${s.value} (${pct}%)`, xOff, finalY + 18);
      xOff += 140;
    });
  }

  doc.save(`tracksy-report-${Date.now()}.pdf`);
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: `1px solid ${color}28`, borderRadius: '12px', padding: '16px 20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExportPage() {
  const [apps,    setApps]    = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function loadData() {
    setLoading(true); setError('');
    try {
      const r = await applicationsAPI.getAll();
      const data = Array.isArray(r.data) ? r.data : (r.data as any).data ?? [];
      setApps(data); setLoaded(true);
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  function handleCSV() {
    exportCSV(apps);
    showToast('CSV downloaded');
  }

  function handlePDF() {
    exportPDF(apps);
    showToast('PDF report downloaded');
  }

  const stats = JOB_STATUSES.map((s) => ({
    ...s,
    count: apps.filter((a) => a.status === s.value).length,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease', maxWidth: '860px' }}>
      {/* header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Export</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Download your applications as CSV or a styled PDF report</p>
      </div>

      {/* load data */}
      {!loaded ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>Load your data first</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fetch all applications to preview and export</p>
          </div>
          <button onClick={loadData} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={15} />}
            {loading ? 'Loading…' : 'Load Applications'}
          </button>
          {error && (
            <p style={{ color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={13} />{error}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {stats.map((s) => (
              <SummaryCard key={s.value} label={s.label} value={s.count} color={s.hex} />
            ))}
          </div>

          {/* export buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* CSV */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Table size={22} style={{ color: '#34d399' }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>Export CSV</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Spreadsheet-compatible file with all {apps.length} applications. Open in Excel, Google Sheets, or any CSV viewer.
              </p>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['Company', 'Position', 'Status', 'Applied Date', 'Salary', 'Notes'].map((col) => (
                  <span key={col} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{col}</span>
                ))}
              </div>
              <button onClick={handleCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 600, fontSize: '14px', cursor: 'pointer', justifyContent: 'center', border: '1px solid rgba(52,211,153,0.3)' } as any}>
                <Download size={16} />Download CSV
              </button>
            </div>

            {/* PDF */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <FileText size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>PDF Report</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Styled landscape PDF with summary stats and a full application table. Ready to share with career coaches or mentors.
              </p>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['Cover stats', 'Full table', 'Status breakdown', 'Dark theme'].map((f) => (
                  <span key={f} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: 'var(--primary-muted)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>{f}</span>
                ))}
              </div>
              <button onClick={handlePDF}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', justifyContent: 'center' }}>
                <Download size={16} />Download PDF Report
              </button>
            </div>
          </div>

          {/* preview table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Data Preview</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{apps.length} records</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Company', 'Position', 'Status', 'Applied', 'Salary'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 10).map((app, i) => {
                    const sc = getStatusConfig(app.status);
                    return (
                      <tr key={app._id} style={{ borderBottom: i < Math.min(apps.length - 1, 9) ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{app.companyName}</td>
                        <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{app.position}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: `${sc.hex}15`, color: sc.hex }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.hex }} />{sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{app.salaryRange ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {apps.length > 10 && (
                <p style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface-2)', textAlign: 'center' }}>
                  + {apps.length - 10} more rows in export
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 300, display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', borderRadius: '10px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: '13px', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle size={15} />{toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

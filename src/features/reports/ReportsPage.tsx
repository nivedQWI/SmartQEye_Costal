// ============================================================
// SmartQEye Coastal — Formal Police Reports (/reports)
// As specified in Costal Police .docx
// ============================================================

import { useState } from 'react';
import {
  FileText, Download, Calendar, Shield, Clock,
  CheckCircle2, FileCheck, Filter, ArrowDownToLine,
  Printer, AlertCircle
} from 'lucide-react';
import { cn, formatIST } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';
import type { PoliceReport, PoliceReportType } from '@/types';

const FORMAL_REPORT_TEMPLATES: Array<{
  type: PoliceReportType;
  title: string;
  badge: string;
  desc: string;
  period: string;
}> = [
  {
    type: 'DAILY_INCIDENT_SUMMARY',
    title: 'Daily Incident Summary',
    badge: 'OPERATIONAL',
    desc: 'Executive summary of all coastal surveillance observations, target contacts, triggered alerts, and operator triage actions over the last 24 hours.',
    period: '24 Hours (Daily)',
  },
  {
    type: 'WEEKLY_SLA_AUDIT',
    title: 'Weekly Response-Time & SLA Audit',
    badge: 'SUPERVISORY',
    desc: 'Formal supervisory audit of operator acknowledgment latencies, critical escalation response times, and compliance with Kerala Police Coastal SLA.',
    period: '7 Days (Weekly)',
  },
  {
    type: 'DRONE_UTILISATION_30DAY',
    title: 'Drone Utilisation (30-Day Fleet Analysis)',
    badge: 'LOGISTICS',
    desc: 'Comprehensive 30-day technical analysis of fleet flight hours, sortie battery cycles, maintenance schedules, and coverage heatmaps across the 6 UAVs.',
    period: '30 Days (Monthly)',
  },
  {
    type: 'MISSION_AAR',
    title: 'Mission After-Action Report (AAR)',
    badge: 'EVIDENCE',
    desc: 'Forensic sortie mission dossier with full telemetry traces, keyframe evidence, pilot remarks, and SHA-256 tamper-evident integrity hashes.',
    period: 'Per-Sortie',
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<PoliceReport[]>([
    {
      id: 'rep-01',
      reportType: 'DAILY_INCIDENT_SUMMARY',
      title: 'Daily Incident Summary — Vizhinjam Sector (12-Oct-2026)',
      periodCovered: '12 Oct 2026 00:00 – 12 Oct 2026 23:59 IST',
      generatedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      generatedBy: 'Insp. Anoop Nair (KP-4421)',
      signOffOfficer: 'SP Coastal Operations, Thiruvananthapuram',
      fileSizeMb: 4.8,
      downloadUrl: '#',
    },
    {
      id: 'rep-02',
      reportType: 'WEEKLY_SLA_AUDIT',
      title: 'Weekly Operator Response-Time Audit (Week 41)',
      periodCovered: '05 Oct 2026 – 11 Oct 2026 IST',
      generatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      generatedBy: 'System Automated Auditor',
      signOffOfficer: 'DIG Coastal Security, Kerala Police',
      fileSizeMb: 6.2,
      downloadUrl: '#',
    },
    {
      id: 'rep-03',
      reportType: 'DRONE_UTILISATION_30DAY',
      title: 'Drone Fleet 30-Day Technical Utilisation Analysis',
      periodCovered: '13 Sep 2026 – 12 Oct 2026 IST',
      generatedAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
      generatedBy: 'Tech Officer Santhosh P.',
      signOffOfficer: 'Director of Police Telecommunications, Kerala',
      fileSizeMb: 11.4,
      downloadUrl: '#',
    },
    {
      id: 'rep-04',
      reportType: 'MISSION_AAR',
      title: 'AAR: MSN-20261011-1820-00-CHARLIE (Breakwater Security)',
      periodCovered: '11 Oct 2026 18:20 – 19:22 IST',
      generatedAt: new Date(Date.now() - 64 * 3600 * 1000).toISOString(),
      generatedBy: 'SI Ramesh Kumar (KP-8842)',
      signOffOfficer: 'Circle Inspector, Vizhinjam Coastal PS',
      fileSizeMb: 8.7,
      downloadUrl: '#',
    },
  ]);

  const [generatingType, setGeneratingType] = useState<PoliceReportType | null>(null);
  const [selectedDrone, setSelectedDrone] = useState('ALL');
  const [signOffName, setSignOffName] = useState('Superintendent of Police, Coastal Security');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  function handleStartGenerate(type: PoliceReportType) {
    setGeneratingType(type);
  }

  function handleConfirmGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!generatingType) return;
    setIsGenerating(true);

    const tmpl = FORMAL_REPORT_TEMPLATES.find(t => t.type === generatingType)!;

    setTimeout(() => {
      const now = new Date();
      const newReport: PoliceReport = {
        id: `rep-${Date.now()}`,
        reportType: generatingType,
        title: `${tmpl.title} — ${now.toLocaleDateString('en-GB')}`,
        periodCovered: `Generated ${formatIST(now.toISOString())} (${selectedDrone === 'ALL' ? 'Fleet-wide' : selectedDrone})`,
        generatedAt: now.toISOString(),
        generatedBy: 'Authorized Desk Operator (Kerala Police)',
        signOffOfficer: signOffName,
        fileSizeMb: parseFloat((Math.random() * 4 + 3).toFixed(1)),
        downloadUrl: '#',
      };

      setReports([newReport, ...reports]);
      setIsGenerating(false);
      setGeneratingType(null);
      setSuccessToast(`Report "${newReport.title}" generated and signed successfully.`);
      setTimeout(() => setSuccessToast(null), 4000);
    }, 1200);
  }

  function handleSimulatedDownload(report: PoliceReport) {
    // Simulated PDF blob download
    const dummyContent = `KERALA POLICE - COASTAL SECURITY OPERATIONS\nReport: ${report.title}\nOfficer: ${report.signOffOfficer}\nGenerated: ${formatIST(report.generatedAt)}\nSHA-256 Verification: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.reportType}_${report.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Formal Police Reports &amp; Exports
          </h1>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            On-demand generation of formal Kerala Police statutory reports, SLA compliance audits, and fleet dossiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-mono font-medium border"
            style={{ background: 'var(--sand-200)', borderColor: 'var(--sand-300)', color: 'var(--ink-900)' }}>
            Compliance: Kerala Police IT Act 2000
          </span>
        </div>
      </div>

      {/* Success notification banner */}
      {successToast && (
        <div className="rounded-xl p-3 bg-emerald-500/15 border border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TOP: 4 ON-DEMAND FORMAL POLICE REPORT GENERATORS
         ══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="w-4 h-4 text-[var(--sea-600)]" />
          <h2 className="font-serif text-sm font-bold uppercase tracking-wider">
            On-Demand Formal Report Templates (PDF)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FORMAL_REPORT_TEMPLATES.map(t => (
            <div
              key={t.type}
              className="rounded-2xl p-4 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
              style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}>
                    {t.badge}
                  </span>
                  <span className="text-[11px] font-mono opacity-60">{t.period}</span>
                </div>
                <h3 className="font-serif text-sm font-bold leading-snug mb-2" style={{ color: 'var(--text)' }}>
                  {t.title}
                </h3>
                <p className="text-xs opacity-75 line-clamp-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {t.desc}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t flex justify-end" style={{ borderColor: 'var(--line)' }}>
                <button
                  onClick={() => handleStartGenerate(t.type)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-[var(--sea-600)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Generate PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MODAL: REPORT GENERATION CONFIGURATION
         ══════════════════════════════════════════════════ */}
      {generatingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-3xl p-6 border shadow-2xl bg-white dark:bg-[var(--raised)] space-y-4"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="text-[10px] font-mono font-bold text-[var(--sea-600)] uppercase">Statutory Report</span>
                <h3 className="font-serif text-lg font-bold">
                  {FORMAL_REPORT_TEMPLATES.find(t => t.type === generatingType)?.title}
                </h3>
              </div>
              <button
                onClick={() => setGeneratingType(null)}
                className="text-xs opacity-60 hover:opacity-100 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  Drone Unit Scope
                </label>
                <select
                  value={selectedDrone}
                  onChange={e => setSelectedDrone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                  style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
                >
                  <option value="ALL">All Active UAV Sorties (Fleet-wide)</option>
                  {UAVS.map(u => (
                    <option key={u.id} value={u.droneCode}>
                      {u.droneCode} ({u.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  Sign-off Authorizing Officer
                </label>
                <input
                  type="text"
                  required
                  value={signOffName}
                  onChange={e => setSignOffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                  style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
                />
              </div>

              <div className="p-3 rounded-xl text-[11px] font-mono leading-relaxed" style={{ background: 'var(--sand-100)', color: 'var(--ink-900)' }}>
                <strong>Evidence Compliance Notice:</strong>
                <p className="opacity-75 mt-0.5">
                  Generated document will be embedded with cryptographic SHA-256 telemetry hashes and watermarked with Kerala Police Seal per Indian Evidence Act §65B.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratingType(null)}
                  className="px-4 py-2 rounded-xl font-bold border"
                  style={{ borderColor: 'var(--line)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[var(--sea-600)] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isGenerating ? 'Compiling PDF…' : 'Confirm & Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          BOTTOM: HISTORICAL GENERATED REPORTS LEDGER
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm flex-1 flex flex-col"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--sea-600)]" />
            <h3 className="font-serif text-sm font-bold">Historical Generated Reports Ledger</h3>
          </div>
          <span className="text-xs opacity-60">{reports.length} generated records</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                <th className="py-2.5 px-3">Report Document Title</th>
                <th className="py-2.5 px-3">Period Covered</th>
                <th className="py-2.5 px-3">Generated At</th>
                <th className="py-2.5 px-3">Sign-off Officer</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b transition-colors hover:bg-[var(--sand-100)]" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-2.5 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div>
                        <span className="font-bold" style={{ color: 'var(--text)' }}>{r.title}</span>
                        <div className="text-[10px] opacity-60 font-mono">ID: {r.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 opacity-80">{r.periodCovered}</td>
                  <td className="py-2.5 px-3 font-mono opacity-80">{formatIST(r.generatedAt)}</td>
                  <td className="py-2.5 px-3 font-medium text-[11px]">{r.signOffOfficer}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{r.fileSizeMb} MB</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleSimulatedDownload(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors bg-[var(--sand-200)] text-[var(--ink-900)] hover:bg-[var(--sand-300)]"
                      style={{ borderColor: 'var(--sand-300)' }}
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

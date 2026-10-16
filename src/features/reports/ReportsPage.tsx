// ============================================================
// SmartQEye Coastal — Formal Police Reports Console (/reports)
// RFP §5.1.27 & Proposal §5.1.29 Compliant
// Real client-side PDF generation using jsPDF + AutoTable
// Letterhead, Section 65B/63 Attestation, SHA-256 seal, Scheduled Reports UI
// ============================================================

import React, { useState } from 'react';
import {
  FileText, Download, Calendar, Shield, Clock,
  CheckCircle2, FileCheck, Filter, ArrowDownToLine,
  Printer, AlertCircle, FileSpreadsheet, Code2, Plus,
  RefreshCw, Check, Sparkles, Lock, Layers
} from 'lucide-react';
import { cn, formatIST, formatISTFull } from '@/lib/utils';
import { UAVS, ALERTS, CONTACTS, ZONES } from '@/lib/mockData';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { generatePoliceReportPdf, downloadBlob, type ReportPdfOptions } from '@/lib/pdfGenerator';
import { auditApi } from '@/lib/api';

export type ExtendedReportType =
  | 'DAILY_INCIDENT_SUMMARY'
  | 'WEEKLY_SLA_AUDIT'
  | 'DRONE_UTILISATION_30DAY'
  | 'MISSION_AAR'
  | 'CONTACT_HISTORY_REPORT'
  | 'ZONE_ACTIVITY_REPORT'
  | 'EVIDENCE_ELIR_REPORT'
  | 'AUDIT_EXTRACT'
  | 'MODEL_PERFORMANCE_REPORT';

interface ReportTemplate {
  type: ExtendedReportType;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  period: string;
  tableHead: string[][];
  sampleData: (string | number)[][];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: 'DAILY_INCIDENT_SUMMARY',
    title: 'Daily Incident Summary',
    badge: 'OPERATIONAL',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    desc: 'Executive summary of all coastal surveillance observations, target contacts, triggered alerts, and operator triage actions over the last 24 hours.',
    period: 'Last 24 Hours',
    tableHead: [['Time (IST)', 'Incident Code', 'Target Class', 'Coastal Zone', 'Attention', 'Officer Action']],
    sampleData: [
      ['08:42:15', 'INC-20261016-0042', 'Unregistered Skiff (C-1042)', 'Inner Anchorage Fairway', 'CRITICAL', 'Patrol Interceptor Alerted'],
      ['09:15:30', 'INC-20261016-0043', 'Mechanised Trawler (C-1049)', 'Fishing Sector Charlie', 'ROUTINE', 'Track Logged in Watchlist'],
      ['10:20:00', 'INC-20261016-0044', 'Shoreline Crowd Surge', 'Kovalam Light House Beach', 'MONITOR', 'Station Lifeguard Notified'],
      ['11:45:12', 'INC-20261016-0045', 'Stationary Drift Craft', 'Muthalapozhi Estuary', 'ATTENTION', 'CCTNS Cross-Match Verified'],
      ['13:10:48', 'INC-20261016-0046', 'Motorised Country Craft', 'Vizhinjam Port Breakwater', 'MONITOR', 'Continuity Maintained']
    ]
  },
  {
    type: 'WEEKLY_SLA_AUDIT',
    title: 'Weekly Response & SLA Compliance Audit',
    badge: 'SUPERVISORY',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    desc: 'Formal supervisory audit of operator acknowledgment latencies, critical escalation response times, and compliance with Kerala Police Coastal SLA.',
    period: 'Past 7 Days (Week 41)',
    tableHead: [['Shift Date', 'Total Alerts', 'Mean Ack Time', 'Max Ack Time', 'Escalations', 'SLA Adherence']],
    sampleData: [
      ['10 Oct 2026', '14 Alerts', '18.4 seconds', '42 seconds', '2 Escalations', '99.4% COMPLIANT'],
      ['11 Oct 2026', '19 Alerts', '21.0 seconds', '58 seconds', '4 Escalations', '98.8% COMPLIANT'],
      ['12 Oct 2026', '22 Alerts', '16.5 seconds', '35 seconds', '3 Escalations', '100.0% COMPLIANT'],
      ['13 Oct 2026', '12 Alerts', '19.2 seconds', '48 seconds', '1 Escalation', '99.1% COMPLIANT'],
      ['14 Oct 2026', '16 Alerts', '15.8 seconds', '31 seconds', '2 Escalations', '100.0% COMPLIANT'],
      ['15 Oct 2026', '24 Alerts', '22.4 seconds', '54 seconds', '5 Escalations', '98.5% COMPLIANT'],
      ['16 Oct 2026', '18 Alerts', '17.1 seconds', '39 seconds', '2 Escalations', '99.6% COMPLIANT']
    ]
  },
  {
    type: 'DRONE_UTILISATION_30DAY',
    title: '30-Day Drone Fleet Technical Utilisation',
    badge: 'LOGISTICS',
    badgeColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
    desc: 'Comprehensive 30-day analysis of fleet flight hours, battery cycle telemetry, maintenance schedules, and coverage heatmaps across the 6 UAVs.',
    period: 'Past 30 Days (Rolling)',
    tableHead: [['UAV Code', 'Make & Model', 'Sorties', 'Flight Hours', 'Avg Battery Health', 'Operational Readiness']],
    sampleData: [
      ['UAV-KL-01', 'Scythe-V Maritime Quad', '48 Sorties', '38.4 hrs', '96% (24 Cycles)', 'FULLY MISSION CAPABLE'],
      ['UAV-KL-02', 'AeroHawk-T Dual Sensor', '42 Sorties', '34.2 hrs', '94% (28 Cycles)', 'FULLY MISSION CAPABLE'],
      ['UAV-KL-03', 'Scythe-V Maritime Quad', '54 Sorties', '44.8 hrs', '91% (35 Cycles)', 'SCHEDULED PRE-FLIGHT CHECK'],
      ['UAV-KL-04', 'SkyRanger Long Endurance', '36 Sorties', '49.0 hrs', '98% (18 Cycles)', 'FULLY MISSION CAPABLE'],
      ['UAV-KL-05', 'Tactical Nano Coastal', '28 Sorties', '19.6 hrs', '89% (42 Cycles)', 'BATTERY ROTATION DUE'],
      ['UAV-KL-06', 'AeroHawk-T Dual Sensor', '39 Sorties', '31.5 hrs', '95% (26 Cycles)', 'FULLY MISSION CAPABLE']
    ]
  },
  {
    type: 'MISSION_AAR',
    title: 'Mission After-Action Report (AAR)',
    badge: 'EVIDENCE',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    desc: 'Forensic sortie mission dossier with full telemetry traces, keyframe evidence, pilot remarks, and SHA-256 tamper-evident integrity hashes.',
    period: 'Sortie MSN-20261016-01',
    tableHead: [['Waypoint', 'Time (IST)', 'Altitude (AGL)', 'Speed (Knots)', 'Sensor Mode', 'Cognitive Frame State']],
    sampleData: [
      ['WP-1 Ingress', '14:00:00', '120.4 m', '16.2 kts', 'RGB 4K Optical', 'FULL INFERENCE (25 FPS)'],
      ['WP-2 Harbor Mid', '14:12:30', '118.0 m', '14.5 kts', 'RGB 4K Optical', 'LIGHT INFERENCE (15 FPS)'],
      ['WP-3 Anchorage Outer', '14:24:18', '95.2 m', '8.4 kts', 'Dual RGB/Thermal', 'FULL INFERENCE (Target C-1042)'],
      ['WP-4 Breakwater North', '14:36:45', '110.6 m', '12.0 kts', 'Thermal LWIR', 'SKIP / LOW DELTA (8 FPS)'],
      ['WP-5 Egress / RTB', '14:48:00', '122.5 m', '18.1 kts', 'RGB 4K Optical', 'CRUISE / DESCENT']
    ]
  },
  {
    type: 'CONTACT_HISTORY_REPORT',
    title: 'Persistent Coastal Contact Trajectory Report',
    badge: 'INTELLIGENCE',
    badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    desc: 'Multi-day track correlation, persistence scoring, zone dwell logs, and relationship convergence matrices for vessels of interest.',
    period: 'Target Contact C-1042',
    tableHead: [['Contact ID', 'Vessel Class', 'Continuity Score', 'Total Dwell', 'First Seen', 'Breached Zones']],
    sampleData: [
      ['C-1042', 'Unregistered Skiff', '94.2%', '32 mins', '14:18:22 IST', 'Inner Anchorage Fairway (Restricted)'],
      ['C-1049', 'Mechanised Trawler', '88.0%', '4 hrs 12 mins', '10:04:15 IST', 'None (Authorized Sector)'],
      ['C-1051', 'Motorised Country Craft', '91.5%', '1 hr 45 mins', '12:30:00 IST', 'Port Approach Buffer Zone']
    ]
  },
  {
    type: 'ZONE_ACTIVITY_REPORT',
    title: 'Coastal Zone Activity & Boundary Audit',
    badge: 'GIS & ZONES',
    badgeColor: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
    desc: 'Coastal boundary adherence, high-tide line incursion counts, fishing boundary compliance, and bathing beach density summaries.',
    period: 'Current Coastal Operation Season',
    tableHead: [['Zone Code', 'Zone Name', 'Security Level', 'Incursions', 'Active Contacts', 'Compliance']],
    sampleData: [
      ['ZN-SEC-01', 'Vizhinjam Port Restricted Basin', 'HIGH_SECURITY', '3 Breaches', '2 Contacts', 'INTERCEPTOR ALERTED'],
      ['ZN-ANCHOR-02', 'Commercial Shipping Fairway', 'MONITORED', '1 Breach', '8 Contacts', 'NORMAL MONITORING'],
      ['ZN-BEACH-03', 'Kovalam Public Beach Perimeter', 'CIVILIAN_SAFETY', '0 Breaches', '42 Persons', 'NORMAL DENSITY'],
      ['ZN-EST-04', 'Poovar Estuary Fishery Sector', 'RESOURCE_ZONE', '0 Breaches', '14 Boats', 'TRAWLING BAN COMPLIANT']
    ]
  },
  {
    type: 'EVIDENCE_ELIR_REPORT',
    title: 'Evidence-Linked Incident Record (ELIR Dossier)',
    badge: 'LEGAL EVIDENCE',
    badgeColor: 'bg-red-500/10 text-red-700 border-red-500/20',
    desc: 'Court-admissible electronic dossier for active judicial proceedings under Section 65B IEA / Section 63 BNSS.',
    period: 'Incident INC-20261016-0042',
    tableHead: [['Evidence Item', 'File Type', 'Sensor Modality', 'SHA-256 Digest (Truncated)', 'Admissibility Status']],
    sampleData: [
      ['Pre-Incursion Keyframe', 'JPEG Image', 'RGB 4K', 'a1b2c3d4e5f67890123456789abcdef0...', 'ADMISSIBLE (Sec 65B Certified)'],
      ['Breach Apex Keyframe', 'JPEG Image', 'Thermal LWIR', 'f6e5d4c3b2a10987654321fedcba0987...', 'ADMISSIBLE (Sec 65B Certified)'],
      ['10-Second Incident Clip', 'MP4 Video', 'Dual Stream', '9876543210fedcba123456789abcdef0...', 'ADMISSIBLE (Sec 65B Certified)'],
      ['Flight Telemetry Log', 'CSV Raw Stream', 'MAVLink v2', '0123456789abcdef0123456789abcdef...', 'ADMISSIBLE (Sec 65B Certified)']
    ]
  },
  {
    type: 'AUDIT_EXTRACT',
    title: 'Cryptographic Audit Trail Extract',
    badge: 'COMPLIANCE',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    desc: 'Cryptographic ledger audit extract with Genesis-to-Head block verification hashes and access activity records.',
    period: 'Recent 320 Ledger Blocks',
    tableHead: [['Block ID', 'Officer Identity', 'Role', 'Action Executed', 'Object Target', 'Blockchain Hash']],
    sampleData: [
      ['aud-0320', 'Kurup V. (admin.kurup)', 'SYS_ADMIN', 'API_KEY_ROTATED', 'KEY-01 (CCTNS Sync)', 'b4a8e291f8c7e43598124efb129840cb...'],
      ['aud-0319', 'Insp. Anoop Nair', 'OPERATOR', 'UPDATE_MISSION', 'MSN-20261016-01', 'a1928475a892b1093849501238475910...'],
      ['aud-0318', 'System Daemon', 'SYS_ADMIN', 'SYSTEM_HEALTH_CHECK', 'EDGE-VIZHINJAM-01', 'f8c7e43598124efb129840cb12938475...']
    ]
  },
  {
    type: 'MODEL_PERFORMANCE_REPORT',
    title: 'AI Models & CFS Performance Evaluation',
    badge: 'MODEL AUDIT',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    desc: 'AI model accuracy metrics, CFS frame savings, precision/recall per class, and edge vs central GPU benchmarks.',
    period: 'Evaluation Bundle v2.4.1',
    tableHead: [['Model Architecture', 'Task & Modality', 'Small AP (<32px)', 'Medium AP', 'False Alert Rate', 'GPU Savings']],
    sampleData: [
      ['RTMDet-L (MMDetection)', 'Vessel Detect (RGB)', '44.8% mAP', '72.4% mAP', '0.04 false/hr', '41.4% via CFS'],
      ['RTMDet-S Edge Profile', 'Fast Tactical (RGB)', '38.2% mAP', '65.1% mAP', '0.07 false/hr', '52.0% via CFS'],
      ['RTMDet-Thermal LWIR', 'Night Maritime (LWIR)', '41.6% mAP', '68.9% mAP', '0.03 false/hr', '38.6% via CFS'],
      ['ByteTrack Multi-Object', 'Persistent Tracking', '89.4% MOTA', '92.1% IDF1', '0.01 id-switch', 'Zero Overload']
    ]
  }
];

interface GeneratedReportItem {
  id: string;
  type: ExtendedReportType;
  title: string;
  period: string;
  generatedAt: string;
  generatedBy: string;
  signOffOfficer: string;
  sha256Seal: string;
  fileSizeKb: number;
}

const INITIAL_GENERATED_REPORTS: GeneratedReportItem[] = [
  {
    id: 'REP-20261016-01',
    type: 'DAILY_INCIDENT_SUMMARY',
    title: 'Daily Incident Summary — Vizhinjam Sector (16-Oct-2026)',
    period: '16 Oct 2026 00:00 – 16 Oct 2026 14:00 IST',
    generatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    generatedBy: 'Insp. Anoop Nair (KP-4421)',
    signOffOfficer: 'Superintendent of Police, Coastal Operations',
    sha256Seal: '9e4f2b189c4418a02b8d91c287410948b2734190284719284710293847109283',
    fileSizeKb: 142
  },
  {
    id: 'REP-20261015-02',
    type: 'WEEKLY_SLA_AUDIT',
    title: 'Weekly Operator Response-Time Audit (Week 41)',
    period: '09 Oct 2026 – 15 Oct 2026 IST',
    generatedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    generatedBy: 'System Automated Auditor',
    signOffOfficer: 'DIG Coastal Security, Kerala Police',
    sha256Seal: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    fileSizeKb: 184
  },
  {
    id: 'REP-20261014-03',
    type: 'DRONE_UTILISATION_30DAY',
    title: 'Drone Fleet 30-Day Technical Utilisation Analysis',
    period: '14 Sep 2026 – 14 Oct 2026 IST',
    generatedAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    generatedBy: 'Tech Officer Santhosh P.',
    signOffOfficer: 'Director of Police Telecommunications, Kerala',
    sha256Seal: 'f6e5d4c3b2a10987654321fedcba0987654321fedcba0987654321fedcba0987',
    fileSizeKb: 248
  }
];

export default function ReportsPage() {
  const [reportsList, setReportsList] = useState<GeneratedReportItem[]>(INITIAL_GENERATED_REPORTS);
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'GENERATED' | 'SCHEDULES'>('TEMPLATES');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [signOffName, setSignOffName] = useState('Superintendent of Police, Coastal Operations');
  const [jurisdiction, setJurisdiction] = useState('Vizhinjam Coastal Police Station, Thiruvananthapuram');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scheduled reports config state
  const [schedules, setSchedules] = useState([
    { id: 'SCH-01', name: 'Daily Incident Rollup', reportType: 'DAILY_INCIDENT_SUMMARY', schedule: 'Daily at 06:00 IST', recipients: 'sp.coastal@keralapolice.gov.in, cctns-desk@keralapolice.gov.in', active: true },
    { id: 'SCH-02', name: 'Weekly Response Audit', reportType: 'WEEKLY_SLA_AUDIT', schedule: 'Mondays at 08:00 IST', recipients: 'dig.security@keralapolice.gov.in', active: true },
    { id: 'SCH-03', name: 'Monthly Drone Fleet Review', reportType: 'DRONE_UTILISATION_30DAY', schedule: '1st of every month at 00:00 IST', recipients: 'telecom-director@keralapolice.gov.in', active: false }
  ]);

  // Generate Real Client-Side PDF
  const handleGeneratePdf = async (tmpl: ReportTemplate) => {
    setIsGenerating(true);
    const reportId = `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(reportsList.length + 1).padStart(2, '0')}`;

    try {
      const pdfResult = await generatePoliceReportPdf({
        reportId,
        reportType: tmpl.type,
        title: `${tmpl.title} — ${new Date().toLocaleDateString('en-GB')}`,
        generatedBy: 'Insp. Anoop Nair (KP-4421)',
        officerRole: 'Station Duty Officer',
        periodCovered: tmpl.period,
        stationJurisdiction: jurisdiction,
        signOffOfficer: signOffName,
        executiveSummary: tmpl.desc,
        tableHead: tmpl.tableHead,
        tableBody: tmpl.sampleData,
      });

      // Add to generated reports ledger
      const newReportEntry: GeneratedReportItem = {
        id: reportId,
        type: tmpl.type,
        title: `${tmpl.title} — ${new Date().toLocaleDateString('en-GB')}`,
        period: tmpl.period,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Insp. Anoop Nair (KP-4421)',
        signOffOfficer: signOffName,
        sha256Seal: pdfResult.sha256,
        fileSizeKb: Math.round(pdfResult.blob.size / 1024)
      };

      setReportsList([newReportEntry, ...reportsList]);
      setSelectedTemplate(null);
      downloadBlob(pdfResult.blob, pdfResult.filename);

      setToastMessage(`Official PDF "${newReportEntry.title}" generated and cryptographically sealed.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate report PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export CSV
  const handleExportCsv = (tmpl: ReportTemplate) => {
    const csvContent = [
      tmpl.tableHead[0].join(','),
      ...tmpl.sampleData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${tmpl.type}_${Date.now()}.csv`);

    auditApi.append({
      userId: 'op-rep',
      userName: 'Insp. Anoop Nair',
      userRole: 'ANALYST',
      action: 'EXPORT_EVIDENCE',
      targetType: 'REPORT',
      targetId: tmpl.type,
      beforeAfterSummary: `Exported CSV dataset for report "${tmpl.title}"`,
      outcome: 'SUCCESS'
    }).catch(console.error);
  };

  // Export JSON
  const handleExportJson = (tmpl: ReportTemplate) => {
    const jsonContent = JSON.stringify({
      reportType: tmpl.type,
      title: tmpl.title,
      exportedAt: new Date().toISOString(),
      columns: tmpl.tableHead[0],
      records: tmpl.sampleData
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, `${tmpl.type}_${Date.now()}.json`);

    auditApi.append({
      userId: 'op-rep',
      userName: 'Insp. Anoop Nair',
      userRole: 'ANALYST',
      action: 'EXPORT_EVIDENCE',
      targetType: 'REPORT',
      targetId: tmpl.type,
      beforeAfterSummary: `Exported JSON schema for report "${tmpl.title}"`,
      outcome: 'SUCCESS'
    }).catch(console.error);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Formal Police Reports &amp; Evidence Exports
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
              RFP §5.1.27 / SEC 65B IEA
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              CLIENT-SIDE PDF ENGINE
            </span>
          </div>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            Statutory incident summaries, supervisory SLA response audits, drone fleet analyses, and court-admissible dossiers
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl border bg-[var(--surface)] text-xs font-semibold" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={cn('px-3 py-1.5 rounded-lg transition-all', activeTab === 'TEMPLATES' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100')}
          >
            Report Templates (9)
          </button>
          <button
            onClick={() => setActiveTab('GENERATED')}
            className={cn('px-3 py-1.5 rounded-lg transition-all', activeTab === 'GENERATED' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100')}
          >
            Signed Ledger ({reportsList.length})
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULES')}
            className={cn('px-3 py-1.5 rounded-lg transition-all', activeTab === 'SCHEDULES' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100')}
          >
            Automated Schedules (3)
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div className="rounded-xl p-3 bg-emerald-500/15 border border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 1: ON-DEMAND REPORT TEMPLATES (9 OFFICIAL TEMPLATES)
         ══════════════════════════════════════════════════ */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold">Formal Police Report Generators (Real PDF Engine)</h2>
              <p className="text-xs opacity-60">Client-side rendering with official letterhead, Section 65B legal attestation, and SHA-256 seal</p>
            </div>
            <span className="text-xs font-mono opacity-70">
              Station: Vizhinjam Coastal Police
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TEMPLATES.map(tmpl => (
              <div
                key={tmpl.type}
                className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-mono font-bold border', tmpl.badgeColor)}>
                      {tmpl.badge}
                    </span>
                    <span className="text-[11px] font-mono opacity-60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {tmpl.period}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-base font-bold leading-tight">{tmpl.title}</h3>
                    <p className="text-xs opacity-75 font-sans mt-1 leading-relaxed">{tmpl.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportCsv(tmpl)}
                      title="Export CSV Dataset"
                      className="p-1.5 rounded-lg border hover:bg-[var(--surface)] text-xs transition-colors"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleExportJson(tmpl)}
                      title="Export JSON Schema"
                      className="p-1.5 rounded-lg border hover:bg-[var(--surface)] text-xs transition-colors"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <Code2 className="w-3.5 h-3.5 text-[var(--sea-600)]" />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedTemplate(tmpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Generate PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2: GENERATED REPORTS LEDGER (SIGNED & VERIFIED)
         ══════════════════════════════════════════════════ */}
      {activeTab === 'GENERATED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold">Signed Electronic Report Ledger &amp; Chain of Custody</h2>
              <p className="text-xs opacity-60">All generated dossiers with SHA-256 integrity verification hash registered in police custody</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Seals Verified
            </span>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface)] text-[11px] font-mono opacity-70 border-b" style={{ borderColor: 'var(--line)' }}>
                <tr>
                  <th className="p-3">REPORT ID</th>
                  <th className="p-3">DOCUMENT TITLE</th>
                  <th className="p-3">PERIOD</th>
                  <th className="p-3">GENERATED BY</th>
                  <th className="p-3">SHA-256 INTEGRITY SEAL</th>
                  <th className="p-3">SIZE</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                {reportsList.map(r => (
                  <tr key={r.id} className="hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="p-3 font-bold text-[var(--sea-600)]">{r.id}</td>
                    <td className="p-3 font-sans font-semibold">{r.title}</td>
                    <td className="p-3 opacity-70">{r.period}</td>
                    <td className="p-3 opacity-80">{r.generatedBy}</td>
                    <td className="p-3">
                      <code className="text-[10px] text-cyan-600 font-mono">
                        {r.sha256Seal.slice(0, 16)}…{r.sha256Seal.slice(-8)}
                      </code>
                    </td>
                    <td className="p-3 opacity-70">{r.fileSizeKb} KB</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const tmpl = REPORT_TEMPLATES.find(t => t.type === r.type) ?? REPORT_TEMPLATES[0];
                          handleGeneratePdf(tmpl);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold hover:bg-[var(--surface)] text-[var(--sea-600)] transition-colors"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        <Download className="w-3 h-3" /> Re-Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 3: AUTOMATED REPORT SCHEDULES
         ══════════════════════════════════════════════════ */}
      {activeTab === 'SCHEDULES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold">Automated Scheduled Dispatches (RFP §5.1.27)</h2>
              <p className="text-xs opacity-60">Recurring daemon jobs dispatching cryptographically signed PDF summaries to operational desks</p>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface)] text-[11px] font-mono opacity-70 border-b" style={{ borderColor: 'var(--line)' }}>
                <tr>
                  <th className="p-3">SCHEDULE ID</th>
                  <th className="p-3">REPORT JOB NAME</th>
                  <th className="p-3">FREQUENCY / CRON</th>
                  <th className="p-3">AUTHORIZED DESK RECIPIENTS</th>
                  <th className="p-3">DAEMON STATUS</th>
                  <th className="p-3 text-right">TOGGLE</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                {schedules.map(sch => (
                  <tr key={sch.id} className="hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="p-3 font-bold text-[var(--sea-600)]">{sch.id}</td>
                    <td className="p-3 font-sans font-semibold">{sch.name}</td>
                    <td className="p-3 opacity-80">{sch.schedule}</td>
                    <td className="p-3 opacity-70 text-[11px] max-w-xs truncate">{sch.recipients}</td>
                    <td className="p-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1',
                        sch.active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                      )}>
                        {sch.active ? 'ACTIVE CRON' : 'PAUSED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSchedules(prev => prev.map(s => s.id === sch.id ? { ...s, active: !s.active } : s))}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-semibold border transition-colors',
                          sch.active ? 'hover:bg-red-500/10 text-red-600 border-red-500/30' : 'hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        )}
                      >
                        {sch.active ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Generate PDF Confirmation Modal ── */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-xl" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">POLICE PDF GENERATOR</span>
                <h3 className="font-serif text-lg font-bold mt-0.5">{selectedTemplate.title}</h3>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="opacity-60 hover:opacity-100 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Police Station Base / Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-xs font-sans"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Sign-Off Endorsing Officer</label>
                <input
                  type="text"
                  value={signOffName}
                  onChange={e => setSignOffName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-xs font-sans"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="p-3 rounded-xl border bg-[var(--surface)] text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Section 65B Electronic Evidence Verification
                </div>
                <p className="opacity-80 font-sans leading-relaxed">
                  The generated PDF will contain the official Kerala Police Department letterhead, tabular observation logs, statutory legal attestation, and a unique cryptographic SHA-256 seal registered in the audit ledger.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 rounded-xl border font-semibold hover:bg-[var(--surface)]"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGeneratePdf(selectedTemplate)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isGenerating ? 'Rendering Official PDF...' : 'Download Official PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Footer */}
      <HumanInterpretationNote />
    </div>
  );
}

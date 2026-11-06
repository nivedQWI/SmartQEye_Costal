// ============================================================
// SmartQEye Coastal — Recorded Analysis evidence helpers
//  • captureVideoFrame: composites the real <video> frame (with the
//    active sensor filter) + the AI overlay canvas into one JPEG.
//  • buildPlainAssessment: plain-language police assessment lines.
//  • exportSec65bCertificatePdf: real Section 65B / BSA s.63 PDF.
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sha256Hex } from '@/lib/crypto';

// ─── Frame capture ───────────────────────────────────────────

const CAPTURE_W = 1280;
const CAPTURE_H = 720;

function waitForEvent(el: HTMLMediaElement, events: string[], timeoutMs: number): Promise<void> {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      events.forEach(ev => el.removeEventListener(ev, finish));
      clearTimeout(timer);
      resolve();
    };
    events.forEach(ev => el.addEventListener(ev, finish, { once: true }));
    const timer = setTimeout(finish, timeoutMs);
  });
}

/**
 * Captures the frame currently shown in the player.
 * The overlay canvas alone only contains the AI boxes (it is cleared every
 * animation frame and the video is a separate DOM element), so the video
 * pixels must be drawn explicitly before the overlay is layered on top.
 */
export async function captureVideoFrame(
  video: HTMLVideoElement | null,
  overlay: HTMLCanvasElement | null,
  cssFilter: string | undefined,
): Promise<string> {
  if (video && !video.error) {
    if (video.seeking) await waitForEvent(video, ['seeked'], 1500);
    if (video.readyState < 2) await waitForEvent(video, ['loadeddata', 'canplay', 'seeked'], 2000);
  }

  const out = document.createElement('canvas');
  out.width = CAPTURE_W;
  out.height = CAPTURE_H;
  const ctx = out.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#030C14';
  ctx.fillRect(0, 0, CAPTURE_W, CAPTURE_H);

  if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
    // object-contain fit, same as the on-screen player
    const scale = Math.min(CAPTURE_W / video.videoWidth, CAPTURE_H / video.videoHeight);
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    const dx = (CAPTURE_W - dw) / 2;
    const dy = (CAPTURE_H - dh) / 2;
    ctx.filter = cssFilter && cssFilter !== 'none' ? cssFilter : 'none';
    ctx.drawImage(video, dx, dy, dw, dh);
    ctx.filter = 'none';
  }

  if (overlay && overlay.width > 0 && overlay.height > 0) {
    ctx.drawImage(overlay, 0, 0, CAPTURE_W, CAPTURE_H);
  }

  try {
    return out.toDataURL('image/jpeg', 0.9);
  } catch {
    // Tainted canvas (cross-origin video without CORS) — fall back to overlay only
    return overlay ? overlay.toDataURL('image/jpeg', 0.9) : '';
  }
}

export async function sha256OfDataUrl(dataUrl: string): Promise<string> {
  return sha256Hex(dataUrl);
}

// ─── Plain-language assessment ───────────────────────────────

export interface AssessmentSector {
  name: string;
  district: string;
  hazardLevel: 'HIGH' | 'CRITICAL' | 'MODERATE' | 'LOW';
  plainConcern: string;
  primaryTarget: {
    craftName: string;
    classLabel: string;
    registrationNo: string;
    speedKnots: number;
    distToRocksM: number;
    dwellSec: number;
  };
  milestones: { timeSec: number; label: string; severity: 'INFO' | 'CAUTION' | 'CRITICAL' }[];
}

const RISK_WORDS: Record<AssessmentSector['hazardLevel'], string> = {
  CRITICAL: 'Very high',
  HIGH: 'High',
  MODERATE: 'Medium',
  LOW: 'Low',
};

const ACTION_WORDS: Record<AssessmentSector['hazardLevel'], string> = {
  CRITICAL: 'Send the patrol boat now and warn the boat crew. Inform the Station House Officer.',
  HIGH: 'Alert the nearest patrol boat and keep watching this boat on the drone feed.',
  MODERATE: 'Keep watching. Check the boat registration when it reaches the shore.',
  LOW: 'No action needed now. Keep the record for reference.',
};

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function buildPlainAssessment(sector: AssessmentSector): { label: string; text: string }[] {
  const t = sector.primaryTarget;
  const key = sector.milestones.find(m => m.severity === 'CRITICAL')
    ?? sector.milestones.find(m => m.severity === 'CAUTION')
    ?? sector.milestones[0];
  return [
    { label: 'What', text: `${t.classLabel} "${t.craftName}" (Reg. ${t.registrationNo}).` },
    { label: 'Where', text: `${sector.name}, ${sector.district}.` },
    {
      label: 'When',
      text: key
        ? `At ${mmss(key.timeSec)} in the video (${key.label}). Stayed in the area for ${t.dwellSec} seconds.`
        : `Stayed in the area for ${t.dwellSec} seconds.`,
    },
    { label: 'Movement', text: `Moving at ${t.speedKnots} knots, ${t.distToRocksM} m from the rocks / breakwater.` },
    { label: 'Why it matters', text: sector.plainConcern },
    { label: 'Risk', text: RISK_WORDS[sector.hazardLevel] },
    { label: 'Action', text: ACTION_WORDS[sector.hazardLevel] },
  ];
}

// ─── Section 65B certificate PDF ─────────────────────────────

export interface CertKeyframe {
  timeSec: number;
  timestampIst: string;
  thumbnailUrl: string;
  sha256Hash: string;
  targetTrackId: string;
  craftName: string;
  label?: string;
}

export interface CertSector extends AssessmentSector {
  code: string;
  station: string;
  uavCode: string;
  pilot: string;
  videoSrc: string;
  modality: string;
  coords: { lat: number; lon: number };
  altitudeM: number;
  primaryTarget: AssessmentSector['primaryTarget'] & { trackId: string };
}

function istNow(): { date: string; dateTime: string } {
  const d = new Date();
  const date = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  return { date, dateTime: `${date}, ${time} IST` };
}

function fmtVideoTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/** Builds and downloads the Section 65B certificate. Returns the file name. */
export async function exportSec65bCertificatePdf(opts: {
  sector: CertSector;
  keyframes: CertKeyframe[];
  videoDurationSec: number;
}): Promise<string> {
  const { sector, keyframes, videoDurationSec } = opts;
  const now = istNow();
  const fileName = sector.videoSrc.split('/').pop() ?? sector.videoSrc;

  // Composite seal: SHA-256 over every keyframe digest + the record particulars
  const sealInput = [
    sector.code, fileName, sector.uavCode, sector.primaryTarget.trackId,
    ...keyframes.map(k => `${k.timeSec.toFixed(2)}:${k.sha256Hash}`),
  ].join('|');
  const compositeSeal = await sha256Hex(sealInput);
  const certNo = `KP-CSW/65B/${new Date().getFullYear()}/${compositeSeal.slice(0, 8).toUpperCase()}`;
  const caseRef = `CR-${sector.code}-${compositeSeal.slice(8, 14).toUpperCase()}`;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 15;
  const contentW = pageW - M * 2;

  // ── Letterhead ──
  doc.setFillColor(4, 47, 46);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KERALA POLICE  -  COASTAL SECURITY WING', M, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SmartQEye Coastal  |  Drone Forensic Evidence Unit', M, 16);
  doc.setFontSize(8);
  doc.text(`Certificate No: ${certNo}`, pageW - M, 10, { align: 'right' });
  doc.text(`Case / Incident Ref: ${caseRef}`, pageW - M, 16, { align: 'right' });

  // ── Title ──
  doc.setTextColor(17, 24, 39);
  let y = 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CERTIFICATE OF ELECTRONIC RECORD', pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('under Section 65B of the Indian Evidence Act, 1872', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.text('and Section 63 of the Bharatiya Sakshya Adhiniyam, 2023', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.setDrawColor(4, 47, 46);
  doc.setLineWidth(0.6);
  doc.line(M, y, pageW - M, y);
  y += 4;

  // ── Particulars of the electronic record ──
  const first = keyframes.length ? Math.min(...keyframes.map(k => k.timeSec)) : 0;
  const last = keyframes.length ? Math.max(...keyframes.map(k => k.timeSec)) : 0;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [17, 24, 39], lineColor: [203, 213, 225] },
    head: [[{ content: 'PART A  -  PARTICULARS OF THE ELECTRONIC RECORD', colSpan: 2 }]],
    headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 52, fontStyle: 'bold' }, 1: { cellWidth: contentW - 52 } },
    body: [
      ['Police Station', sector.station],
      ['District', `${sector.district}, Kerala`],
      ['Sector', `${sector.name} (${sector.code})`],
      ['GPS position (drone)', `${sector.coords.lat.toFixed(4)} N, ${sector.coords.lon.toFixed(4)} E  |  Altitude ${sector.altitudeM} m AGL`],
      ['Video file', `${fileName}  (${sector.modality} sensor, duration ${fmtVideoTime(videoDurationSec)})`],
      ['Recording device', `Unmanned Aerial Vehicle ${sector.uavCode}`],
      ['Drone pilot', sector.pilot],
      ['Subject of record', `${sector.primaryTarget.craftName} - ${sector.primaryTarget.classLabel}, Reg. ${sector.primaryTarget.registrationNo} (Track ${sector.primaryTarget.trackId})`],
      ['Keyframes sealed', keyframes.length ? `${keyframes.length}  (video time ${fmtVideoTime(first)} to ${fmtVideoTime(last)})` : 'None'],
      ['Hash algorithm', 'SHA-256 (FIPS 180-4), computed at the moment of extraction'],
      ['Composite seal (SHA-256)', compositeSeal],
      ['Certificate generated', now.dateTime],
    ],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Certification paragraphs ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PART B  -  CERTIFICATION', M, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const paras = [
    `I, ${sector.pilot}, attached to ${sector.station}, do hereby certify as follows:`,
    `1. The electronic record described in Part A, being the drone video file "${fileName}" and the ${keyframes.length} still image(s) extracted from it and listed in Part C, was produced by the computer system "SmartQEye Coastal" from video recorded by ${sector.uavCode} during lawful coastal surveillance over ${sector.name}.`,
    '2. During the period of recording, the drone and the computer system were used regularly to store and process information for the coastal surveillance activities of the Kerala Police, and I had lawful control over their use.',
    '3. During that period, information of the kind contained in the electronic record was regularly fed into the computer system in the ordinary course of those activities.',
    '4. Throughout the material part of that period, the computer system was operating properly. No malfunction or interference occurred that could affect the electronic record or the accuracy of its contents.',
    '5. The information contained in the electronic record reproduces, or is derived from, information fed into the computer system in the ordinary course of those activities.',
    '6. Each still image was sealed with a SHA-256 hash value at the moment of extraction, as recorded in Part C. Any change to an image will change its hash value.',
    '7. The statements made above are true to the best of my knowledge and belief.',
  ];
  for (const p of paras) {
    const lines = doc.splitTextToSize(p, contentW) as string[];
    if (y + lines.length * 4.2 > 280) { doc.addPage(); y = 20; }
    doc.text(lines, M, y);
    y += lines.length * 4.2 + 1.6;
  }
  y += 2;

  // ── Part C: sealed keyframes with images ──
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PART C  -  SEALED EVIDENCE KEYFRAMES', M, y);
  y += 2;

  const IMG_W = 44;
  const IMG_H = IMG_W * 9 / 16;
  if (keyframes.length) {
    autoTable(doc, {
      startY: y + 1,
      margin: { left: M, right: M },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.6, valign: 'middle', textColor: [17, 24, 39], lineColor: [203, 213, 225] },
      headStyles: { fillColor: [4, 47, 46], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: IMG_W + 3.2, minCellHeight: IMG_H + 3.2 },
        2: { cellWidth: 34 },
        3: { cellWidth: 'auto', font: 'courier', fontSize: 6.8 },
      },
      head: [['#', 'Image', 'Details', 'SHA-256 hash value']],
      body: keyframes.map((k, i) => [
        String(i + 1),
        '',
        `${k.label ?? 'Keyframe'}\nVideo time: ${fmtVideoTime(k.timeSec)}\nSealed: ${k.timestampIst}\nTrack: ${k.targetTrackId}\n${k.craftName}`,
        k.sha256Hash,
      ]),
      didDrawCell: data => {
        if (data.section === 'body' && data.column.index === 1) {
          const kf = keyframes[data.row.index];
          if (kf?.thumbnailUrl?.startsWith('data:image')) {
            try {
              doc.addImage(kf.thumbnailUrl, 'JPEG', data.cell.x + 1.6, data.cell.y + 1.6, IMG_W, IMG_H);
            } catch { /* image could not be embedded */ }
          }
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('No keyframes were sealed for this record.', M, y);
    y += 10;
  }

  // ── Signature block ──
  if (y > 245) { doc.addPage(); y = 25; }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Place: ${sector.station.split('/')[0].trim()}, ${sector.district}`, M, y);
  doc.text(`Date: ${now.date}`, M, y + 5);

  const sx = pageW - M - 70;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(sx, y + 12, pageW - M, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(sector.pilot, sx, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Drone Operation In-Charge (Declarant)', sx, y + 21);
  doc.text(sector.station, sx, y + 25, { maxWidth: 70 });

  doc.setDrawColor(4, 47, 46);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.rect(M, y + 10, 40, 18);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICE SEAL', M + 20, y + 20, { align: 'center' });

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(M, ph - 12, pageW - M, ph - 12);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${certNo}  |  RESTRICTED - Kerala Police internal use`, M, ph - 7);
    doc.text(`Page ${i} of ${pages}`, pageW - M, ph - 7, { align: 'right' });
  }

  const outName = `Sec65B_Certificate_${sector.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(outName);
  return outName;
}

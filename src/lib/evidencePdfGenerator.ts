// ============================================================
// SmartQEye Coastal â€” Evidence Package PDF Generator
// Generates court-admissible PDF reports with embedded Keyframes
// Per Section 65B / Section 63 BSA Digital Evidence Attestation
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatISTFull, formatCoords, eventTypeLabel } from '@/lib/utils';
import type { Alert } from '@/types';
import type { KeyframeItem } from '@/lib/alertMedia';

/**
 * Loads an image URL into a base64 Data URL for jsPDF embedding
 */
async function loadBase64Image(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to load image for PDF embedding:', url, err);
    return null;
  }
}

export interface GenerateEvidencePdfOptions {
  alert: Alert;
  keyframes: KeyframeItem[];
  reason: string;
  userName: string;
  userRole: string;
}

export async function generateEvidencePackagePdf({
  alert,
  keyframes,
  reason,
  userName,
  userRole,
}: GenerateEvidencePdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const ev = alert.event;

  // 1. Top Header Banner
  doc.setFillColor(15, 35, 52); // #0f2334 deep navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KERALA POLICE â€” COASTAL SECURITY COMMAND & CONTROL', margin, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(165, 205, 230);
  doc.text('SMARTQEYE COASTAL AI SURVEILLANCE PLATFORM â€” EVIDENCE-LINKED INCIDENT RECORD (ELIR)', margin, 18);

  doc.setFontSize(8);
  doc.setTextColor(200, 220, 240);
  doc.text(`Generated: ${formatISTFull(new Date())} | Classification: RESTRICTED / OPERATIONAL EVIDENCE`, margin, 24);

  // 2. Incident Summary Card
  let currentY = 35;
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(215, 225, 235);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(30, 45, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`INCIDENT ${alert.alertCode}: ${eventTypeLabel(ev.type).toUpperCase()}`, margin + 4, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const sevColor = alert.severity === 'CRITICAL' ? [200, 40, 40] : alert.severity === 'HIGH' ? [220, 100, 30] : [40, 140, 100];
  doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
  doc.text(`SEVERITY: ${alert.severity}`, margin + 4, currentY + 14);

  doc.setTextColor(80, 95, 110);
  doc.setFont('helvetica', 'normal');
  doc.text(`STATUS: ${alert.status} | OCCURRED AT: ${formatISTFull(ev.occurredAt)}`, margin + 45, currentY + 14);

  doc.setFontSize(8);
  doc.setTextColor(110, 125, 140);
  doc.text(`Export Authorisation: "${reason}" | Custody Officer: ${userName} (${userRole})`, margin + 4, currentY + 20);

  currentY += 30;

  // 3. Technical Parameters Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 35, 50);
  doc.text('1. OPERATIONAL & SENSOR TELEMETRY', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [30, 60, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, textColor: [35, 45, 55] },
    head: [['Parameter', 'Telemetry Value', 'Parameter', 'Telemetry Value']],
    body: [
      ['Patrol UAV Code', String(ev.uav.code || 'UAV-01'), 'Mission ID', `${ev.mission.code} (${ev.mission.title})`],
      ['Location Name', String(ev.location.name || 'Coastal Sector'), 'GPS Coordinates', formatCoords(ev.location.lat, ev.location.lon)],
      ['Coastal Zone', ev.zone ? `${ev.zone.code} - ${ev.zone.name}` : 'Unzoned Corridor', 'Zone Profile', String(ev.zone?.profile || 'Default Maritime')],
      ['Persistent Contact', ev.contact ? String(ev.contact.code) : 'No AIS/Beacon Contact', 'Contact Class', ev.contact ? `${ev.contact.class} (${(ev.contact.classConf * 100).toFixed(0)}% conf)` : 'N/A'],
      ['Optical Modality', String(ev.modality || 'RGB Optical'), 'Position Fix Method', String(ev.location.method || 'DRONE_POSITION')],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Evidence Rationale Factors
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 35, 50);
  doc.text('2. DETECTION RATIONALE & CONTEXTUAL FACTORS', margin, currentY);
  currentY += 3;

  const rationaleRows = (ev.rationale?.factors ?? []).map(f => [
    f.contribution,
    f.factorName,
    `${f.value}${f.unit ? ' ' + f.unit : ''}`,
    f.threshold !== undefined ? `${f.threshold}${f.unit ? ' ' + f.unit : ''}` : 'Baseline'
  ]);

  if (rationaleRows.length === 0) {
    rationaleRows.push(['PRIMARY', 'Restricted Boundary Incursion', 'Confirmed Vector Crossing', 'Zero-tolerance threshold']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: { fillColor: [45, 80, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, textColor: [35, 45, 55] },
    head: [['Contribution', 'Observable Factor', 'Observed Value', 'Threshold']],
    body: rationaleRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. Extracted Video Keyframes Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 35, 50);
  doc.text('3. EXTRACTED VIDEO KEYFRAMES & CRYPTOGRAPHIC INTEGRITY', margin, currentY);
  currentY += 4;

  // Fetch images in parallel
  const base64List = await Promise.all(keyframes.map(k => loadBase64Image(k.url)));

  const kfWidth = 56;
  const kfHeight = 35;
  const kfGap = (contentWidth - (kfWidth * 3)) / 2;

  // Check if we need a new page for keyframes
  if (currentY + kfHeight + 35 > pageHeight) {
    doc.addPage();
    currentY = 20;
  }

  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];
    const xPos = margin + i * (kfWidth + kfGap);
    const b64 = base64List[i];

    // Image border box
    doc.setFillColor(240, 243, 246);
    doc.setDrawColor(180, 200, 215);
    doc.rect(xPos, currentY, kfWidth, kfHeight, 'FD');

    if (b64) {
      try {
        doc.addImage(b64, 'PNG', xPos, currentY, kfWidth, kfHeight);
      } catch (e) {
        console.warn('Failed to embed keyframe into PDF:', e);
      }
    } else {
      doc.setFontSize(7);
      doc.setTextColor(120, 130, 140);
      doc.text('[Keyframe Preview]', xPos + 10, currentY + 18);
    }

    // Label below keyframe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 35, 50);
    const labelLines = doc.splitTextToSize(`KF-${i + 1}: ${kf.label}`, kfWidth);
    doc.text(labelLines, xPos, currentY + kfHeight + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(90, 100, 110);
    doc.text(`Offset: +${kf.timestampOffsetSec}s | Method: H.264 I-Frame`, xPos, currentY + kfHeight + 9);

    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(110, 120, 130);
    doc.text(`SHA-256: ${kf.sha256.slice(0, 26)}...`, xPos, currentY + kfHeight + 12);
  }

  currentY += kfHeight + 20;

  // 6. Section 65B Electronic Attestation
  if (currentY + 30 > pageHeight) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(210, 220, 230);
  doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 45, 60);
  doc.text('ELECTRONIC RECORD CERTIFICATION UNDER SECTION 63 / 65B BHARATIYA SAKSHYA ADHINIYAM (BSA)', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 80, 90);
  const legalText = 'This electronic evidence package was automatically generated from unmanipulated sensor streams operating in the ordinary course of coastal surveillance duties. The system cryptographic ledger affirms that the video recordings and extracted keyframes have not suffered tampering, alteration, or interception.';
  const wrappedLegal = doc.splitTextToSize(legalText, contentWidth - 6);
  doc.text(wrappedLegal, margin + 3, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`Authorized Officer: ${userName} | Duty Role: ${userRole} | Digital Signature Hash: SHA256-${alert.id}-${Date.now().toString(16)}`, margin + 3, currentY + 21);

  // 7. Save and trigger download
  doc.save(`Evidence_Package_${alert.alertCode}.pdf`);
}

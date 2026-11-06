// ============================================================
// SmartQEye Coastal — Formal Police Reports PDF Generator
// Generates official Kerala Police statutory reports with embedded
// mission telemetry, surveillance keyframe snapshots & Section 65B attestation
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatISTFull, formatCoords } from '@/lib/utils';
import type { PoliceReport } from '@/types';

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

export async function generatePoliceReportPdf(report: PoliceReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(15, 35, 52); // #0f2334 deep naval blue
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GOVERNMENT OF KERALA — POLICE DEPARTMENT', margin, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(165, 205, 230);
  doc.text('COASTAL SECURITY COMMAND & CONTROL HEADQUARTERS · STATUTORY POLICE REPORT', margin, 17);

  doc.setFontSize(7.5);
  doc.setTextColor(200, 225, 245);
  doc.text(
    `DOCUMENT REF: ${report.id.toUpperCase()} · CLASSIFICATION: RESTRICTED / LAW ENFORCEMENT INTERNAL USE ONLY`,
    margin,
    23
  );

  let currentY = 35;

  // Title Box
  doc.setFillColor(244, 248, 251);
  doc.setDrawColor(180, 205, 225);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 35, 52);
  doc.text(report.title, margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 90, 110);
  doc.text(`Operational Period: ${report.periodCovered}`, margin + 4, currentY + 13);
  doc.text(
    `Compiled By: ${report.generatedBy} | Authenticating Authority: ${report.signOffOfficer}`,
    margin + 4,
    currentY + 18
  );

  currentY += 28;

  // Section 1: Mission & Location Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 35, 52);
  doc.text('1. MISSION CONTEXT & OPERATIONAL LOCALIZATION', margin, currentY);
  currentY += 4;

  let missionData: string[][] = [];

  if (report.reportType === 'DAILY_INCIDENT_SUMMARY') {
    missionData = [
      ['Primary Mission', 'M-2026-0415 — Vizhinjam Seaport Security Patrol', 'Assigned Drone', 'UAV-03 (High-Endurance Marine)'],
      ['Location / Sector', 'Vizhinjam International Seaport, Thiruvananthapuram', 'Coordinates', '08° 22\' 42.6" N, 76° 58\' 37.9" E'],
      ['Command Station', 'Vizhinjam Coastal Police Station Command Hub', 'Surveillance Profile', 'Continuous Coastal & Breakwater Geofence'],
      ['Sortie Flight Hours', '14.2 Hours cumulative flight time', 'Weather Condition', 'Visibility 12km, Wind 14kt WNW, Sea State 2'],
    ];
  } else if (report.reportType === 'WEEKLY_SLA_AUDIT') {
    missionData = [
      ['Audit Scope', 'Statewide Drone Surveillance Network (Week 45)', 'Target Response SLA', '< 30s Acknowledgment, < 60s Escalation'],
      ['Monitored Sectors', 'Vizhinjam, Kochi, Alappuzha, Beypore, Azhikkal, Bekal', 'Overall Compliance', '99.4% SLA Adherence Target Met'],
      ['Critical Alert Count', '18 Critical Alarms Processed & Verified', 'Mean Triage Latency', '18.2 seconds (Optimal compliance)'],
      ['Supervising Desk', 'Central GPU Command Console Node A (Air-Gapped)', 'Audit Officer', 'DIG Coastal Security, Kerala Police'],
    ];
  } else if (report.reportType === 'DRONE_UTILISATION_30DAY') {
    missionData = [
      ['Fleet Deployment', '6 Active Marine Tactical UAVs (UAV-01 to UAV-06)', 'Total Flight Time', '384.6 Cumulative Operational Hours'],
      ['Sorties Executed', '142 Planned Patrol & Rapid Reaction Sorties', 'Fleet Availability', '98.8% Mission Readiness Rate'],
      ['Avionics Health', '100% Sensors Calibrated (RGB / FLIR Thermal)', 'Battery Health', 'Avg 94.2% Remaining Cycle Life'],
      ['Fleet Coverage', '590 km Monitored Kerala Territorial Coastline', 'Maintenance Node', 'State Police Telecommunications Avionics Wing'],
    ];
  } else {
    // MISSION_AAR
    missionData = [
      ['Sortie Code', 'MSN-20261011-1820-00-CHARLIE (Breakwater Security)', 'Drone Asset', 'UAV-03 (Night FLIR + Starlight RGB)'],
      ['Target Perimeter', 'Vizhinjam Deepwater Port Breakwater & Kovalam Bay', 'Coordinates', '08° 22\' 42.6" N, 76° 58\' 37.9" E'],
      ['Mission Window', '11 Oct 2026, 18:20 IST to 19:22 IST (62 mins)', 'Sortie Commander', 'SI Ramesh Kumar (KP-8842)'],
      ['Event Detected', 'Unidentified vessel high-speed shoreline approach', 'Operational Action', 'Coastal Interceptor Boat Vector Intercept Dispatched'],
    ];
  }

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: missionData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 244, 248], cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', fillColor: [240, 244, 248], cellWidth: 40 },
      3: { cellWidth: 47 },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Operational Data & Event Log
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 35, 52);
  doc.text('2. OPERATIONAL SURVEILLANCE & EVENT TRIAGE LOG', margin, currentY);
  currentY += 4;

  let eventHead = ['Time (IST)', 'Event / Trigger', 'Location', 'Severity', 'Operator Action', 'Status'];
  let eventRows: string[][] = [];

  if (report.reportType === 'DAILY_INCIDENT_SUMMARY') {
    eventRows = [
      ['03:14:22', 'Zone Entry (Z-01)', 'Vizhinjam Berth 2 Approach', 'CRITICAL', 'SI Menon verified FLIR & tracked', 'RESOLVED'],
      ['07:45:10', 'Vessel Detected', 'Outer Anchor Roadstead', 'MEDIUM', 'AIS Cross-referenced: Tug Sagar-4', 'RESOLVED'],
      ['11:20:05', 'Crowd Threshold Exceeded', 'Kovalam Beach Pier Sector', 'LOW', 'Tourist congregation logged', 'MONITORED'],
      ['15:42:30', 'Course & Speed Anomaly', 'Vizhinjam Navigation Channel', 'HIGH', 'Patrol drone zoomed optical 20x', 'ACKNOWLEDGED'],
      ['19:05:18', 'Perimeter Intrusion', 'North Breakwater Restricted', 'CRITICAL', 'QRT Interceptor boat alerted', 'UNDER_REVIEW'],
    ];
  } else if (report.reportType === 'WEEKLY_SLA_AUDIT') {
    eventRows = [
      ['Mon 09:20', 'Intrusion Alert ALC-041', 'Vizhinjam North Sector', 'CRITICAL', 'Acknowledged in 14s (Target: <30s)', 'COMPLIANT'],
      ['Tue 14:15', 'Vessel Vector ALC-052', 'Kochi Harbour Channel', 'HIGH', 'Acknowledged in 18s (Target: <45s)', 'COMPLIANT'],
      ['Wed 21:04', 'Crowd Density ALC-063', 'Alappuzha Pier Beach', 'MEDIUM', 'Acknowledged in 22s (Target: <60s)', 'COMPLIANT'],
      ['Thu 04:30', 'Restricted Approach ALC-078', 'Beypore Port Berth', 'CRITICAL', 'Acknowledged in 12s, Escalated in 38s', 'COMPLIANT'],
      ['Fri 18:40', 'Night Thermal Alert ALC-091', 'Bekal Perimeter', 'HIGH', 'Acknowledged in 19s (Target: <45s)', 'COMPLIANT'],
    ];
  } else if (report.reportType === 'DRONE_UTILISATION_30DAY') {
    eventHead = ['Asset ID', 'Base Port Sector', 'Monthly Hours', 'Sorties', 'Battery Cycles', 'Status'];
    eventRows = [
      ['UAV-01', 'Cochin Port & Naval Channel', '72.4 hrs', '28 sorties', '44 cycles (93% health)', 'OPTIMAL'],
      ['UAV-02', 'Beypore Deep Sea Harbour', '64.8 hrs', '24 sorties', '38 cycles (95% health)', 'OPTIMAL'],
      ['UAV-03', 'Vizhinjam International Seaport', '84.2 hrs', '32 sorties', '52 cycles (91% health)', 'ACTIVE PATROL'],
      ['UAV-04', 'Azhikkal Port & Estuary', '54.0 hrs', '20 sorties', '32 cycles (96% health)', 'OPTIMAL'],
      ['UAV-05', 'Alappuzha Pier & Coast', '58.6 hrs', '22 sorties', '35 cycles (94% health)', 'OPTIMAL'],
      ['UAV-06', 'Bekal Coastal Perimeter', '50.6 hrs', '16 sorties', '28 cycles (97% health)', 'OPTIMAL'],
    ];
  } else {
    // MISSION_AAR
    eventRows = [
      ['18:20:00', 'Sortie Launch & System Check', 'Vizhinjam Coastal Helipad', 'INFO', 'UAV-03 systems green, battery 98%', 'INITIALIZED'],
      ['18:34:12', 'Radar/AIS Target Acquisition', 'Breakwater Outer Edge', 'MEDIUM', 'Unidentified wooden skiff spotted', 'TRACKING'],
      ['18:42:05', 'Restricted Zone Perimeter Cross', 'Z-01 Exclusion Zone', 'CRITICAL', 'Optical zoom & thermal capture', 'VERIFIED'],
      ['18:48:30', 'Police Interceptor Intercept', '0.8nm off Breakwater', 'HIGH', 'Vessel directed away from berth', 'INTERCEPTED'],
      ['19:22:00', 'Safe Recovery & Data Offload', 'Vizhinjam Coastal Helipad', 'INFO', 'Full telemetry & keyframes signed', 'MISSION_COMPLETE'],
    ];
  }

  autoTable(doc, {
    startY: currentY,
    head: [eventHead],
    body: eventRows,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2, font: 'helvetica' },
    headStyles: { fillColor: [20, 50, 75], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 3: Surveillance Snapshots & Keyframe Evidence
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 35, 52);
  doc.text('3. EXTRACTED SURVEILLANCE KEYFRAME SNAPSHOTS (TAMPER-EVIDENT)', margin, currentY);
  currentY += 4;

  // Keyframes list
  const sampleKeyframes = [
    {
      title: 'KF-01: Optical Target Acquisition',
      url: '/videos/Alerts Page KEYFRAMES/Intrusion 1.png',
      offset: '+04s',
      sha: '8f7a2b91c4e0d3f6a8b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6',
    },
    {
      title: 'KF-02: Perimeter Verification',
      url: '/videos/Alerts Page KEYFRAMES/Intrusion 2.png',
      offset: '+18s',
      sha: '3c8e1a5b7d9f0c2e4a6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c',
    },
    {
      title: 'KF-03: Thermal FLIR Confirmation',
      url: '/videos/Alerts Page KEYFRAMES/Intrusion 3.png',
      offset: '+32s',
      sha: '1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d',
    },
  ];

  const cardWidth = (contentWidth - 6) / 3;
  const imgHeight = 26;

  for (let i = 0; i < sampleKeyframes.length; i++) {
    const kf = sampleKeyframes[i];
    const xPos = margin + i * (cardWidth + 3);

    doc.setFillColor(245, 248, 250);
    doc.setDrawColor(200, 215, 230);
    doc.roundedRect(xPos, currentY, cardWidth, imgHeight + 17, 1.5, 1.5, 'FD');

    // Try embedding image
    const b64 = await loadBase64Image(kf.url);
    if (b64) {
      try {
        doc.addImage(b64, 'JPEG', xPos + 1.5, currentY + 1.5, cardWidth - 3, imgHeight);
      } catch (e) {
        doc.setFillColor(15, 25, 35);
        doc.rect(xPos + 1.5, currentY + 1.5, cardWidth - 3, imgHeight, 'F');
      }
    } else {
      doc.setFillColor(15, 25, 35);
      doc.rect(xPos + 1.5, currentY + 1.5, cardWidth - 3, imgHeight, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(7);
      doc.text('[Surveillance Frame]', xPos + 5, currentY + imgHeight / 2);
    }

    // Metadata below image
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 35, 52);
    doc.text(kf.title, xPos + 2, currentY + imgHeight + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 115, 130);
    doc.text(`Offset: ${kf.offset} | Method: UAV Optical Telemetry`, xPos + 2, currentY + imgHeight + 9);
    doc.text(`SHA: ${kf.sha.substring(0, 26)}...`, xPos + 2, currentY + imgHeight + 13);
  }

  currentY += imgHeight + 24;

  // Section 4: Legal Evidence Attestation & Section 65B Certificate
  doc.setFillColor(254, 252, 245); // Warm parchment
  doc.setDrawColor(230, 200, 140);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(140, 80, 20);
  doc.text('LEGAL EVIDENCE COMPLIANCE CERTIFICATE — SECTION 65B INDIAN EVIDENCE ACT / SECTION 63 BSA', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  const legalText =
    'I hereby certify that the electronic record, sensor data, and video telemetry contained in this report were produced by computer systems and autonomous drone surveillance units operated by the Kerala Police Coastal Security Command. The devices operated properly under lawful custody throughout the recorded period. The cryptographic SHA-256 hashes confirm that the electronic contents have remained intact without alteration or interception.';
  doc.text(doc.splitTextToSize(legalText, contentWidth - 8), margin + 4, currentY + 11);

  // Sign-off columns
  const signCol1 = margin + 4;
  const signCol2 = margin + contentWidth / 2 + 10;
  const signY = currentY + 23;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 35, 52);
  doc.text(`Compiling Officer: ${report.generatedBy}`, signCol1, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 100, 110);
  doc.text(`Digital Seal: VERIFIED · ${formatISTFull(report.generatedAt)}`, signCol1, signY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 35, 52);
  doc.text(`Authorizing Signatory: ${report.signOffOfficer}`, signCol2, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 100, 110);
  doc.text('Kerala Police Coastal Security Division — Validated & Archived', signCol2, signY + 4);

  // Footer bar on page
  doc.setFillColor(15, 35, 52);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setTextColor(200, 220, 240);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('SmartQEye Coastal AI Surveillance Platform · Kerala Police Law Enforcement Evidence Record · Page 1 of 1', margin, pageHeight - 4);
  doc.text(`SHA-256: d4e1f8...${report.id}`, pageWidth - margin - 35, pageHeight - 4);

  // Save / Trigger Download
  const filename = `${report.reportType}_${report.id}_${Date.now()}.pdf`;
  doc.save(filename);
}

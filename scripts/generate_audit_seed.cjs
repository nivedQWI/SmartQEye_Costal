// scripts/generate_audit_seed.cjs
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const officers = [
  { id: 'u-op1', name: 'SI Ananya Ramesh', role: 'OPERATOR', ip: '10.200.4.15' },
  { id: 'u-sup1', name: 'CI Saji Varghese', role: 'SUPERVISOR', ip: '10.200.4.12' },
  { id: 'u-zadm', name: 'CI Krishna N.', role: 'ZONE_ADMIN', ip: '10.200.4.8' },
  { id: 'u-sadm', name: 'Thomas J.', role: 'SYS_ADMIN', ip: '10.200.4.2' },
  { id: 'u-mc1', name: 'Arun P.', role: 'MODEL_CUSTODIAN', ip: '10.200.4.20' },
  { id: 'u-aud1', name: 'Inspector Rahul Menon', role: 'AUDITOR', ip: '10.200.4.30' },
  { id: 'u-op2', name: 'HC Rajan K.', role: 'OPERATOR', ip: '10.200.4.16' },
  { id: 'u-an1', name: 'ASI Priya V.', role: 'ANALYST', ip: '10.200.4.18' },
];

const actionTemplates = [
  {
    action: 'USER_LOGIN_MFA_SUCCESS',
    targetType: 'SYSTEM',
    targetId: 'AUTH-GATEWAY',
    outcome: 'SUCCESS',
    summary: 'Biometric TOTP verified. Session established.',
  },
  {
    action: 'RECOMMENDED_PATROL_RESPONSE',
    targetType: 'ALERT',
    targetId: 'ALT-20261016-0001',
    outcome: 'SUCCESS',
    summary: 'Recommended fast interceptor response for Vizhinjam restricted perimeter breach.',
  },
  {
    action: 'ACKNOWLEDGED_ALERT',
    targetType: 'ALERT',
    targetId: 'ALT-20261016-0002',
    outcome: 'SUCCESS',
    summary: 'Night shoreline approach acknowledged; continuing thermal tracking.',
  },
  {
    action: 'CFS_FRAME_MODE_AUTO_SWITCH',
    targetType: 'FEED',
    targetId: 'FEED-UAV-KL-03',
    outcome: 'SUCCESS',
    summary: 'CFS switched LIGHT -> FULL (Zone interaction detected with contact C-1042).',
  },
  {
    action: 'CKFE_KEYFRAME_EXTRACTED',
    targetType: 'EVIDENCE',
    targetId: 'CKFE-20261016-891',
    outcome: 'SUCCESS',
    summary: 'Extracted high-confidence keyframe at peak closest approach (28.4 kt).',
  },
  {
    action: 'ZONE_PROFILE_UPDATED',
    targetType: 'ZONE',
    targetId: 'Z-01',
    outcome: 'SUCCESS',
    summary: 'Adjusted speed breach sensitivity: threshold 18 kt -> 16 kt.',
  },
  {
    action: 'MODEL_INFERENCE_CHECK',
    targetType: 'MODEL',
    targetId: 'RTMDet-L',
    outcome: 'SUCCESS',
    summary: 'Central GPU Node A health heartbeat valid: 24.8 fps @ 18.2ms latency.',
  },
  {
    action: 'ELIR_DOSSIER_EXPORTED',
    targetType: 'INCIDENT',
    targetId: 'INC-20261016-0001',
    outcome: 'SUCCESS',
    summary: 'Exported signed court evidence package with SHA-256 manifest.',
  },
  {
    action: 'EVIDENCE_SEAL_VERIFIED',
    targetType: 'EVIDENCE',
    targetId: 'INC-20261016-0001',
    outcome: 'SUCCESS',
    summary: 'In-browser tamper check: 6 SHA-256 evidence digests match court registry.',
  },
  {
    action: 'CONTACT_OCCLUSION_RECOVERED',
    targetType: 'CONTACT',
    targetId: 'C-1042',
    outcome: 'SUCCESS',
    summary: 'Target reacquired after 8.2s pier occlusion. Continuity confidence: 91.4%.',
  },
  {
    action: 'ABANDONED_OBJECT_FLAGGED',
    targetType: 'ALERT',
    targetId: 'ABN-01',
    outcome: 'FLAGGED',
    summary: 'Unattended canister stationary for 34 min on Shanghumugham beach.',
  },
  {
    action: 'UNAUTHORISED_EXPORT_BLOCKED',
    targetType: 'INCIDENT',
    targetId: 'INC-20261016-0003',
    outcome: 'BLOCKED',
    summary: 'Export request denied: role OPERATOR lacks EXPORT permission.',
  },
];

const totalEntries = 320;
const entries = [];
let prevHash = GENESIS_PREV_HASH;

// Start 48 hours ago
const baseTime = Date.now() - 48 * 3600 * 1000;
const stepMs = Math.floor((48 * 3600 * 1000) / totalEntries);

for (let i = 0; i < totalEntries; i++) {
  const officer = officers[i % officers.length];
  const template = actionTemplates[i % actionTemplates.length];
  const timestamp = new Date(baseTime + i * stepMs).toISOString();
  const id = `aud-${String(i + 1).padStart(4, '0')}`;
  const sessionId = `sess-${1000 + (i % 37)}`;

  const canonicalPayload = [
    prevHash,
    timestamp,
    officer.id,
    template.action,
    template.targetType,
    template.targetId,
    template.outcome,
    sessionId,
  ].join('|');

  const blockHash = sha256(canonicalPayload);

  entries.push({
    id,
    timestamp,
    userId: officer.id,
    userName: officer.name,
    userRole: officer.role,
    action: template.action,
    targetType: template.targetType,
    targetId: template.targetId,
    outcome: template.outcome,
    ipAddress: officer.ip,
    sessionId,
    beforeAfterSummary: template.summary,
    detail: {
      stepIndex: i + 1,
      subsystem: 'SmartQEye-Kernel',
      integrityCheck: 'PASSED',
    },
    prevHash,
    hash: blockHash,
  });

  prevHash = blockHash;
}

const fileContent = `// ============================================================
// SmartQEye Coastal — Cryptographic Audit Trail Seed
// 320 Hash-Chained Blocks from Genesis to Head (SHA-256 Web Crypto)
// ============================================================

import type { AuditEntry } from '@/types';

export const AUDIT_TRAIL_SEED: AuditEntry[] = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/auditTrailSeed.ts'), fileContent);
console.log('Successfully generated ' + entries.length + ' hash-chained audit blocks.');

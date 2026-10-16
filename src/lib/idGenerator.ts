// ============================================================
// SmartQEye Coastal — Identifier & Relative Timestamp Generators
// Single source of truth for format compliance across missions, alerts,
// incidents, contacts, and UAVs. Ensures demo dates are always relative to "now".
// ============================================================

/**
 * Returns current date string in IST formatted as YYYYMMDD
 */
export function getIstDateStr(): string {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = istFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value ?? '2026';
  const month = parts.find(p => p.type === 'month')?.value ?? '10';
  const day = parts.find(p => p.type === 'day')?.value ?? '16';
  return `${year}${month}${day}`;
}

/**
 * Format: MSN-YYYYMMDD-HHMM-SS-SQUADRON
 */
export function formatMissionId(squadron: string, hhmm: string, seq: number = 1): string {
  const dateStr = getIstDateStr();
  const cleanSquadron = squadron.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
  const seqStr = String(seq).padStart(2, '0');
  return `MSN-${dateStr}-${hhmm}-${seqStr}-${cleanSquadron}`;
}

/**
 * Format: ALR-YYYYMMDD-nnnn
 */
export function formatAlertId(seq: number): string {
  const dateStr = getIstDateStr();
  return `ALR-${dateStr}-${String(seq).padStart(4, '0')}`;
}

/**
 * Format: INC-YYYYMMDD-nnnn
 */
export function formatIncidentId(seq: number): string {
  const dateStr = getIstDateStr();
  return `INC-${dateStr}-${String(seq).padStart(4, '0')}`;
}

/**
 * Format: C-xxxx
 */
export function formatContactCode(idNum: number): string {
  return `C-${idNum}`;
}

/**
 * Format: UAV-KL-01 ... UAV-KL-06
 */
export function formatUavCode(index: number): string {
  return `UAV-KL-${String(index).padStart(2, '0')}`;
}

/**
 * Returns ISO string relative to current time minus specified minutes
 */
export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/**
 * Returns ISO string relative to current time minus specified hours
 */
export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

// ============================================================
// SmartQEye Coastal — Utility functions
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Severity, FeedState, ContactClass, AttentionLevel } from '@/types';

// ─── Class merging ────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── IST time formatting ──────────────────────────────────────
export function formatIST(dateStr: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...opts,
  });
}

export function formatISTDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatISTFull(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatUTC(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function timeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatISTDate(date);
}

export function nowIST(): string {
  return formatIST(new Date());
}

// ─── Severity ─────────────────────────────────────────────────
export const SEV_COLOURS: Record<Severity, string> = {
  INFO:     'var(--sev-info)',
  LOW:      'var(--sev-low)',
  MEDIUM:   'var(--sev-medium)',
  HIGH:     'var(--sev-high)',
  CRITICAL: 'var(--sev-critical)',
};

export const SEV_BG: Record<Severity, string> = {
  INFO:     'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  LOW:      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  MEDIUM:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  HIGH:     'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// Severity glyph shapes (colour-blind safe: each has a unique shape)
export const SEV_GLYPH: Record<Severity, string> = {
  INFO:     '●',
  LOW:      '▲',
  MEDIUM:   '◆',
  HIGH:     '⬟',
  CRITICAL: '⬛',
};

export const SEV_LABELS: Record<Severity, string> = {
  INFO: 'Info', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical',
};

// ─── Attention levels ─────────────────────────────────────────
export const ATTENTION_LABELS: Record<AttentionLevel, string> = {
  RECORD_ONLY: 'Record Only',
  MONITOR:     'Monitor',
  ATTENTION:   'Attention',
  CRITICAL:    'Critical',
};

// ─── Feed state ───────────────────────────────────────────────
export const FEED_STATE_LABELS: Record<FeedState, string> = {
  LIVE:          'Live',
  BUFFERING:     'Buffering',
  NO_SIGNAL:     'No Signal',
  RECORDED:      'Recorded',
  EDGE_SYNC_LAG: 'Edge Sync Lag',
};

export const FEED_STATE_RING: Record<FeedState, string> = {
  LIVE:          'ring-live',
  BUFFERING:     'ring-buffering',
  NO_SIGNAL:     'ring-no-signal',
  RECORDED:      'ring-recorded',
  EDGE_SYNC_LAG: 'ring-edge-sync',
};

export const FEED_STATE_COLOUR: Record<FeedState, string> = {
  LIVE:          '#2ECC71',
  BUFFERING:     '#E0A526',
  NO_SIGNAL:     '#C8352E',
  RECORDED:      '#2B7FA6',
  EDGE_SYNC_LAG: '#9B59B6',
};

// ─── Contact class ────────────────────────────────────────────
export const CONTACT_CLASS_LABELS: Record<ContactClass, string> = {
  VESSEL:                   'Vessel',
  SMALL_CRAFT:              'Small Craft',
  FISHING_BOAT:             'Fishing Boat',
  UNKNOWN_VESSEL:           'Unknown Vessel (Broad Class)',
  MECHANISED_TRAWLER:       'Mechanised Trawler',
  MOTORISED_COUNTRY_CRAFT:  'Motorised Country Craft',
  TRADITIONAL_WOODEN_CRAFT: 'Traditional Wooden Craft',
  CANOE_CATAMARAN:          'Canoe / Catamaran',
  RECREATIONAL_CRAFT:       'Recreational / Water-sports Craft',
  PERSON:                   'Person',
  VEHICLE:                  'Vehicle',
  UNKNOWN:                  'Unknown',
};

export const CONTACT_CLASS_ICON: Record<ContactClass, string> = {
  VESSEL:                   '🚢',
  SMALL_CRAFT:              '⛵',
  FISHING_BOAT:             '🎣',
  UNKNOWN_VESSEL:           '🛥️',
  MECHANISED_TRAWLER:       '⛴️',
  MOTORISED_COUNTRY_CRAFT:  '🚤',
  TRADITIONAL_WOODEN_CRAFT: '🛶',
  CANOE_CATAMARAN:          '🛶',
  RECREATIONAL_CRAFT:       '🏄',
  PERSON:                   '🚶',
  VEHICLE:                  '🚗',
  UNKNOWN:                  '❓',
};

// ─── Coordinates ──────────────────────────────────────────────
export function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${latDir} ${Math.abs(lon).toFixed(5)}°${lonDir}`;
}

export function formatDeg(deg: number): string {
  return `${Math.round(deg).toString().padStart(3, '0')}°`;
}

// ─── Numbers ──────────────────────────────────────────────────
export function formatPct(val: number): string {
  return `${Math.round(val)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function truncateSha(sha: string, len = 8): string {
  return sha.slice(0, len) + '…';
}

// ─── Event type label ─────────────────────────────────────────
export function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    person_detected: 'Person Detected',
    vehicle_detected: 'Vehicle Detected',
    vessel_detected: 'Vessel Detected',
    zone_entry: 'Zone Entry',
    zone_exit: 'Zone Exit',
    zone_dwell_exceeded: 'Zone Dwell Exceeded',
    intrusion: 'Intrusion',
    crowd_threshold_exceeded: 'Crowd Threshold Exceeded',
    abandoned_object: 'Abandoned Object',
    stationary_object: 'Stationary Object',
    loitering: 'Loitering',
    prolonged_presence: 'Prolonged Presence',
    repeated_shoreline_approach: 'Repeated Shoreline Approach',
    recurring_zone_entry: 'Recurring Zone Entry',
    course_speed_change: 'Course / Speed Change',
    unusual_stationary: 'Unusual Stationary',
    approach_departure_cycle: 'Approach / Departure Cycle',
    convergence: 'Convergence',
    prolonged_proximity: 'Prolonged Proximity',
    co_travel: 'Co-travel',
    separation_reappearance: 'Separation & Reappearance',
    video_loss: 'Video Loss',
    telemetry_loss: 'Telemetry Loss',
    stream_degraded: 'Stream Degraded',
    node_offline: 'Node Offline',
    model_deployed: 'Model Deployed',
  };
  return labels[type] ?? type;
}

// ─── Clipboard ────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

// ─── Type guard ───────────────────────────────────────────────
export function isSeverity(val: unknown): val is Severity {
  return ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(val as string);
}

// ============================================================
// SmartQEye Coastal — Context Engine API Client
// Calls the FastAPI backend at VITE_CONTEXT_API (default :8765)
// Supports automatic fallback to same-origin reverse proxy
// ============================================================

import type {
  ContextZoneProfiles,
  ContextResult,
  ContextEvaluationRequest,
  AutomatedTrackRequest,
  ObservationEvaluationRequest,
  TrackEvaluationResult,
} from '@/types/contextIntelligence';

const BASE = (import.meta.env.VITE_CONTEXT_API as string | undefined) ?? 'http://localhost:8765';

async function fetchWithFallback(path: string, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(`${BASE}${path}`, init);
    if (res.ok) return res;
    // If 404 or bad gateway on BASE, try relative path
    if (res.status >= 500 || res.status === 404) {
      const fallback = await fetch(path, init);
      if (fallback.ok) return fallback;
    }
    return res;
  } catch (err) {
    if (BASE) {
      try {
        return await fetch(path, init);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithFallback(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Context Engine error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const contextEngineApi = {
  /** Liveness check — resolves true if online, false if unreachable. */
  health: async (): Promise<{ status: string; service: string; version: string } | null> => {
    try {
      const res = await fetchWithFallback('/health', { signal: AbortSignal.timeout(3000) });
      return res.ok ? (res.json() as Promise<{ status: string; service: string; version: string }>) : null;
    } catch {
      return null;
    }
  },

  /** All Police-defined context zone profiles. */
  profiles: (): Promise<ContextZoneProfiles> =>
    fetchWithFallback('/api/context/profiles').then(async r => {
      if (!r.ok) throw new Error('Failed to load context profiles');
      return r.json() as Promise<ContextZoneProfiles>;
    }),

  /** Manual behaviour-based context evaluation. */
  evaluate: (req: ContextEvaluationRequest): Promise<ContextResult> =>
    post('/api/context/evaluate', req),

  /** Automated track point derivation → context evaluation. */
  evaluateTrack: (req: AutomatedTrackRequest): Promise<TrackEvaluationResult> =>
    post('/api/track/evaluate', req),

  /** Observation code + sensor → context evaluation. */
  evaluateObservations: (req: ObservationEvaluationRequest): Promise<ContextResult> =>
    post('/api/observation/evaluate', req),
};

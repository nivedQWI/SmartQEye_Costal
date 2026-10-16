// ============================================================
// SmartQEye Coastal — Cryptographic Utilities
// In-browser Web Crypto SHA-256 for audit hash-chains & ELIR evidence
// ============================================================

import type { AuditEntry } from '@/types';

/**
 * Computes hexadecimal SHA-256 hash using native Web Crypto API.
 * Air-gapped and runs 100% in-browser with zero external dependencies.
 */
export async function sha256Hex(input: string): Promise<string> {
  const subtle =
    (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ||
    (typeof window !== 'undefined' && window.crypto && window.crypto.subtle);

  if (subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback FNV-1a derived 64-character pseudo-hash for non-browser/test environments
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c64e6d ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  const part2 = (4294967296 * (2097151 & h1) + (h2 >>> 0)).toString(16).padStart(16, '0');
  return (part1 + part2 + part1 + part2).slice(0, 64);
}

export const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Builds the canonical string representation of an audit block before hashing.
 */
export function buildAuditBlockPayload(entry: {
  prevHash: string;
  timestamp: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome?: string;
  sessionId?: string;
}): string {
  return [
    entry.prevHash || GENESIS_PREV_HASH,
    entry.timestamp,
    entry.userId,
    entry.action,
    entry.targetType,
    entry.targetId,
    entry.outcome || 'SUCCESS',
    entry.sessionId || 'sess-0000',
  ].join('|');
}

/**
 * Computes block hash for an audit entry.
 */
export async function computeAuditBlockHash(entry: {
  prevHash: string;
  timestamp: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome?: string;
  sessionId?: string;
}): Promise<string> {
  const payload = buildAuditBlockPayload(entry);
  return await sha256Hex(payload);
}

export interface ChainVerificationResult {
  valid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  brokenIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  errorDetail?: string;
}

/**
 * Verifies the entire cryptographic audit hash-chain from Genesis to Head.
 * Checks:
 * 1. Genesis block has prevHash === GENESIS_PREV_HASH.
 * 2. Every block's prevHash matches the previous block's hash.
 * 3. Every block's hash matches SHA-256 of its canonical content.
 */
export async function verifyAuditChain(entries: AuditEntry[]): Promise<ChainVerificationResult> {
  if (!entries || entries.length === 0) {
    return { valid: true, totalBlocks: 0, verifiedBlocks: 0 };
  }

  // Sort chronological (oldest to newest) for chain verification
  const chronological = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  for (let i = 0; i < chronological.length; i++) {
    const current = chronological[i];
    const prev = i > 0 ? chronological[i - 1] : null;

    const expectedPrevHash = prev ? (prev.hash ?? '') : GENESIS_PREV_HASH;
    if (current.prevHash && current.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalBlocks: entries.length,
        verifiedBlocks: i,
        brokenIndex: i,
        expectedHash: expectedPrevHash,
        actualHash: current.prevHash,
        errorDetail: `Block #${i} (${current.id}) prevHash does not match previous block hash`,
      };
    }

    if (current.hash) {
      const computedHash = await computeAuditBlockHash({
        prevHash: current.prevHash ?? expectedPrevHash,
        timestamp: current.timestamp,
        userId: current.userId,
        action: current.action,
        targetType: current.targetType,
        targetId: current.targetId,
        outcome: current.outcome,
        sessionId: current.sessionId,
      });

      if (computedHash.toLowerCase() !== current.hash.toLowerCase()) {
        return {
          valid: false,
          totalBlocks: entries.length,
          verifiedBlocks: i,
          brokenIndex: i,
          expectedHash: computedHash,
          actualHash: current.hash,
          errorDetail: `Block #${i} (${current.id}) cryptographic digest divergence detected`,
        };
      }
    }
  }

  return {
    valid: true,
    totalBlocks: entries.length,
    verifiedBlocks: entries.length,
  };
}

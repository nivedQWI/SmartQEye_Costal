// ============================================================
// SmartQEye Coastal — Feed → Coastal Location resolver
// Resolves each drone feed (by its label / place name) to the real
// coastal coordinates of the Kerala port / beach it is patrolling.
// Used by Live Monitor focus mini-map, Fleet Wall zone filter and
// Command Center port filter so every view agrees on "where" a feed is.
// ============================================================

import type { Feed } from '@/types';

export interface CoastalPlace {
  key: string;            // stable id
  name: string;           // display name
  district: string;
  zone: string;           // coastal zone grouping (used by Fleet Wall dropdown)
  lat: number;            // just offshore of the port / beach
  lon: number;
  match: string[];        // lowercase keywords matched against feed label
}

export const COASTAL_PLACES: CoastalPlace[] = [
  { key: 'kochi',         name: 'Kochi Port & Naval Base Channel', district: 'Ernakulam',          zone: 'Kochi',               lat: 9.9655,  lon: 76.2390, match: ['kochi', 'cochin', 'vypin'] },
  { key: 'vizhinjam',     name: 'Vizhinjam International Seaport', district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.3790,  lon: 76.9860, match: ['vizhinjam'] },
  { key: 'kovalam',       name: 'Kovalam Lighthouse Beach',        district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.3990,  lon: 76.9770, match: ['kovalam'] },
  { key: 'shanghumugham', name: 'Shanghumugham Beach',             district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.4790,  lon: 76.9090, match: ['shanghumugham'] },
  { key: 'chowara',       name: 'Chowara Cliff Coast',             district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.3560,  lon: 77.0100, match: ['chowara'] },
  { key: 'poovar',        name: 'Poovar Estuary',                  district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.3120,  lon: 77.0660, match: ['poovar'] },
  { key: 'muthalapozhi',  name: 'Muthalapozhi Harbour Mouth',      district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.6380,  lon: 76.7740, match: ['muthalapozhi'] },
  { key: 'varkala',       name: 'Varkala Cliff Sea Wall',          district: 'Thiruvananthapuram', zone: 'Thiruvananthapuram',  lat: 8.7350,  lon: 76.7000, match: ['varkala'] },
  { key: 'neendakara',    name: 'Neendakara Fishing Harbour',      district: 'Kollam',             zone: 'Kollam & Alappuzha',  lat: 8.9370,  lon: 76.5370, match: ['neendakara', 'kollam'] },
  { key: 'alappuzha',     name: 'Alappuzha Beach & Pier',          district: 'Alappuzha',          zone: 'Kollam & Alappuzha',  lat: 9.4930,  lon: 76.3160, match: ['alappuzha', 'alleppey'] },
  { key: 'beypore',       name: 'Beypore Deep Harbour',            district: 'Kozhikode',          zone: 'Kozhikode',           lat: 11.1640, lon: 75.7990, match: ['beypore', 'kozhikode'] },
  { key: 'azhikkal',      name: 'Azhikkal Port & Estuary',         district: 'Kannur',             zone: 'Kannur & Kasaragod',  lat: 11.9380, lon: 75.3000, match: ['azhikkal', 'kannur'] },
  { key: 'bekal',         name: 'Bekal Fort Coastline',            district: 'Kasaragod',          zone: 'Kannur & Kasaragod',  lat: 12.3920, lon: 75.0280, match: ['bekal', 'kasaragod'] },
];

const FALLBACK = COASTAL_PLACES[0];

/** Resolve a free-text label (feed label, video title, location string) to a coastal place. */
export function resolvePlace(text: string | undefined | null): CoastalPlace {
  const t = (text ?? '').toLowerCase();
  return COASTAL_PLACES.find(p => p.match.some(m => t.includes(m))) ?? FALLBACK;
}

/** Resolve a feed to the coastal place its drone is patrolling. */
export function getFeedPlace(feed: Pick<Feed, 'label'>): CoastalPlace {
  return resolvePlace(feed.label);
}

/** Unique coastal zones (for dropdown filters), in north→south display order. */
export const COASTAL_ZONES: string[] = [
  'Kannur & Kasaragod',
  'Kozhikode',
  'Kochi',
  'Kollam & Alappuzha',
  'Thiruvananthapuram',
];

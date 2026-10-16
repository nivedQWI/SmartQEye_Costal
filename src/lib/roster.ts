// ============================================================
// SmartQEye Coastal — Kerala Police Fictional Roster & Stations
// Complies with Appendix B specification (no real individual names)
// ============================================================

import type { UserRole } from '@/types';

export interface PoliceStation {
  id: string;
  name: string;
  code: string;
  district: string;
  jurisdictionNm: number; // nautical miles
  lat: number;
  lon: number;
  isHeadquarters?: boolean;
}

export interface OfficerPersona {
  id: string;
  badgeNumber: string;
  name: string;
  rank: string;
  role: UserRole;
  stationId: string;
  stationName: string;
  unit: string;
  phonePlaceholder: string;
}

export const KERALA_COASTAL_STATIONS: PoliceStation[] = [
  {
    id: 'st-vizhinjam',
    name: 'Vizhinjam Coastal Police Station',
    code: 'CPS-VZM',
    district: 'Thiruvananthapuram',
    jurisdictionNm: 12,
    lat: 8.3792,
    lon: 76.9814,
  },
  {
    id: 'st-neendakara',
    name: 'Neendakara Coastal Police Station',
    code: 'CPS-NDK',
    district: 'Kollam',
    jurisdictionNm: 12,
    lat: 8.9372,
    lon: 76.5411,
  },
  {
    id: 'st-thoppumpady',
    name: 'Thoppumpady Coastal Police Station',
    code: 'CPS-TPY',
    district: 'Kochi / Ernakulam',
    jurisdictionNm: 12,
    lat: 9.9312,
    lon: 76.2673,
  },
  {
    id: 'st-beypore',
    name: 'Beypore Coastal Police Station',
    code: 'CPS-BYP',
    district: 'Kozhikode',
    jurisdictionNm: 12,
    lat: 11.1783,
    lon: 75.8078,
  },
  {
    id: 'st-azhikkal',
    name: 'Azhikkal Coastal Police Station',
    code: 'CPS-AZH',
    district: 'Kannur',
    jurisdictionNm: 12,
    lat: 11.9324,
    lon: 75.3129,
  },
  {
    id: 'st-hq-tvm',
    name: 'Coastal Police Headquarters & Drone Forensic Lab',
    code: 'CPS-HQ',
    district: 'Thiruvananthapuram',
    jurisdictionNm: 200, // EEZ Coordination
    lat: 8.5061,
    lon: 76.9558,
    isHeadquarters: true,
  },
];

export const KERALA_POLICE_ROSTER: OfficerPersona[] = [
  {
    id: 'usr-hari',
    badgeNumber: 'KP-8812',
    name: 'DySP K. R. Harikrishnan',
    rank: 'Deputy Superintendent of Police',
    role: 'SUPERVISOR',
    stationId: 'st-hq-tvm',
    stationName: 'Coastal Police HQ / Cyber Division',
    unit: 'Drone Forensic Operations & Maritime Surveillance',
    phonePlaceholder: '+91 94979 00101',
  },
  {
    id: 'usr-saji',
    badgeNumber: 'KP-7420',
    name: 'CI Saji Varghese',
    rank: 'Circle Inspector (SHO)',
    role: 'SUPERVISOR',
    stationId: 'st-vizhinjam',
    stationName: 'Vizhinjam Coastal Police Station',
    unit: 'Station House & Coastal Patrol Sector',
    phonePlaceholder: '+91 94979 00102',
  },
  {
    id: 'usr-ananya',
    badgeNumber: 'KP-9144',
    name: 'SI Ananya Ramesh',
    rank: 'Sub-Inspector',
    role: 'OPERATOR',
    stationId: 'st-vizhinjam',
    stationName: 'Vizhinjam Coastal Police Station',
    unit: 'Tactical Drone Remote Pilot & Sensor Operator',
    phonePlaceholder: '+91 94979 00103',
  },
  {
    id: 'usr-pradeep',
    badgeNumber: 'KP-8219',
    name: 'SI Pradeep Kumar',
    rank: 'Sub-Inspector',
    role: 'SUPERVISOR',
    stationId: 'st-neendakara',
    stationName: 'Neendakara Coastal Police Station',
    unit: 'Coastal Intelligence & Temporal Behaviour Analysis',
    phonePlaceholder: '+91 94979 00104',
  },
  {
    id: 'usr-bineesh',
    badgeNumber: 'KP-6531',
    name: 'SCPO M. Bineesh',
    rank: 'Senior Civil Police Officer',
    role: 'OPERATOR',
    stationId: 'st-vizhinjam',
    stationName: 'Vizhinjam Coastal Police Station',
    unit: 'Surveillance Flight Monitoring & Interceptor Boat Comms',
    phonePlaceholder: '+91 94979 00105',
  },
  {
    id: 'usr-deepa',
    badgeNumber: 'KP-9801',
    name: 'CPO Deepa S.',
    rank: 'Civil Police Officer',
    role: 'SYS_ADMIN',
    stationId: 'st-hq-tvm',
    stationName: 'Drone Forensic Lab, Cyber Division',
    unit: 'AI Model Registry, Dataset Curation & Evidence Registry',
    phonePlaceholder: '+91 94979 00106',
  },
  {
    id: 'usr-auditor',
    badgeNumber: 'KP-5011',
    name: 'IG Coastal Security (Audit Cell)',
    rank: 'Inspector General of Police',
    role: 'AUDITOR',
    stationId: 'st-hq-tvm',
    stationName: 'Kerala Police State Headquarters',
    unit: 'Statutory Compliance, Audit Trail & Forensic Review',
    phonePlaceholder: '+91 94979 00100',
  },
];

// ============================================================
// SmartQEye Coastal — Coastal Drone Video Stream Catalog
// Maps videos from D:\SmartQEye_Costal\SmartQEye_Costal_Videos
// Applies RGB (normal), Thermal (ironbow/FLIR), and Night Vision (NVG green phosphor)
// ============================================================

import type { CSSProperties } from 'react';
import type { Modality } from '@/types';

export interface CoastalVideo {
  id: string;
  fileName: string;
  videoUrl: string;
  modality: Modality;
  title: string;
  location: string;
  uavCode: string;
  missionCode: string;
  filterStyle: CSSProperties;
  badgeLabel: string;
  description: string;
}

// ─── Filter Presets ──────────────────────────────────────────

export const FILTER_PRESETS: Record<Modality, CSSProperties> = {
  // RGB: Standard optical daylight video as-is
  RGB: {
    filter: 'none',
  },
  // Thermal: Long-Wave Infrared (LWIR) Ironbow / false-color heat signature
  THERMAL: {
    filter: 'contrast(1.45) saturate(2.2) hue-rotate(190deg) invert(0.9) brightness(1.1)',
  },
  // Night Vision: Tactical Gen-3 light-intensifier green phosphor (P-43 green)
  NIGHT_VISION: {
    filter: 'contrast(1.35) brightness(1.25) sepia(1) hue-rotate(85deg) saturate(3.8)',
  },
};

// ─── Complete 24-Video Catalog ───────────────────────────────

export const COASTAL_VIDEOS: CoastalVideo[] = [
  // ─── RGB Feeds (15 Videos: Shown as it is) ───
  {
    id: 'vid-rgb-01',
    fileName: 'RGB_1.mp4',
    videoUrl: '/videos/RGB_1.mp4',
    modality: 'RGB',
    title: 'Vizhinjam Seaport Optical Patrol',
    location: 'Vizhinjam International Seaport',
    uavCode: 'UAV-KL-01',
    missionCode: 'MSN-20261016-01',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'High-definition 4K optical daylight coastal scan',
  },
  {
    id: 'vid-rgb-02',
    fileName: 'RGB_2.mp4',
    videoUrl: '/videos/RGB_2.mp4',
    modality: 'RGB',
    title: 'Kovalam Light House Beach Perimeter',
    location: 'Kovalam Light House Beach',
    uavCode: 'UAV-KL-02',
    missionCode: 'MSN-20261016-02',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Tourist perimeter and shore surveillance',
  },
  {
    id: 'vid-rgb-03',
    fileName: 'RGB_3.mp4',
    videoUrl: '/videos/RGB_3.mp4',
    modality: 'RGB',
    title: 'Shanghumugham Shoreline Watch',
    location: 'Shanghumugham Airfield Coast',
    uavCode: 'UAV-KL-03',
    missionCode: 'MSN-20261016-03',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Coastal shoreline and low-altitude observation',
  },
  {
    id: 'vid-rgb-04',
    fileName: 'RGB_4.mp4',
    videoUrl: '/videos/RGB_4.mp4',
    modality: 'RGB',
    title: 'Poovar Estuary Marine Patrol',
    location: 'Poovar Golden Sand Estuary',
    uavCode: 'UAV-KL-04',
    missionCode: 'MSN-20261016-04',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'River mouth and tidal estuary transit security',
  },
  {
    id: 'vid-rgb-05',
    fileName: 'RGB_5.mp4',
    videoUrl: '/videos/RGB_5.mp4',
    modality: 'RGB',
    title: 'Adimalathura Fishing Harbor Line',
    location: 'Adimalathura Coastal Line',
    uavCode: 'UAV-KL-05',
    missionCode: 'MSN-20261016-05',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Artisanal vessel launch corridor watch',
  },
  {
    id: 'vid-rgb-06',
    fileName: 'RGB_6.mp4',
    videoUrl: '/videos/RGB_6.mp4',
    modality: 'RGB',
    title: 'Chowara Cliff High-Angle Watch',
    location: 'Chowara Cliff Buffer Zone',
    uavCode: 'UAV-KL-06',
    missionCode: 'MSN-20261016-06',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Cliffside buffer and rocky reef observation',
  },
  {
    id: 'vid-rgb-07',
    fileName: 'RGB_7.mp4',
    videoUrl: '/videos/RGB_7.mp4',
    modality: 'RGB',
    title: 'Muthalapozhi Breakwater Channel',
    location: 'Muthalapozhi Harbor Approach',
    uavCode: 'UAV-KL-01',
    missionCode: 'MSN-20261016-07',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Breakwater navigation mouth monitoring',
  },
  {
    id: 'vid-rgb-08',
    fileName: 'RGB_8.mp4',
    videoUrl: '/videos/RGB_8.mp4',
    modality: 'RGB',
    title: 'Neendakara Deep Harbor Outer Approach',
    location: 'Neendakara Outer Basin',
    uavCode: 'UAV-KL-02',
    missionCode: 'MSN-20261016-08',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Commercial trawler lane navigation survey',
  },
  {
    id: 'vid-rgb-09',
    fileName: 'RGB_9.mp4',
    videoUrl: '/videos/RGB_9.mp4',
    modality: 'RGB',
    title: 'Alappuzha Pier & Coastline Sweep',
    location: 'Alappuzha Historic Pier',
    uavCode: 'UAV-KL-03',
    missionCode: 'MSN-20261016-09',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Beachfront tourist and public gathering scan',
  },
  {
    id: 'vid-rgb-10',
    fileName: 'RGB_10.mp4',
    videoUrl: '/videos/RGB_10.mp4',
    modality: 'RGB',
    title: 'Kochi Port & Naval Base Perimeter',
    location: 'Kochi Port Channel & Naval Sector',
    uavCode: 'UAV-KL-04',
    missionCode: 'MSN-20261016-10',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Restricted naval basin perimeter control',
  },
  {
    id: 'vid-rgb-11',
    fileName: 'RGB_11.mp4',
    videoUrl: '/videos/RGB_11.mp4',
    modality: 'RGB',
    title: 'Beypore Deep Harbour Patrol',
    location: 'Beypore Maritime Terminal',
    uavCode: 'UAV-KL-05',
    missionCode: 'MSN-20261016-11',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Cargo vessel quay and river mouth radar sync',
  },
  {
    id: 'vid-rgb-12',
    fileName: 'RGB_12.mp4',
    videoUrl: '/videos/RGB_12.mp4',
    modality: 'RGB',
    title: 'Kannur Azhikkal Estuary Watch',
    location: 'Azhikkal Port Littoral Zone',
    uavCode: 'UAV-KL-06',
    missionCode: 'MSN-20261016-12',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Northern estuary and coastal sandbar monitor',
  },
  {
    id: 'vid-rgb-13',
    fileName: 'RGB_13.mp4',
    videoUrl: '/videos/RGB_13.mp4',
    modality: 'RGB',
    title: 'Bekal Fort High-Security Coastal Sector',
    location: 'Bekal Fort Coastline',
    uavCode: 'UAV-KL-01',
    missionCode: 'MSN-20261016-13',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Heritage coastline buffer and sea-lane track',
  },
  {
    id: 'vid-rgb-14',
    fileName: 'RGB_14.mp4',
    videoUrl: '/videos/RGB_14.mp4',
    modality: 'RGB',
    title: 'Varkala North Cliff Sea Patrol',
    location: 'Varkala Cliff Sea Wall',
    uavCode: 'UAV-KL-02',
    missionCode: 'MSN-20261016-14',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Cliff littoral zone search & rescue standby',
  },
  {
    id: 'vid-rgb-15',
    fileName: 'RGB_15.mp4',
    videoUrl: '/videos/RGB_15.mp4',
    modality: 'RGB',
    title: 'Vizhinjam Outer Anchorage Night Recon',
    location: 'Vizhinjam Outer Anchorage Basin',
    uavCode: 'UAV-KL-03',
    missionCode: 'MSN-20261016-15',
    filterStyle: FILTER_PRESETS.RGB,
    badgeLabel: 'RGB OPTICAL',
    description: 'Container mother-vessel mooring clearance',
  },

  // ─── Thermal Feeds (4 Videos: With Thermal Ironbow Filter) ───
  {
    id: 'vid-thm-01',
    fileName: 'Thermal_1.mp4',
    videoUrl: '/videos/Thermal_1.mp4',
    modality: 'THERMAL',
    title: 'FLIR LWIR Heat Signature Sensor 1',
    location: 'Vizhinjam Deep Breakwater (Thermal)',
    uavCode: 'UAV-KL-01',
    missionCode: 'MSN-20261016-TH01',
    filterStyle: FILTER_PRESETS.THERMAL,
    badgeLabel: 'FLIR THERMAL',
    description: 'Long-wave infrared (LWIR) false-color heat signature detection',
  },
  {
    id: 'vid-thm-02',
    fileName: 'Thermal_2.mp4',
    videoUrl: '/videos/Thermal_2.mp4',
    modality: 'THERMAL',
    title: 'Marine Engine Thermal Plume Monitor',
    location: 'Kovalam Offshore Anchorage (Thermal)',
    uavCode: 'UAV-KL-03',
    missionCode: 'MSN-20261016-TH02',
    filterStyle: FILTER_PRESETS.THERMAL,
    badgeLabel: 'FLIR THERMAL',
    description: 'Vessel engine and wake thermal emissivity tracking',
  },
  {
    id: 'vid-thm-03',
    fileName: 'Thermal_3.mp4',
    videoUrl: '/videos/Thermal_3.mp4',
    modality: 'THERMAL',
    title: 'Coastal Infiltration Thermal Pod',
    location: 'Poovar Estuary Sandbar (Thermal)',
    uavCode: 'UAV-KL-05',
    missionCode: 'MSN-20261016-TH03',
    filterStyle: FILTER_PRESETS.THERMAL,
    badgeLabel: 'FLIR THERMAL',
    description: 'Human & craft heat detection in mangrove buffer',
  },
  {
    id: 'vid-thm-04',
    fileName: 'Thermal_4.mp4',
    videoUrl: '/videos/Thermal_4.mp4',
    modality: 'THERMAL',
    title: 'Harbor Basin High-Sensitivity FLIR',
    location: 'Kochi Naval Channel (Thermal)',
    uavCode: 'UAV-KL-02',
    missionCode: 'MSN-20261016-TH04',
    filterStyle: FILTER_PRESETS.THERMAL,
    badgeLabel: 'FLIR THERMAL',
    description: 'Sub-surface wash and vessel hull temperature differential',
  },

  // ─── Night Vision Feeds (5 Videos: With Night Vision Green Phosphor Filter) ───
  {
    id: 'vid-nv-01',
    fileName: 'Night_Vision.mp4',
    videoUrl: '/videos/Night_Vision.mp4',
    modality: 'NIGHT_VISION',
    title: 'Tactical Gen-3 Night Vision Gate 1',
    location: 'Vizhinjam Harbor Entrance (Night)',
    uavCode: 'UAV-KL-04',
    missionCode: 'MSN-20261016-NV01',
    filterStyle: FILTER_PRESETS.NIGHT_VISION,
    badgeLabel: 'NIGHT VISION',
    description: 'Military P-43 green phosphor light intensifier tube stream',
  },
  {
    id: 'vid-nv-02',
    fileName: 'Night_Vision_2.mp4',
    videoUrl: '/videos/Night_Vision_2.mp4',
    modality: 'NIGHT_VISION',
    title: 'Low-Light Coastal Starlight Sensor',
    location: 'Shanghumugham Dark Sector (Night)',
    uavCode: 'UAV-KL-06',
    missionCode: 'MSN-20261016-NV02',
    filterStyle: FILTER_PRESETS.NIGHT_VISION,
    badgeLabel: 'NIGHT VISION',
    description: 'High-gain starlight intensifier for unlit beaches',
  },
  {
    id: 'vid-nv-03',
    fileName: 'Night_Vision_3.mp4',
    videoUrl: '/videos/Night_Vision_3.mp4',
    modality: 'NIGHT_VISION',
    title: 'Offshore Anchorage NVG Recon',
    location: 'Neendakara Outer Anchorage (Night)',
    uavCode: 'UAV-KL-01',
    missionCode: 'MSN-20261016-NV03',
    filterStyle: FILTER_PRESETS.NIGHT_VISION,
    badgeLabel: 'NIGHT VISION',
    description: 'Night maritime transit and vessel boarding corridor',
  },
  {
    id: 'vid-nv-04',
    fileName: 'Night_Vision_4.mp4',
    videoUrl: '/videos/Night_Vision_4.mp4',
    modality: 'NIGHT_VISION',
    title: 'River Estuary Night Sweep',
    location: 'Beypore Estuary Navigation Gate (Night)',
    uavCode: 'UAV-KL-03',
    missionCode: 'MSN-20261016-NV04',
    filterStyle: FILTER_PRESETS.NIGHT_VISION,
    badgeLabel: 'NIGHT VISION',
    description: 'Dark-water vessel interceptor coordinate guidance',
  },
  {
    id: 'vid-nv-05',
    fileName: 'Night_Vision_5.mp4',
    videoUrl: '/videos/Night_Vision_5.mp4',
    modality: 'NIGHT_VISION',
    title: 'Horizon Security Night Patrol',
    location: 'Bekal Coastal Horizon (Night)',
    uavCode: 'UAV-KL-05',
    missionCode: 'MSN-20261016-NV05',
    filterStyle: FILTER_PRESETS.NIGHT_VISION,
    badgeLabel: 'NIGHT VISION',
    description: 'Extended night patrol and dark water search',
  },
];

// ─── Helpers ─────────────────────────────────────────────────

export function getVideoByIndex(index: number): CoastalVideo {
  return COASTAL_VIDEOS[Math.abs(index) % COASTAL_VIDEOS.length];
}

export function getVideoByFileName(fileName: string): CoastalVideo | undefined {
  const clean = fileName.trim().toLowerCase();
  return COASTAL_VIDEOS.find(v => v.fileName.toLowerCase() === clean);
}

export function getVideosByModality(modality: 'ALL' | Modality): CoastalVideo[] {
  if (modality === 'ALL') return COASTAL_VIDEOS;
  return COASTAL_VIDEOS.filter(v => v.modality === modality);
}

export function getFilterForModality(modality: Modality): CSSProperties {
  return FILTER_PRESETS[modality] ?? FILTER_PRESETS.RGB;
}

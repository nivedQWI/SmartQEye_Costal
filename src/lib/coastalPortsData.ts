// ============================================================
// SmartQEye Coastal — Kerala Sea Ports & Active Mission Drones
// Tactical Ports Grid & Real-time Mission Deployment Registry
// ============================================================

export interface SeaPort {
  id: string;
  name: string;
  shortName: string;
  district: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export const KERALA_SEAPORTS: SeaPort[] = [
  {
    id: 'ALL',
    name: 'All Kerala Coastal Ports (Statewide)',
    shortName: 'All Ports',
    district: 'Statewide Coastal Grid',
    center: [76.35, 10.25],
    zoom: 7.8,
  },
  {
    id: 'VIZHINJAM',
    name: 'Vizhinjam International Seaport',
    shortName: 'Vizhinjam Seaport',
    district: 'Thiruvananthapuram',
    center: [76.980, 8.382],
    zoom: 13.8,
  },
  {
    id: 'KOCHI',
    name: 'Cochin Port & Naval Base Channel',
    shortName: 'Kochi Port',
    district: 'Ernakulam',
    center: [76.230, 9.965],
    zoom: 13.8,
  },
  {
    id: 'ALAPPUZHA',
    name: 'Alappuzha Port & Coastal Pier',
    shortName: 'Alappuzha Port',
    district: 'Alappuzha',
    center: [76.320, 9.492],
    zoom: 13.8,
  },
  {
    id: 'BEYPORE',
    name: 'Beypore Deep Harbour Port',
    shortName: 'Beypore Port',
    district: 'Kozhikode',
    center: [75.802, 11.168],
    zoom: 13.8,
  },
  {
    id: 'AZHIKKAL',
    name: 'Azhikkal Port & Valapattanam Sector',
    shortName: 'Azhikkal Port',
    district: 'Kannur',
    center: [75.312, 11.935],
    zoom: 13.8,
  },
  {
    id: 'BEKAL',
    name: 'Bekal Coastal Port & Anchorage',
    shortName: 'Bekal Port',
    district: 'Kasaragod',
    center: [75.032, 12.392],
    zoom: 13.8,
  },
];

export interface ActiveDroneMission {
  feedId: string;
  droneId: string;
  missionId: string;
  missionTitle: string;
  locationName: string;
  operatorName: string;
  portId: string;
  lat: number;
  lon: number;
  headingDeg: number;
  altitudeM: number;
  batteryPct: number;
  groundSpeedKmh: number;
}

export const ACTIVE_MISSION_DRONES: ActiveDroneMission[] = [
  {
    feedId: 'f-03',
    droneId: 'UAV-03',
    missionId: 'M-2026-0415',
    missionTitle: 'Vizhinjam Seaport Security Patrol',
    locationName: 'Vizhinjam International Seaport, Thiruvananthapuram',
    operatorName: 'Inspector Rajan K. (KP-8842)',
    portId: 'VIZHINJAM',
    lat: 8.382,
    lon: 76.980,
    headingDeg: 195,
    altitudeM: 100,
    batteryPct: 63,
    groundSpeedKmh: 27,
  },
  {
    feedId: 'f-01',
    droneId: 'UAV-01',
    missionId: 'M-2026-0416',
    missionTitle: 'Kochi Port & Naval Base Surveillance',
    locationName: 'Kochi Port & Naval Base Sector, Ernakulam',
    operatorName: 'Sub-Inspector Manoj Kumar (KP-7119)',
    portId: 'KOCHI',
    lat: 9.965,
    lon: 76.230,
    headingDeg: 45,
    altitudeM: 120,
    batteryPct: 78,
    groundSpeedKmh: 33,
  },
  {
    feedId: 'f-05',
    droneId: 'UAV-05',
    missionId: 'M-2026-0417',
    missionTitle: 'Alappuzha Coastal Infiltration Watch',
    locationName: 'Alappuzha Beach & Pier Sector, Alappuzha',
    operatorName: 'Sub-Inspector Priya Nair (KP-9021)',
    portId: 'ALAPPUZHA',
    lat: 9.492,
    lon: 76.320,
    headingDeg: 320,
    altitudeM: 85,
    batteryPct: 84,
    groundSpeedKmh: 24,
  },
  {
    feedId: 'f-11',
    droneId: 'UAV-02',
    missionId: 'M-2026-0414',
    missionTitle: 'Beypore Maritime & Harbour Patrol',
    locationName: 'Beypore Deep Harbour Sector, Kozhikode',
    operatorName: 'Inspector Sudheesh P. (KP-6540)',
    portId: 'BEYPORE',
    lat: 11.168,
    lon: 75.802,
    headingDeg: 180,
    altitudeM: 105,
    batteryPct: 75,
    groundSpeedKmh: 30,
  },
  {
    feedId: 'f-07',
    droneId: 'UAV-04',
    missionId: 'M-2026-0418',
    missionTitle: 'Kannur Azhikkal Estuary Monitoring',
    locationName: 'Azhikkal Port Sector, Kannur',
    operatorName: 'Sub-Inspector Biju V. (KP-8104)',
    portId: 'AZHIKKAL',
    lat: 11.935,
    lon: 75.312,
    headingDeg: 110,
    altitudeM: 95,
    batteryPct: 69,
    groundSpeedKmh: 29,
  },
  {
    feedId: 'f-09',
    droneId: 'UAV-06',
    missionId: 'M-2026-0419',
    missionTitle: 'Bekal Coastal High-Security Sector',
    locationName: 'Bekal Fort Coastal Sector, Kasaragod',
    operatorName: 'Sub-Inspector Anish George (KP-9432)',
    portId: 'BEKAL',
    lat: 12.392,
    lon: 75.032,
    headingDeg: 270,
    altitudeM: 110,
    batteryPct: 82,
    groundSpeedKmh: 26,
  },
];

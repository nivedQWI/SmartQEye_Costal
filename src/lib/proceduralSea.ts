// ============================================================
// SmartQEye Coastal — Procedural Drone Surveillance Canvas Engine
// High-fidelity top-down aerial maritime renderer with animated waves,
// Vizhinjam breakwater jetty, beaches, craft kinematics, and thermal ironbow
// ============================================================

import type { BoundingBox, CfsState } from '@/types/sidecar';
import type { Modality } from '@/types';

interface SimulatedEntity {
  id: string;
  contactId: string;
  class: BoundingBox['class'];
  label: string;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  speed: number; // normalised speed per second
  headingDeg: number;
  pathType: 'APPROACH_JETTY' | 'OFFSHORE_TRANSIT' | 'BEACH_CRUISE' | 'PURSUIT' | 'LOITER' | 'ROAD_VEHICLE' | 'BEACH_PERSON';
  color: string;
}

const ENTITIES: SimulatedEntity[] = [
  // C-1042: Primary Contact of Interest (High-speed approach to restricted jetty)
  {
    id: 'trk-1',
    contactId: 'C-1042',
    class: 'SMALL_CRAFT',
    label: 'Small Craft',
    baseX: 0.15,
    baseY: 0.70,
    width: 0.045,
    height: 0.025,
    speed: 0.008,
    headingDeg: 42,
    pathType: 'APPROACH_JETTY',
    color: '#0ea5e9',
  },
  // C-1038: Mechanised Trawler
  {
    id: 'trk-2',
    contactId: 'C-1038',
    class: 'MECHANISED_TRAWLER',
    label: 'Mechanised Trawler',
    baseX: 0.25,
    baseY: 0.22,
    width: 0.075,
    height: 0.035,
    speed: 0.003,
    headingDeg: 195,
    pathType: 'OFFSHORE_TRANSIT',
    color: '#38bdf8',
  },
  // C-1031: Motorised Country Craft near shore
  {
    id: 'trk-3',
    contactId: 'C-1031',
    class: 'MOTORISED_COUNTRY_CRAFT',
    label: 'Motorised Country Craft',
    baseX: 0.62,
    baseY: 0.45,
    width: 0.05,
    height: 0.02,
    speed: 0.004,
    headingDeg: 340,
    pathType: 'BEACH_CRUISE',
    color: '#06b6d4',
  },
  // C-1050: Patrol Interceptor
  {
    id: 'trk-4',
    contactId: 'C-1050',
    class: 'SMALL_CRAFT',
    label: 'Patrol Interceptor',
    baseX: 0.10,
    baseY: 0.85,
    width: 0.05,
    height: 0.024,
    speed: 0.009,
    headingDeg: 38,
    pathType: 'PURSUIT',
    color: '#10b981',
  },
  // C-1055: Traditional Wooden Craft
  {
    id: 'trk-5',
    contactId: 'C-1055',
    class: 'TRADITIONAL_WOODEN_CRAFT',
    label: 'Traditional Wooden Craft',
    baseX: 0.45,
    baseY: 0.35,
    width: 0.042,
    height: 0.018,
    speed: 0.001,
    headingDeg: 120,
    pathType: 'LOITER',
    color: '#67e8f9',
  },
  // C-1060: Canoe / Catamaran
  {
    id: 'trk-6',
    contactId: 'C-1060',
    class: 'CANOE_CATAMARAN',
    label: 'Canoe / Catamaran',
    baseX: 0.68,
    baseY: 0.60,
    width: 0.035,
    height: 0.015,
    speed: 0.002,
    headingDeg: 280,
    pathType: 'BEACH_CRUISE',
    color: '#2dd4bf',
  },
  // Vehicles on coastal road
  {
    id: 'trk-veh-1',
    contactId: 'V-201',
    class: 'VEHICLE',
    label: 'Patrol SUV',
    baseX: 0.88,
    baseY: 0.20,
    width: 0.025,
    height: 0.016,
    speed: 0.012,
    headingDeg: 180,
    pathType: 'ROAD_VEHICLE',
    color: '#f59e0b',
  },
  {
    id: 'trk-veh-2',
    contactId: 'V-202',
    class: 'VEHICLE',
    label: 'Light Commercial Truck',
    baseX: 0.88,
    baseY: 0.65,
    width: 0.03,
    height: 0.018,
    speed: 0.010,
    headingDeg: 0,
    pathType: 'ROAD_VEHICLE',
    color: '#f59e0b',
  },
  // People on Kovalam Beach
  {
    id: 'trk-per-1',
    contactId: 'P-101',
    class: 'PERSON',
    label: 'Person Cluster',
    baseX: 0.76,
    baseY: 0.38,
    width: 0.018,
    height: 0.018,
    speed: 0.0008,
    headingDeg: 90,
    pathType: 'BEACH_PERSON',
    color: '#ec4899',
  },
  {
    id: 'trk-per-2',
    contactId: 'P-102',
    class: 'PERSON',
    label: 'Person',
    baseX: 0.78,
    baseY: 0.48,
    width: 0.012,
    height: 0.012,
    speed: 0.0005,
    headingDeg: 220,
    pathType: 'BEACH_PERSON',
    color: '#ec4899',
  },
];

/**
 * Calculates normalised positions for entities at given timeSec.
 */
export function getSimulatedPositions(timeSec: number): Array<{
  entity: SimulatedEntity;
  normX: number;
  normY: number;
  headingDeg: number;
  speedKnots: number;
  trail: Array<[number, number]>;
  inZoneBreach: boolean;
}> {
  return ENTITIES.map(ent => {
    let normX = ent.baseX;
    let normY = ent.baseY;
    let headingDeg = ent.headingDeg;
    let speedKnots = 4.0;
    const trail: Array<[number, number]> = [];

    if (ent.pathType === 'APPROACH_JETTY') {
      // Moves diagonally towards Vizhinjam breakwater (x: 0.42, y: 0.32)
      const t = (timeSec % 90) / 90;
      normX = ent.baseX + t * 0.28;
      normY = ent.baseY - t * 0.38;
      headingDeg = 38;
      speedKnots = 18.5; // Fast approach
    } else if (ent.pathType === 'OFFSHORE_TRANSIT') {
      // Moves southward along shipping channel
      const t = (timeSec % 120) / 120;
      normX = ent.baseX + Math.sin(t * Math.PI) * 0.05;
      normY = (ent.baseY + t * 0.7) % 0.9;
      headingDeg = 190;
      speedKnots = 7.5;
    } else if (ent.pathType === 'PURSUIT') {
      // Trails behind C-1042
      const t = (Math.max(0, timeSec - 4) % 90) / 90;
      normX = ent.baseX + t * 0.28;
      normY = ent.baseY - t * 0.38;
      headingDeg = 38;
      speedKnots = 22.0;
    } else if (ent.pathType === 'BEACH_CRUISE') {
      // Meanders along coastal shallows
      normX = ent.baseX + Math.sin(timeSec * 0.08) * 0.04;
      normY = ent.baseY + Math.cos(timeSec * 0.06) * 0.06;
      headingDeg = Math.round((Math.atan2(Math.cos(timeSec * 0.06), Math.sin(timeSec * 0.08)) * 180) / Math.PI + 360) % 360;
      speedKnots = 3.2;
    } else if (ent.pathType === 'LOITER') {
      // Circular loitering drift
      const r = 0.025;
      normX = ent.baseX + Math.cos(timeSec * 0.1) * r;
      normY = ent.baseY + Math.sin(timeSec * 0.1) * r;
      headingDeg = Math.round((timeSec * 15 + 90) % 360);
      speedKnots = 1.2;
    } else if (ent.pathType === 'ROAD_VEHICLE') {
      // Straight road traversal
      const t = (timeSec % 40) / 40;
      normX = ent.baseX;
      normY = ent.headingDeg === 180 ? (0.1 + t * 0.8) : (0.9 - t * 0.8);
      speedKnots = 28.0;
    } else if (ent.pathType === 'BEACH_PERSON') {
      // Slow beach walk
      normX = ent.baseX + Math.sin(timeSec * 0.05) * 0.015;
      normY = ent.baseY + Math.cos(timeSec * 0.05) * 0.02;
      speedKnots = 1.8;
    }

    // Build historical motion trail
    for (let k = 1; k <= 5; k++) {
      const pastT = Math.max(0, timeSec - k * 1.5);
      const pastProgress = (pastT % 90) / 90;
      if (ent.pathType === 'APPROACH_JETTY') {
        trail.push([ent.baseX + pastProgress * 0.28, ent.baseY - pastProgress * 0.38]);
      } else {
        trail.push([normX - (k * 0.003 * Math.cos((headingDeg * Math.PI) / 180)), normY - (k * 0.003 * Math.sin((headingDeg * Math.PI) / 180))]);
      }
    }

    // Zone breach evaluation (Z-07 military approach is between x: 0.35-0.55, y: 0.20-0.45)
    const inZoneBreach = normX >= 0.35 && normX <= 0.55 && normY >= 0.20 && normY <= 0.45 && ent.contactId === 'C-1042';

    return {
      entity: ent,
      normX,
      normY,
      headingDeg,
      speedKnots,
      trail,
      inZoneBreach,
    };
  });
}

/**
 * Extracts BoundingBox[] from simulated entities at timeSec.
 */
export function getSimulatedBoxes(timeSec: number, modality: Modality = 'RGB'): BoundingBox[] {
  const positions = getSimulatedPositions(timeSec);

  return positions.map(({ entity, normX, normY, headingDeg, speedKnots, trail, inZoneBreach }) => {
    const hw = entity.width / 2;
    const hh = entity.height / 2;

    const x1 = Math.max(0.01, normX - hw);
    const y1 = Math.max(0.01, normY - hh);
    const x2 = Math.min(0.99, normX + hw);
    const y2 = Math.min(0.99, normY + hh);

    return {
      id: entity.id,
      trackId: entity.id.replace('trk-', ''),
      contactId: entity.contactId,
      class: entity.class,
      label: entity.label,
      conf: inZoneBreach ? 0.94 : 0.88,
      bbox: [x1, y1, x2, y2],
      headingDeg,
      speedKnots,
      modality,
      trail,
      inZoneBreach,
      zoneCode: inZoneBreach ? 'Z-07' : undefined,
    };
  });
}

/**
 * Returns CFS (Cognitive Frame Selection) state for current frame.
 */
export function getSimulatedCfsState(timeSec: number): CfsState {
  const positions = getSimulatedPositions(timeSec);
  const hasBreach = positions.some(p => p.inZoneBreach);

  if (hasBreach) {
    return {
      status: 'FULL',
      rateFps: 25,
      reasonCode: 'CFS-01: Restricted Zone Z-07 Boundary Breached',
      vramSavingsPct: 0,
    };
  }

  // If C-1042 is within attention range
  const c1042 = positions.find(p => p.entity.contactId === 'C-1042');
  if (c1042 && c1042.normX > 0.25) {
    return {
      status: 'FULL',
      rateFps: 25,
      reasonCode: 'CFS-02: High-Speed Marine Approach Detected (18.5 kn)',
      vramSavingsPct: 0,
    };
  }

  // Quiescent background patrol
  return {
    status: 'LIGHT',
    rateFps: 12,
    reasonCode: 'CFS-04: Quiescent Coastal Waters (Frame-skip 50%)',
    vramSavingsPct: 52,
  };
}

/**
 * Renders the procedural top-down aerial drone surveillance video frame.
 */
export function renderProceduralSea(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  modality: Modality = 'RGB'
) {
  const isThermal = modality === 'THERMAL';

  // 1. Water Background
  if (!isThermal) {
    const seaGradient = ctx.createLinearGradient(0, 0, width, height);
    seaGradient.addColorStop(0, '#041624');
    seaGradient.addColorStop(0.5, '#07243a');
    seaGradient.addColorStop(1, '#0a324e');
    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, 0, width, height);

    // Animated directional wave ripples
    ctx.save();
    ctx.strokeStyle = 'rgba(111, 183, 214, 0.12)';
    ctx.lineWidth = 1.2;
    const waveCount = 14;
    for (let i = 0; i < waveCount; i++) {
      const waveY = ((i / waveCount) * height + (timeSec * 12)) % height;
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x < width; x += 30) {
        const offset = Math.sin((x * 0.02) + (timeSec * 2) + i) * 5;
        ctx.lineTo(x, waveY + offset);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Thermal background (Deep oceanic indigo / black)
    ctx.fillStyle = '#060314';
    ctx.fillRect(0, 0, width, height);

    // Thermal water ambient temperature gradient
    const thermGradient = ctx.createLinearGradient(0, 0, width, height);
    thermGradient.addColorStop(0, 'rgba(16, 7, 44, 0.9)');
    thermGradient.addColorStop(1, 'rgba(28, 12, 60, 0.8)');
    ctx.fillStyle = thermGradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Coastal Shoreline & Sandy Beach (Right Sector)
  const beachStartX = width * 0.74;
  if (!isThermal) {
    // Wet sand splash zone
    ctx.fillStyle = '#6b5c3b';
    ctx.fillRect(beachStartX - 15, 0, 20, height);

    // Sand dune & beach strip
    const sandGradient = ctx.createLinearGradient(beachStartX, 0, width, 0);
    sandGradient.addColorStop(0, '#d1b88a');
    sandGradient.addColorStop(0.6, '#e8cca0');
    sandGradient.addColorStop(1, '#78866b'); // Vegetation fringe
    ctx.fillStyle = sandGradient;
    ctx.fillRect(beachStartX, 0, width - beachStartX, height);

    // Coastal road strip
    ctx.fillStyle = '#2b3038';
    ctx.fillRect(width * 0.86, 0, width * 0.04, height);

    // White road markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(width * 0.88, 0);
    ctx.lineTo(width * 0.88, height);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Thermal Sand (Ambient cool violet-magenta)
    ctx.fillStyle = '#2d1445';
    ctx.fillRect(beachStartX, 0, width - beachStartX, height);
    ctx.fillStyle = '#1f0d32';
    ctx.fillRect(width * 0.86, 0, width * 0.04, height);
  }

  // 3. Vizhinjam Breakwater & Concrete Jetty
  const jettyX = width * 0.42;
  const jettyY = height * 0.28;
  const jettyW = width * 0.035;
  const jettyH = height * 0.42;

  ctx.save();
  if (!isThermal) {
    // Concrete shadow & structure
    ctx.fillStyle = '#334155';
    ctx.fillRect(jettyX, jettyY, jettyW, jettyH);
    ctx.fillStyle = '#475569';
    ctx.fillRect(jettyX + 3, jettyY + 3, jettyW - 6, jettyH - 6);

    // Tetrapod breakwater clusters
    ctx.fillStyle = '#1e293b';
    for (let j = 0; j < jettyH; j += 18) {
      ctx.beginPath();
      ctx.arc(jettyX - 4, jettyY + j, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lighthouse / Navigation beacon at pierhead
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(jettyX + (jettyW / 2), jettyY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = (Math.floor(timeSec * 2) % 2 === 0) ? '#fef08a' : '#ef4444';
    ctx.beginPath();
    ctx.arc(jettyX + (jettyW / 2), jettyY, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Thermal Jetty (Cool concrete structure with warm electrical beacon)
    ctx.fillStyle = '#3a1a54';
    ctx.fillRect(jettyX, jettyY, jettyW, jettyH);

    // Hot beacon head (Bright White-Yellow in Ironbow)
    ctx.fillStyle = '#fffc00';
    ctx.beginPath();
    ctx.arc(jettyX + (jettyW / 2), jettyY, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Render Marine Craft & Entities
  const positions = getSimulatedPositions(timeSec);

  positions.forEach(({ entity, normX, normY, headingDeg, speedKnots }) => {
    const cx = normX * width;
    const cy = normY * height;
    const ew = entity.width * width;
    const eh = entity.height * height;
    const rad = (headingDeg * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);

    // Boat Wake Foam
    if (entity.class !== 'PERSON' && entity.class !== 'VEHICLE' && speedKnots > 2) {
      ctx.save();
      const wakeLength = Math.min(80, speedKnots * 3.5);
      if (!isThermal) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      } else {
        ctx.fillStyle = 'rgba(255, 120, 0, 0.25)'; // Thermal wake agitation
      }
      ctx.beginPath();
      ctx.moveTo(-ew * 0.4, 0);
      ctx.lineTo(-ew * 0.4 - wakeLength, -eh * 0.8);
      ctx.lineTo(-ew * 0.4 - wakeLength * 0.7, 0);
      ctx.lineTo(-ew * 0.4 - wakeLength, eh * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Hull Drawing
    if (entity.class === 'PERSON') {
      // Person dot
      if (!isThermal) {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Human Body Heat (Hot Yellow-Orange in Ironbow)
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (entity.class === 'VEHICLE') {
      // Vehicle Box
      if (!isThermal) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-ew / 2, -eh / 2, ew, eh);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-ew * 0.2, -eh * 0.35, ew * 0.4, eh * 0.7);
      } else {
        // Vehicle Engine Block Heat
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-ew / 2, -eh / 2, ew, eh);
        ctx.fillStyle = '#ffffff'; // Hot front radiator
        ctx.fillRect(ew * 0.2, -eh * 0.3, ew * 0.2, eh * 0.6);
      }
    } else {
      // Marine Vessel Pointed Hull
      if (!isThermal) {
        ctx.fillStyle = entity.color;
        ctx.beginPath();
        ctx.moveTo(ew * 0.5, 0);
        ctx.lineTo(-ew * 0.45, -eh * 0.45);
        ctx.lineTo(-ew * 0.45, eh * 0.45);
        ctx.closePath();
        ctx.fill();

        // Cabin / Deckhouse
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(-ew * 0.2, -eh * 0.25, ew * 0.3, eh * 0.5);
      } else {
        // Thermal Vessel (Ironbow palette: Hull is warm copper, engine is radiant white-yellow)
        ctx.fillStyle = '#990066';
        ctx.beginPath();
        ctx.moveTo(ew * 0.5, 0);
        ctx.lineTo(-ew * 0.45, -eh * 0.45);
        ctx.lineTo(-ew * 0.45, eh * 0.45);
        ctx.closePath();
        ctx.fill();

        // Hot Outboard / Inboard Marine Diesel Engine
        ctx.fillStyle = '#fffc00';
        ctx.fillRect(-ew * 0.42, -eh * 0.2, ew * 0.2, eh * 0.4);
      }
    }

    ctx.restore();
  });

  // 5. Zone Perimeter Overlay (Z-07 Vizhinjam Military Approach)
  const zx1 = width * 0.35;
  const zy1 = height * 0.20;
  const zw = width * 0.20;
  const zh = height * 0.25;

  const positionsBreaching = positions.some(p => p.inZoneBreach);

  ctx.save();
  ctx.strokeStyle = positionsBreaching
    ? (Math.floor(timeSec * 4) % 2 === 0 ? '#ef4444' : '#f87171')
    : 'rgba(239, 68, 68, 0.5)';
  ctx.lineWidth = positionsBreaching ? 2.5 : 1.5;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(zx1, zy1, zw, zh);

  // Zone Label
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = positionsBreaching ? '#ef4444' : 'rgba(239, 68, 68, 0.8)';
  ctx.fillText('Z-07 RESTRICTED MILITARY APPROACH', zx1 + 6, zy1 + 14);
  if (positionsBreaching) {
    ctx.fillStyle = '#ef4444';
    ctx.fillText('! BREACH DETECTED: C-1042', zx1 + 6, zy1 + 28);
  }
  ctx.restore();
}

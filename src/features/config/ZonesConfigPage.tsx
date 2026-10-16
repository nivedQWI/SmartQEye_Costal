// ============================================================
// SmartQEye Coastal — Zones & Context Profiles (RFP §7)
// Zone polygon definition, operational sensitivity, and temporal schedules
// ============================================================

import { useState } from 'react';
import { Sliders, Shield, MapPin, Clock, Plus, Edit, Check, Bell } from 'lucide-react';
import { ZONE_PROFILES } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import type { ZoneProfile, ZoneType, Severity } from '@/types';

interface CoastalZone {
  code: string;
  name: string;
  zoneType: ZoneType;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  dwellThresholdSec: number;
  schedule: string;
  activeSeverity: Severity;
  notifyChannels: string[];
  isActive: boolean;
}

export default function ZonesConfigPage() {
  const [zones, setZones] = useState<CoastalZone[]>([
    {
      code: 'Z-01',
      name: 'Vizhinjam Restricted Jetty & Fuel Berth',
      zoneType: 'RESTRICTED',
      sensitivity: 'VERY_HIGH',
      dwellThresholdSec: 30,
      schedule: 'Always (24×7)',
      activeSeverity: 'CRITICAL',
      notifyChannels: ['Coastal Police Control Room', 'Harbour Security Officer', 'Indian Coast Guard'],
      isActive: true,
    },
    {
      code: 'Z-02',
      name: 'Vizhinjam Outer Harbour Anchorage',
      zoneType: 'HARBOUR',
      sensitivity: 'HIGH',
      dwellThresholdSec: 120,
      schedule: 'Always (24×7)',
      activeSeverity: 'HIGH',
      notifyChannels: ['Vizhinjam Coastal PS', 'Control Room'],
      isActive: true,
    },
    {
      code: 'Z-03',
      name: 'Kovalam Beach North — High Tourist Zone',
      zoneType: 'TOURISM',
      sensitivity: 'MEDIUM',
      dwellThresholdSec: 300,
      schedule: '16:00 - 22:00 IST',
      activeSeverity: 'MEDIUM',
      notifyChannels: ['Tourism Police Wing', 'Kovalam PS'],
      isActive: true,
    },
    {
      code: 'Z-04',
      name: 'Lighthouse Beach Recreational Sector',
      zoneType: 'TOURISM',
      sensitivity: 'MEDIUM',
      dwellThresholdSec: 300,
      schedule: '06:00 - 23:00 IST',
      activeSeverity: 'MEDIUM',
      notifyChannels: ['Tourism Police Wing'],
      isActive: true,
    },
    {
      code: 'Z-05',
      name: 'Poovar Estuary Sandbar & Eco Belt',
      zoneType: 'ESTUARY',
      sensitivity: 'HIGH',
      dwellThresholdSec: 180,
      schedule: 'Always (24×7)',
      activeSeverity: 'HIGH',
      notifyChannels: ['Poovar Police Post', 'Coastal Patrol SI'],
      isActive: true,
    },
    {
      code: 'Z-06',
      name: 'Shanghumugham Beach Approach',
      zoneType: 'BEACH',
      sensitivity: 'LOW',
      dwellThresholdSec: 600,
      schedule: 'Daytime (06:00 - 18:00)',
      activeSeverity: 'LOW',
      notifyChannels: ['Shanghumugham Police Post'],
      isActive: true,
    },
    {
      code: 'Z-07',
      name: 'Restricted – Vizhinjam Military & Naval Approach',
      zoneType: 'RESTRICTED',
      sensitivity: 'VERY_HIGH',
      dwellThresholdSec: 15,
      schedule: 'Always (24×7)',
      activeSeverity: 'CRITICAL',
      notifyChannels: ['State Police Special Branch', 'Coastal Police HQ', 'Naval Liaison'],
      isActive: true,
    },
  ]);

  const toggleZone = (code: string) => {
    setZones(prev => prev.map(z => z.code === code ? { ...z, isActive: !z.isActive } : z));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Zones &amp; Context Profiles</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                RFP §7 COMPLIANT
              </span>
            </div>
            <p className="text-xs opacity-60">
              Kerala coastal perimeter definitions, sensitivity ratings, and temporal alert rules
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('New coastal zone polygon creation is available through GIS Map editor.')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Define New Zone
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {zones.map(z => (
            <div
              key={z.code}
              className={cn(
                'rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4',
                z.isActive ? 'border-[var(--line)] bg-[var(--panel)]' : 'border-dashed opacity-50 bg-[var(--surface)]'
              )}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{z.code}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                      z.sensitivity === 'VERY_HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                      z.sensitivity === 'HIGH' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                    )}
                  >
                    {z.sensitivity} SENSITIVITY
                  </span>
                  <span className="text-[10px] font-mono opacity-50">· {z.zoneType}</span>
                </div>

                <h3 className="font-serif text-base font-bold">{z.name}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono opacity-70">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dwell Thresh: <strong className="text-[var(--text)]">{z.dwellThresholdSec}s</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Schedule: <strong className="text-[var(--text)]">{z.schedule}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Alert: <strong className="text-red-500">{z.activeSeverity}</strong></span>
                  </div>
                </div>

                {/* Notify list */}
                <div className="text-[11px] font-mono opacity-60">
                  Dispatch List: {z.notifyChannels.join(' · ')}
                </div>
              </div>

              {/* Status Toggle & Edit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleZone(z.code)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors',
                    z.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                  )}
                >
                  {z.isActive ? 'ACTIVE ENFORCEMENT' : 'PAUSED'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Abandoned Objects Module
// Shoreline unattended baggage, jettisoned cargo, and stationary object monitoring
// ============================================================

import { useState } from 'react';
import {
  PackageSearch, Clock, MapPin, AlertTriangle, Shield,
  CheckCircle2, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { TacticalActionDialog, type TacticalActionType } from '@/components/TacticalActionDialog';
import { cn } from '@/lib/utils';

interface AbandonedItem {
  id: string;
  itemCode: string;
  label: string;
  locationName: string;
  lat: number;
  lon: number;
  dwellMinutes: number;
  dwellThresholdMinutes: number;
  confidence: number;
  thermalSignature: 'COLD_MASS' | 'ELEVATED_HEAT' | 'AMBIENT';
  modality: 'RGB' | 'THERMAL' | 'BOTH';
  lastSeenAgo: string;
  uavCode: string;
  status: 'INVESTIGATING' | 'UNATTENDED' | 'RESOLVED';
}

export default function AbandonedObjectsPage() {
  const [tacticalAction, setTacticalAction] = useState<TacticalActionType | null>(null);
  const [selectedItem, setSelectedItem] = useState<AbandonedItem | null>(null);

  const items: AbandonedItem[] = [
    {
      id: 'ab-01',
      itemCode: 'ABO-20261016-01',
      label: 'Unattended Heavy Crate / Waterproof Canister',
      locationName: 'Shanghumugham Shoreline (Rocks)',
      lat: 8.4842,
      lon: 76.9214,
      dwellMinutes: 48,
      dwellThresholdMinutes: 15,
      confidence: 0.92,
      thermalSignature: 'COLD_MASS',
      modality: 'BOTH',
      lastSeenAgo: '2m ago',
      uavCode: 'UAV-KL-04',
      status: 'UNATTENDED',
    },
    {
      id: 'ab-02',
      itemCode: 'ABO-20261016-02',
      label: 'Unattended Luggage / Nylon Sack Cluster',
      locationName: 'Kovalam Lighthouse Beach (South)',
      lat: 8.3971,
      lon: 76.9925,
      dwellMinutes: 26,
      dwellThresholdMinutes: 20,
      confidence: 0.87,
      thermalSignature: 'AMBIENT',
      modality: 'RGB',
      lastSeenAgo: '4m ago',
      uavCode: 'UAV-KL-02',
      status: 'INVESTIGATING',
    },
    {
      id: 'ab-03',
      itemCode: 'ABO-20261016-03',
      label: 'Jettisoned Fuel Drum / Container',
      locationName: 'Vizhinjam Outer Breakwater',
      lat: 8.3735,
      lon: 76.9748,
      dwellMinutes: 72,
      dwellThresholdMinutes: 30,
      confidence: 0.94,
      thermalSignature: 'ELEVATED_HEAT',
      modality: 'THERMAL',
      lastSeenAgo: '1m ago',
      uavCode: 'UAV-KL-01',
      status: 'UNATTENDED',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Abandoned &amp; Stationary Objects</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                TEMPORAL DWELL MONITORING
              </span>
            </div>
            <p className="text-xs opacity-60">
              Automated detection of unattended shoreline baggage, jettisoned cargo, and stationary beach anomalies
            </p>
          </div>
        </div>

        <div className="text-xs font-mono opacity-70 px-3 py-1.5 rounded-lg border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
          Active Anomalies: <span className="font-bold text-amber-600">{items.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{item.itemCode}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                      item.status === 'UNATTENDED'
                        ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    )}
                  >
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-sm font-bold leading-tight">{item.label}</h3>
                  <div className="text-xs opacity-60 flex items-center gap-1 mt-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.locationName}</span>
                  </div>
                </div>

                {/* Dwell bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="opacity-60">Dwell Duration:</span>
                    <span className="font-bold text-red-600">{item.dwellMinutes} min (Thresh: {item.dwellThresholdMinutes}m)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(100, (item.dwellMinutes / item.dwellThresholdMinutes) * 50)}%` }}
                    />
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <span className="opacity-50 block">DETECTOR CONF</span>
                    <span className="font-semibold">{Math.round(item.confidence * 100)}% (RTMDet)</span>
                  </div>
                  <div>
                    <span className="opacity-50 block">THERMAL SIG</span>
                    <span className="font-semibold">{item.thermalSignature}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block">SENSOR MODALITY</span>
                    <span className="font-semibold">{item.modality}</span>
                  </div>
                  <div>
                    <span className="opacity-50 block">UAV SENTRY</span>
                    <span className="font-semibold">{item.uavCode}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setTacticalAction('NOTIFY_DUTY_OFFICER');
                  }}
                  className="flex-1 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors text-center"
                  style={{ borderColor: 'var(--line)' }}
                >
                  Notify duty officer
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setTacticalAction('RECOMMEND_PATROL_RESPONSE');
                  }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors text-center shadow-xs"
                >
                  Recommend patrol response
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Human in the loop footer */}
        <HumanInterpretationNote />
      </div>

      {/* Confirmation Dialog */}
      <TacticalActionDialog
        actionType={tacticalAction}
        targetId={selectedItem?.itemCode ?? 'ABO'}
        targetType="ALERT"
        onClose={() => {
          setTacticalAction(null);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}

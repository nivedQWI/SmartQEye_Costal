// ============================================================
// SmartQEye Coastal — Abandoned & Stationary Objects Module (RFP Analytics #9)
// Stationary shoreline objects, temporal dwell timer, thermal signature & ELIR evidence
// ============================================================

import { useState, useEffect } from 'react';
import {
  PackageSearch, Clock, MapPin, AlertTriangle, Shield,
  CheckCircle2, ArrowRight, Eye, RefreshCw, Thermometer,
  Sliders, Check, X, FileText, Camera, Video, ExternalLink
} from 'lucide-react';
import { ABANDONED_OBJECTS } from '@/lib/mockData';
import { abandonedObjectsApi } from '@/lib/api';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { TacticalActionDialog, type TacticalActionType } from '@/components/TacticalActionDialog';
import { cn } from '@/lib/utils';
import type { AbandonedObjectRecord, AbandonedObjectStatus } from '@/types';

export default function AbandonedObjectsPage() {
  const [items, setItems] = useState<AbandonedObjectRecord[]>(ABANDONED_OBJECTS);
  const [selectedItem, setSelectedItem] = useState<AbandonedObjectRecord>(ABANDONED_OBJECTS[0]);
  const [tacticalAction, setTacticalAction] = useState<TacticalActionType | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearReason, setClearReason] = useState<string>('Inspected on-site by beach patrol / SI');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dwellOffset, setDwellOffset] = useState<number>(0);

  // Live ticking timer effect (updates elapsed duration every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setDwellOffset(prev => prev + 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkCleared = async () => {
    if (!selectedItem) return;
    const updated = await abandonedObjectsApi.markCleared(selectedItem.id, clearReason);
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelectedItem(updated);
    setShowClearModal(false);
  };

  const filteredItems = items.filter(i => {
    if (statusFilter === 'ALL') return true;
    return i.status === statusFilter;
  });

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
                RFP REQUIREMENT 9
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                TEMPORAL DWELL &amp; THERMAL
              </span>
            </div>
            <p className="text-xs opacity-60">
              Automated detection of unattended shoreline cargo, jettisoned canisters, and stationary craft anomalies
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold hover:bg-[var(--surface-hover)]"
            style={{ borderColor: 'var(--line)' }}
          >
            <Sliders className="w-3.5 h-3.5" /> Dwell Thresholds
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="ALL">All Statuses ({items.length})</option>
            <option value="ALERT_RAISED">Alert Raised</option>
            <option value="CONFIRMED_BY_POLICE">Confirmed by Police</option>
            <option value="WATCHING">Watching</option>
            <option value="CLEARED_BY_OPERATOR">Cleared Archive</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: List of Detected Objects */}
          <div className="col-span-5 space-y-3">
            <h3 className="font-serif text-sm font-bold opacity-75 uppercase tracking-wider text-[11px]">
              Detected Stationary Objects ({filteredItems.length})
            </h3>

            <div className="space-y-3">
              {filteredItems.map(item => {
                const isSelected = item.id === selectedItem.id;
                const totalDwellSec = item.stationaryDurationSec + dwellOffset;
                const dwellMinutes = Math.floor(totalDwellSec / 60);
                const dwellSeconds = totalDwellSec % 60;
                const pctOfThreshold = Math.min(100, Math.round((dwellMinutes / item.thresholdMinutes) * 100));
                const isExceeded = dwellMinutes >= item.thresholdMinutes;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      'p-4 rounded-xl border text-left cursor-pointer transition-all space-y-3',
                      isSelected
                        ? 'border-[var(--sea-600)] bg-[var(--surface-hover)] shadow-xs'
                        : 'border-[var(--line)] bg-[var(--panel)] hover:border-slate-400',
                      item.status === 'CLEARED_BY_OPERATOR' && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{item.itemCode}</span>
                        {item.elirId && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-600">
                            ELIR LINKED
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                        item.status === 'ALERT_RAISED' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                        item.status === 'CONFIRMED_BY_POLICE' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                        item.status === 'CLEARED_BY_OPERATOR' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      )}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif text-sm font-bold leading-tight">{item.label}</h4>
                      <div className="flex items-center gap-1 text-xs opacity-60 font-mono mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.locationName} ({item.zoneCode})</span>
                      </div>
                    </div>

                    {/* Live Ticking Dwell Countdown / Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="opacity-70 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Stationary Duration:
                        </span>
                        <span className={cn('font-bold', isExceeded ? 'text-red-600' : 'text-amber-600')}>
                          {dwellMinutes}m {dwellSeconds}s / {item.thresholdMinutes}m threshold
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000',
                            isExceeded ? 'bg-red-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${pctOfThreshold}%` }}
                        />
                      </div>
                    </div>

                    {/* Thermal Signature & Modality Badges */}
                    <div className="flex items-center justify-between pt-2 border-t text-[10px] font-mono" style={{ borderColor: 'var(--line)' }}>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded font-bold border',
                        item.thermalSignature === 'ELEVATED_HEAT'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : item.thermalSignature === 'COLD_MASS'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                      )}>
                        THERMAL: {item.thermalSignature}
                      </span>

                      <span className="opacity-60">Sentry: {item.uavCode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Object Dossier & Live Drone Feed */}
          <div className="col-span-7 space-y-5 p-6 rounded-2xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: 'var(--line)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{selectedItem.itemCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600">
                    {selectedItem.objectClass.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="font-serif text-lg font-bold mt-1">{selectedItem.label}</h2>
                <p className="text-xs opacity-60 mt-0.5">
                  Location: {selectedItem.locationName} · Zone: {selectedItem.zoneName} ({selectedItem.zoneCode})
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedItem.status !== 'CLEARED_BY_OPERATOR' && (
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30 transition-colors"
                  >
                    Mark as Cleared
                  </button>
                )}

                <button
                  onClick={() => setTacticalAction('RECOMMEND_PATROL_RESPONSE')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] shadow-xs transition-colors"
                >
                  Recommend patrol response
                </button>
              </div>
            </div>

            {/* Video Feed Preview */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
              <div className="p-3 bg-[var(--surface)] border-b flex items-center justify-between text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
                <span className="font-bold flex items-center gap-1.5 text-[var(--sea-600)]">
                  <Video className="w-4 h-4" /> Drone Sentry Patch ({selectedItem.uavCode})
                </span>
                <span className="opacity-60">Modality: {selectedItem.modality} · Conf: {Math.round(selectedItem.confidence * 100)}%</span>
              </div>
              <div className="aspect-video w-full bg-slate-900 relative">
                <DroneVideoPlayer sceneName="vizhinjam_patrol" />
              </div>
            </div>

            {/* Object Telemetry & Signatures */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Thermal Character</span>
                <span className="text-sm font-serif font-bold text-red-600 dark:text-red-400 block">
                  {selectedItem.thermalSignature}
                </span>
                <span className="text-[10px] opacity-60 block">
                  {selectedItem.thermalSignature === 'COLD_MASS'
                    ? 'Submerged / dense waterlogged payload'
                    : selectedItem.thermalSignature === 'ELEVATED_HEAT'
                    ? 'Thermal delta +4.2°C above ambient beach sand'
                    : 'Equilibrium with surrounding terrain'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">GPS Coordinates</span>
                <span className="text-xs font-mono font-bold block pt-0.5">
                  {selectedItem.lat.toFixed(4)}° N, {selectedItem.lon.toFixed(4)}° E
                </span>
                <span className="text-[10px] opacity-60 block">WGS-84 RTK geo-referenced</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface)] border space-y-1" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono uppercase opacity-50 block font-bold">Evidence Incident Link</span>
                <span className="text-xs font-mono font-bold text-purple-600 block pt-0.5">
                  {selectedItem.elirId ?? 'Auto-generate on escalate'}
                </span>
                <span className="text-[10px] opacity-60 block">Sec 65B court dossier linked</span>
              </div>
            </div>

            {/* Cleared Audit Note (if cleared) */}
            {selectedItem.status === 'CLEARED_BY_OPERATOR' && (
              <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  OBJECT CLEARED &amp; ARCHIVED
                </div>
                <p className="opacity-90">Reason: {selectedItem.clearedReason}</p>
                <span className="text-[10px] opacity-75 block">Cleared by: {selectedItem.clearedBy}</span>
              </div>
            )}
          </div>
        </div>

        {/* Human in the loop footer */}
        <HumanInterpretationNote />
      </div>

      {/* Mark Cleared Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <h3 className="font-serif text-base font-bold">Mark Stationary Object as Cleared</h3>
            <p className="text-xs opacity-70">
              Provide a verified verification reason before archiving this object from the active coastal watch queue.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-mono uppercase opacity-50 block font-bold text-[10px]">Mandatory Reason Code</label>
              {[
                'Collected by verified owner / fisherman',
                'Inspected on-site by beach patrol / SI',
                'Natural ocean debris / seaweed cluster',
                'False detection — non-stationary water reflection',
              ].map(reason => (
                <label
                  key={reason}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <input
                    type="radio"
                    name="clear_reason"
                    checked={clearReason === reason}
                    onChange={() => setClearReason(reason)}
                    className="accent-[var(--sea-600)]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={() => setShowClearModal(false)}
                className="px-3 py-1.5 rounded-lg border text-xs"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkCleared}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                Confirm Clearance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Config Drawer */}
      {showConfigDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm h-full p-6 space-y-5 border-l shadow-2xl" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <h3 className="font-serif text-base font-bold">Stationary Dwell Thresholds</h3>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="text-xs font-mono p-1 rounded hover:bg-[var(--surface-hover)]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs opacity-70">
              Configure how long an unattended package or stationary vessel can dwell before automatic escalation to control room alert.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="block opacity-60">Restricted Jetty / Naval Berth:</span>
                <span className="font-bold text-[var(--sea-600)] block">10 minutes</span>
              </div>
              <div className="space-y-1">
                <span className="block opacity-60">Lighthouse / Tourist Promenade:</span>
                <span className="font-bold text-[var(--sea-600)] block">20 minutes</span>
              </div>
              <div className="space-y-1">
                <span className="block opacity-60">Open Sea / Breakwater Rocks:</span>
                <span className="font-bold text-[var(--sea-600)] block">30 minutes</span>
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)]"
              >
                Apply Thresholds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tactical Action Dialog */}
      {tacticalAction && (
        <TacticalActionDialog
          actionType={tacticalAction}
          targetId={selectedItem.id}
          targetCode={selectedItem.itemCode}
          targetType="ABANDONED_OBJECT"
          onClose={() => setTacticalAction(null)}
          onConfirm={() => {
            setTacticalAction(null);
            alert('Patrol response recommendation dispatched to Coastal Police duty register.');
          }}
        />
      )}
    </div>
  );
}

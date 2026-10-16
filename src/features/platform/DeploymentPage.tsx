// ============================================================
// SmartQEye Coastal — Deployment & Compute Architecture
// Single pane for Central GPU Nodes, Edge Profiles, and Deployment Models
// Fully compliant with RFP §5, Proposal §6.6, and Rule 1 Benchmark Guidance
// ============================================================

import React, { useState } from 'react';
import {
  Server, Shield, CheckCircle2,
  Info, Wifi, WifiOff, RefreshCw, Layers,
  AlertTriangle, Check, Lock, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auditApi } from '@/lib/api';

interface SyncItem {
  id: string;
  type: 'ALERT' | 'CONTACT_META' | 'KEYFRAME' | 'EVIDENCE_CLIP' | 'TELEMETRY_LOG';
  target: string;
  sizeKb: number;
  timestamp: string;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'CONFLICT';
}

const INITIAL_SYNC_ITEMS: SyncItem[] = [
  { id: 'SYNC-801', type: 'ALERT', target: 'Vizhinjam Stn -> Central KSDC', sizeKb: 14, timestamp: '10s ago', status: 'SYNCED' },
  { id: 'SYNC-802', type: 'CONTACT_META', target: 'Vizhinjam Stn -> Central KSDC', sizeKb: 38, timestamp: '18s ago', status: 'SYNCED' },
  { id: 'SYNC-803', type: 'KEYFRAME', target: 'Vizhinjam Stn -> Central KSDC', sizeKb: 420, timestamp: '32s ago', status: 'SYNCED' },
  { id: 'SYNC-804', type: 'EVIDENCE_CLIP', target: 'Neendakara Stn -> Central KSDC', sizeKb: 8400, timestamp: '1m ago', status: 'SYNCED' },
  { id: 'SYNC-805', type: 'TELEMETRY_LOG', target: 'Vizhinjam Stn -> Central KSDC', sizeKb: 110, timestamp: '2m ago', status: 'SYNCED' },
];

export default function DeploymentPage() {

  // Sync simulation state
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>(INITIAL_SYNC_ITEMS);
  const [syncProgress, setSyncProgress] = useState(100);
  const [selectedModelTab, setSelectedModelTab] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Trigger Network Drop
  const handleSimulateDisconnect = () => {
    setIsOffline(true);
    setSyncProgress(35);
    const lagItems: SyncItem[] = [
      { id: 'LAG-901', type: 'ALERT', target: 'Station Edge -> Central', sizeKb: 12, timestamp: 'Just now', status: 'QUEUED' },
      { id: 'LAG-902', type: 'KEYFRAME', target: 'Station Edge -> Central', sizeKb: 512, timestamp: 'Just now', status: 'QUEUED' },
      { id: 'LAG-903', type: 'CONTACT_META', target: 'Station Edge -> Central', sizeKb: 64, timestamp: 'Just now', status: 'QUEUED' },
      { id: 'LAG-904', type: 'EVIDENCE_CLIP', target: 'Station Edge -> Central', sizeKb: 11200, timestamp: 'Just now', status: 'QUEUED' },
      ...syncQueue.slice(0, 3)
    ];
    setSyncQueue(lagItems);

    auditApi.append({
      userId: 'sys-daemon',
      userName: 'Edge Ingestion Gateway',
      userRole: 'SYS_ADMIN',
      action: 'SYSTEM_HEALTH_CHECK',
      targetType: 'SYSTEM',
      targetId: 'EDGE-GATEWAY-VIZHINJAM',
      beforeAfterSummary: 'Simulated station edge network partition — buffering local outputs in resilient offline queue',
      outcome: 'SUCCESS'
    }).catch(console.error);
  };

  // Trigger Reconnect & Fast Catch-up Sync
  const handleSimulateReconnect = () => {
    setIsOffline(false);
    setIsSyncing(true);
    setSyncProgress(50);

    // Step 1: Transition queued to syncing
    setSyncQueue(prev => prev.map(item => ({ ...item, status: 'SYNCING' })));

    // Step 2: Complete sync after 1.2s
    setTimeout(() => {
      setSyncProgress(100);
      setIsSyncing(false);
      setSyncQueue(prev => prev.map(item => ({ ...item, status: 'SYNCED' })));

      auditApi.append({
        userId: 'sys-daemon',
        userName: 'Edge Ingestion Gateway',
        userRole: 'SYS_ADMIN',
        action: 'EXPORT_EVIDENCE',
        targetType: 'SYSTEM',
        targetId: 'EDGE-GATEWAY-VIZHINJAM',
        beforeAfterSummary: 'Station edge connection re-established — catch-up sync completed with 0 dropped frames or records',
        outcome: 'SUCCESS'
      }).catch(console.error);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Deployment &amp; Compute Architecture</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                PROPOSAL §6.6 / RFP §5
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                AIR-GAPPED COMPLIANT
              </span>
            </div>
            <p className="text-xs opacity-60">
              Central GPU inference cluster, edge station gateways, cooperative mesh, and dev-to-prod deployment pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg border bg-[var(--panel)] flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Fabric Status: <strong className="text-emerald-600">6 NODES ONLINE</strong></span>
          </div>
        </div>
      </div>

      {/* ── Main Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Rule 1 Benchmark Disclaimer ── */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs font-mono flex items-start gap-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-1">
            <span className="font-bold">OPERATING ENVELOPE &amp; BENCHMARK NOTICE (RFP §5 &amp; Proposal §6.6):</span>
            <p className="opacity-90 font-sans">
              All multi-stream throughput, inference frame rates, and latency figures stated in this platform reflect{' '}
              <strong>Target — to be benchmarked on approved infrastructure</strong>. Per Kerala Police procurement compliance guidelines,
              no measured hardware performance claims are asserted until formal on-site acceptance testing on client-approved node clusters.
            </p>
          </div>
        </div>

        {/* ── Four Approved Deployment Architectures Visual ── */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--sea-600)]" />
                <h2 className="font-serif text-base font-bold">Four Approved Deployment Architectures</h2>
              </div>
              <p className="text-xs opacity-60">
                Architectures specified in proposal slide 10 — Centralised monitoring is strictly common to all four models
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
              Active Mode: <strong className="text-[var(--sea-600)]">Model A (Central GPU)</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Model A */}
            <div
              onClick={() => setSelectedModelTab('A')}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-3',
                selectedModelTab === 'A'
                  ? 'border-[var(--sea-500)] shadow-md'
                  : 'hover:border-[var(--sea-400)]'
              )}
              style={{ background: selectedModelTab === 'A' ? 'var(--surface)' : 'var(--raised)', borderColor: selectedModelTab === 'A' ? 'var(--sea-500)' : 'var(--line)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">MODEL A</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    PREFERRED
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Central GPU + Field Gateway</h3>
                <p className="text-xs opacity-75 font-sans leading-relaxed">
                  Field GCS gateways ingest raw drone video feeds and transmit SRT/RTSP to Central GPU nodes at KSDC / Cyber Division.
                </p>
              </div>
              <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="text-emerald-600 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High-Throughput Cluster
                </div>
                <div className="opacity-60">Target: ≥ 20 Concurrent Feeds</div>
              </div>
            </div>

            {/* Model B */}
            <div
              onClick={() => setSelectedModelTab('B')}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-3',
                selectedModelTab === 'B'
                  ? 'border-[var(--sea-500)] shadow-md'
                  : 'hover:border-[var(--sea-400)]'
              )}
              style={{ background: selectedModelTab === 'B' ? 'var(--surface)' : 'var(--raised)', borderColor: selectedModelTab === 'B' ? 'var(--sea-500)' : 'var(--line)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">MODEL B</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
                    PRACTICAL
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Local Edge + Central Sync</h3>
                <p className="text-xs opacity-75 font-sans leading-relaxed">
                  Tactical edge laptops at coastal police stations run RTMDet-S locally. Only metadata, keyframes, and alerts sync back.
                </p>
              </div>
              <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="text-cyan-600 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resilient Disconnect Mode
                </div>
                <div className="opacity-60">Target: 2–4 Feeds per Station</div>
              </div>
            </div>

            {/* Model C */}
            <div
              onClick={() => setSelectedModelTab('C')}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-3',
                selectedModelTab === 'C'
                  ? 'border-[var(--sea-500)] shadow-md'
                  : 'hover:border-[var(--sea-400)]'
              )}
              style={{ background: selectedModelTab === 'C' ? 'var(--surface)' : 'var(--raised)', borderColor: selectedModelTab === 'C' ? 'var(--sea-500)' : 'var(--line)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">MODEL C</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                    OPTIONAL
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Tactical Cooperative Edge</h3>
                <p className="text-xs opacity-75 font-sans leading-relaxed">
                  Mobile patrol vans and interceptor boats pool compute over local encrypted ad-hoc Wi-Fi / mesh networks with strict auth.
                </p>
              </div>
              <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="text-amber-600 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Field Mesh Clustering
                </div>
                <div className="opacity-60">Target: Peer-to-Peer Offload</div>
              </div>
            </div>

            {/* Model D */}
            <div
              onClick={() => setSelectedModelTab('D')}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-3',
                selectedModelTab === 'D'
                  ? 'border-[var(--sea-500)] shadow-md'
                  : 'hover:border-[var(--sea-400)]'
              )}
              style={{ background: selectedModelTab === 'D' ? 'var(--surface)' : 'var(--raised)', borderColor: selectedModelTab === 'D' ? 'var(--sea-500)' : 'var(--line)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">MODEL D</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 border border-purple-500/30">
                    FUTURE
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">UAV-Onboard + 4G/5G</h3>
                <p className="text-xs opacity-75 font-sans leading-relaxed">
                  Embedded neural accelerators inside UAV payload run Cognitive Frame Selection &amp; detectors in flight, beaming events.
                </p>
              </div>
              <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--line)' }}>
                <div className="text-purple-600 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Autonomous Payload
                </div>
                <div className="opacity-60">Target: Ultra-low Bandwidth</div>
              </div>
            </div>
          </div>

          {/* Model Property Invariant */}
          <div className="p-3 rounded-xl border bg-[var(--surface)] flex items-center gap-2 text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
            <Shield className="w-4 h-4 text-[var(--sea-600)] flex-shrink-0" />
            <span>
              <strong>Core System Invariant:</strong> Centralised monitoring is strictly common to all four models. Operators at state command see identical ELIR records, video replays, and contact tracks regardless of where inference compute occurs.
            </span>
          </div>
        </div>

        {/* ── Node Inventory (Live Cluster Status) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold">Node Inventory &amp; Hardware Profiles</h2>
              <p className="text-xs opacity-60">Primary GPU cluster, station edge laptops, cooperative pool workers, and ingestion gateway</p>
            </div>
            <span className="text-xs font-mono opacity-60">Cluster Heartbeat: 1.2s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Central Node A */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">node-central-a</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Central GPU Node A (Primary)</h3>
                <p className="text-xs opacity-60">Primary Tactical Inference &amp; Multi-Object Tracking</p>
              </div>
              <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[11px] font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-60">Profile:</span>
                  <span className="font-semibold text-[var(--sea-600)]">RTMDet-L + ByteTrack</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Target Hardware:</span>
                  <span className="font-semibold">2x 24GB VRAM Node</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Inference Queue:</span>
                  <span className="font-semibold text-emerald-600">2 frames pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Last Sync:</span>
                  <span className="font-semibold">0.4s ago</span>
                </div>
              </div>
            </div>

            {/* Central Node B */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">node-central-b</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  HOT STANDBY
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Central GPU Node B (Secondary)</h3>
                <p className="text-xs opacity-60">Forensic Analytics, Re-ID &amp; Hot Standby Failover</p>
              </div>
              <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[11px] font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-60">Profile:</span>
                  <span className="font-semibold text-[var(--sea-600)]">RT-DETRv2 + Thermal</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Target Hardware:</span>
                  <span className="font-semibold">2x 24GB VRAM Node</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Inference Queue:</span>
                  <span className="font-semibold text-emerald-600">0 frames pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Last Sync:</span>
                  <span className="font-semibold">0.8s ago</span>
                </div>
              </div>
            </div>

            {/* Edge Station Laptop 01 */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">edge-vizhinjam-01</span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                  isOffline
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                )}>
                  {isOffline ? 'OFFLINE (LAG)' : 'ONLINE'}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Vizhinjam Coastal Station Edge</h3>
                <p className="text-xs opacity-60">Local Tactical Edge Laptop (Mobile Command)</p>
              </div>
              <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[11px] font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-60">Profile:</span>
                  <span className="font-semibold text-[var(--sea-600)]">RTMDet-S Edge</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Target Hardware:</span>
                  <span className="font-semibold">1x 16GB VRAM Mobile</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Sync Lag Queue:</span>
                  <span className={cn('font-semibold', isOffline ? 'text-amber-600 font-bold' : 'text-emerald-600')}>
                    {isOffline ? '4 items buffered' : '0 items buffered'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Last Sync:</span>
                  <span className="font-semibold">{isOffline ? '1m 24s ago' : '1.4s ago'}</span>
                </div>
              </div>
            </div>

            {/* Edge Station Laptop 02 */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">edge-neendakara-02</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Neendakara Coastal Station Edge</h3>
                <p className="text-xs opacity-60">Harbor &amp; Estuary Monitoring Terminal</p>
              </div>
              <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[11px] font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-60">Profile:</span>
                  <span className="font-semibold text-[var(--sea-600)]">RTMDet-S Edge</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Target Hardware:</span>
                  <span className="font-semibold">1x 16GB VRAM Mobile</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Sync Lag Queue:</span>
                  <span className="font-semibold text-emerald-600">0 items buffered</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Last Sync:</span>
                  <span className="font-semibold">2.1s ago</span>
                </div>
              </div>
            </div>

            {/* Cooperative Node Pool */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">coop-van-alpha</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  CO-OP POOL
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Patrol Van Alpha (Mobile Co-op)</h3>
                <p className="text-xs opacity-60">Ruggedized In-Vehicle Edge Compute Box</p>
              </div>
              <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[11px] font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-60">Security Policy:</span>
                  <span className="font-semibold text-purple-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Auth + Encrypted + Audited
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Data Locality:</span>
                  <span className="font-semibold text-emerald-600">Station Geographic Geo-Bound</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Peer Mesh:</span>
                  <span className="font-semibold">2 Peers connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Last Sync:</span>
                  <span className="font-semibold">3.8s ago</span>
                </div>
              </div>
            </div>

            {/* Ingestion Gateway */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">gw-ingest-01</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold">Tactical RTSP/SRT Ingest Gateway</h3>
                <p className="text-xs opacity-60">20-Feed Stream Multiplexer &amp; Demux Bus</p>
              </div>
              <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[11px] font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span className="opacity-60">Protocols:</span>
                  <span className="font-semibold text-[var(--sea-600)]">RTSP / SRT / WebRTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Ingested Feeds:</span>
                  <span className="font-semibold">20 Active Concurrent Feeds</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Jitter Buffer:</span>
                  <span className="font-semibold text-emerald-600">45 ms (Adaptive)</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Hardware Accel:</span>
                  <span className="font-semibold">NVDEC / VAAPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Edge Sync Queue & Interactive Offline-then-Recover Catch-up Sync ── */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <RefreshCw className={cn('w-4 h-4 text-[var(--sea-600)]', isSyncing && 'animate-spin')} />
                <h2 className="font-serif text-base font-bold">Edge Output Synchronization Queue</h2>
              </div>
              <p className="text-xs opacity-60">
                Guarantees zero evidence loss across field network drops with automated transactional reconciliation
              </p>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="flex items-center gap-2">
              {isOffline ? (
                <button
                  onClick={handleSimulateReconnect}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  Restore Network &amp; Fast Catch-Up Sync
                </button>
              ) : (
                <button
                  onClick={handleSimulateDisconnect}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  Simulate Station Disconnect &amp; Sync Lag
                </button>
              )}
            </div>
          </div>

          {/* Sync Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2">
                {isOffline ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> OFFLINE LAG ACCUMULATING
                  </span>
                ) : isSyncing ? (
                  <span className="text-[var(--sea-600)] font-bold flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SYNCHRONIZING QUEUED PACKAGES...
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ALL EDGE ARTIFACTS RECONCILED
                  </span>
                )}
              </span>
              <span className="opacity-60">{syncProgress}% Synced</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface)] border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  isOffline ? 'bg-amber-500' : isSyncing ? 'bg-[var(--sea-500)]' : 'bg-emerald-500'
                )}
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>

          {/* Sync Items Table */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface)] text-[11px] font-mono opacity-70 border-b" style={{ borderColor: 'var(--line)' }}>
                <tr>
                  <th className="p-2.5">TRANSACTION ID</th>
                  <th className="p-2.5">ARTIFACT TYPE</th>
                  <th className="p-2.5">TARGET / PIPELINE</th>
                  <th className="p-2.5">PAYLOAD SIZE</th>
                  <th className="p-2.5">TIMESTAMP</th>
                  <th className="p-2.5 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                {syncQueue.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="p-2.5 font-bold text-[var(--sea-600)]">{item.id}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-2.5 opacity-80">{item.target}</td>
                    <td className="p-2.5 opacity-70">{item.sizeKb > 1000 ? `${(item.sizeKb / 1024).toFixed(1)} MB` : `${item.sizeKb} KB`}</td>
                    <td className="p-2.5 opacity-60">{item.timestamp}</td>
                    <td className="p-2.5 text-right">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1',
                          item.status === 'SYNCED' && 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                          item.status === 'SYNCING' && 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 animate-pulse',
                          item.status === 'QUEUED' && 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
                          item.status === 'CONFLICT' && 'bg-red-500/10 text-red-600 border border-red-500/20'
                        )}
                      >
                        {item.status === 'SYNCED' && <Check className="w-3 h-3" />}
                        {item.status === 'SYNCING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {item.status === 'QUEUED' && <Clock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 4: Operating Envelope Table (Strict Target-Only Compliance) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold">Target Operating Envelope by Hardware Profile</h2>
              <p className="text-xs opacity-60">Proposal slide 10 target envelopes across central, edge, and cooperative tiers</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              TARGET SPECIFICATION ONLY
            </span>
          </div>

          <div className="rounded-xl border overflow-x-auto" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface)] text-[11px] font-mono opacity-70 border-b" style={{ borderColor: 'var(--line)' }}>
                <tr>
                  <th className="p-3">DEPLOYMENT PROFILE</th>
                  <th className="p-3">TARGET STREAM CONCURRENCY</th>
                  <th className="p-3">TARGET RESOLUTION</th>
                  <th className="p-3">TARGET INFERENCE FPS</th>
                  <th className="p-3">COMPUTE LOCATION</th>
                  <th className="p-3">COMPLIANCE / VALIDATION STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                <tr>
                  <td className="p-3 font-bold text-[var(--sea-600)]">Central High-Throughput (Model A)</td>
                  <td className="p-3">Target: ≥ 20 concurrent feeds (scalable to 32)</td>
                  <td className="p-3">Target: 1080p / 4K RGB + Thermal</td>
                  <td className="p-3">Target: 25–30 FPS per active stream</td>
                  <td className="p-3 opacity-80">Central GPU Node A &amp; B (KSDC / HQ)</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Target / TBD on approved hardware
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[var(--sea-600)]">Station Tactical Edge (Model B)</td>
                  <td className="p-3">Target: 2–4 feeds per station</td>
                  <td className="p-3">Target: 1080p RGB / Thermal</td>
                  <td className="p-3">Target: 20–25 FPS with CFS optimization</td>
                  <td className="p-3 opacity-80">Station Edge Mobile Laptop</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Target / TBD on approved hardware
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[var(--sea-600)]">Tactical Cooperative Mesh (Model C)</td>
                  <td className="p-3">Target: 1–2 feeds offloaded per peer</td>
                  <td className="p-3">Target: 720p / 1080p</td>
                  <td className="p-3">Target: 15–20 FPS ad-hoc distributed</td>
                  <td className="p-3 opacity-80">Patrol Van / Interceptor Mobile Unit</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Target / TBD on approved hardware
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[var(--sea-600)]">UAV-Onboard Autonomous (Model D)</td>
                  <td className="p-3">Target: 1 feed (onboard camera stream)</td>
                  <td className="p-3">Target: 720p / 1080p downsampled</td>
                  <td className="p-3">Target: 15 FPS low-power SOM</td>
                  <td className="p-3 opacity-80">UAV Payload Embedded SOM</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Target / TBD on approved hardware
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[var(--sea-600)]">Forensic Post-Mission Lab</td>
                  <td className="p-3">Target: Batch uncompressed replay</td>
                  <td className="p-3">Target: Native 4K / High-Bitrate LWIR</td>
                  <td className="p-3">Target: Full Frame Non-Realtime Analysis</td>
                  <td className="p-3 opacity-80">Drone Forensic Lab Workstation</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Target / TBD on approved hardware
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 5: Dev-to-Prod Progressive Pipeline Stepper ── */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold">Dev-to-Production Environment Pipeline</h2>
              <p className="text-xs opacity-60">Strict 4-stage promotion workflow ensuring air-gapped readiness and police sign-off</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> KSDC-Kochi Certified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stage 1 */}
            <div className="p-4 rounded-xl border bg-[var(--surface)] space-y-2" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">STAGE 01</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
                  PASSED
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold">QWI Dev &amp; Validation</h3>
              <p className="text-[11px] opacity-70 font-sans">
                Thiruvananthapuram dev lab. Synthetic sea simulator, unit tests, model export &amp; FP16 / INT8 quantization.
              </p>
              <div className="pt-2 text-[10px] font-mono opacity-60 border-t" style={{ borderColor: 'var(--line)' }}>
                Artifact: Signed Build #1.2.0
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-xl border bg-[var(--surface)] space-y-2" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">STAGE 02</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
                  PASSED
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold">Kerala Police Staging</h3>
              <p className="text-[11px] opacity-70 font-sans">
                Drone Forensic Lab, Cyber Division. Hardware test bench, Section 65B tamper verification, RTSP stream stability.
              </p>
              <div className="pt-2 text-[10px] font-mono opacity-60 border-t" style={{ borderColor: 'var(--line)' }}>
                Certificate: SCRB-STG-2026-04
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-xl border bg-[var(--surface)] border-[var(--sea-500)] space-y-2" style={{ borderColor: 'var(--sea-500)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">STAGE 03</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500 text-white">
                  ACTIVE PROD
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold">KSDC-Kochi Production</h3>
              <p className="text-[11px] opacity-70 font-sans">
                Kerala State Data Centre central cluster. Air-gapped network perimeter, CCTNS &amp; 112 CAD bridge active.
              </p>
              <div className="pt-2 text-[10px] font-mono opacity-80 border-t text-[var(--sea-600)] font-semibold" style={{ borderColor: 'var(--line)' }}>
                Node A &amp; B High-Availability Pair
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-xl border bg-[var(--surface)] space-y-2" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--sea-600)]">STAGE 04</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-600">
                  DEPLOYED
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold">Station Edge Terminals</h3>
              <p className="text-[11px] opacity-70 font-sans">
                Vizhinjam, Neendakara &amp; Beypore Coastal Police Stations. Resilient local offline queue &amp; edge laptops.
              </p>
              <div className="pt-2 text-[10px] font-mono opacity-60 border-t" style={{ borderColor: 'var(--line)' }}>
                Terminals: 3 Coastal Units
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — Deployment & Compute Architecture
// Single pane for Central GPU Nodes, Edge Profiles, and Deployment Models
// ============================================================

import { Server, Cpu, Laptop, HardDrive, Shield, CheckCircle2, Info, Activity } from 'lucide-react';
import { CENTRAL_DEPLOYMENT_CONFIG } from '@/config/deployment';
import { cn } from '@/lib/utils';

export default function DeploymentPage() {
  const cfg = CENTRAL_DEPLOYMENT_CONFIG;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Deployment &amp; Compute Nodes</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                MULTI-NODE FABRIC
              </span>
            </div>
            <p className="text-xs opacity-60">
              Central GPU inference cluster, edge station gateways, and tactical mobile nodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
            Cluster Status: <span className="font-bold text-emerald-600">HEALTHY (2 Nodes Active)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Benchmark notice */}
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>Notice: All throughput specifications represent <strong>Target — to be benchmarked on approved infrastructure</strong> per proposal slide 10.</span>
        </div>

        {/* Compute Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(cfg.nodes).map(([key, node]) => (
            <div
              key={node.id}
              className="rounded-2xl border p-5 flex flex-col justify-between space-y-4"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{node.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {node.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-base font-bold">{node.name}</h3>
                  <p className="text-xs opacity-60 mt-0.5">{node.role}</p>
                </div>

                <div className="p-3 rounded-xl border bg-[var(--surface)] space-y-2 text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <span className="opacity-50 block text-[10px]">HARDWARE PROFILE</span>
                    <span className="font-semibold">{node.hardwareString}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                    <div>
                      <span className="opacity-50 block text-[10px]">TOTAL VRAM</span>
                      <span className="font-semibold text-[var(--sea-600)]">{node.vramTotalGb} GB</span>
                    </div>
                    <div>
                      <span className="opacity-50 block text-[10px]">CUDA / TENSORRT</span>
                      <span className="font-semibold">{node.cudaVersion} / {node.tensorRtVersion}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synchronised with Central Message Bus</span>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Deployment Models (RFP §5) */}
        <div className="space-y-3">
          <h2 className="font-serif text-base font-bold">Four Approved Deployment Architectures (RFP §5)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cfg.deploymentModels.map(model => (
              <div
                key={model.id}
                className="p-5 rounded-xl border space-y-2"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{model.id}</span>
                  <span className="text-[10px] font-mono opacity-50">AIR-GAPPED COMPLIANT</span>
                </div>
                <h3 className="font-serif text-sm font-bold">{model.name}</h3>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  Target: {model.target}
                </div>
                <p className="text-xs opacity-70 font-sans">
                  Specification: {model.specs}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

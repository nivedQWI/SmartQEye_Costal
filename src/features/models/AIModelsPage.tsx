// ============================================================
// SmartQEye Coastal — AI & Models Management (/models)
// As specified in Costal Police .docx
// ============================================================

import { useState } from 'react';
import {
  Cpu, Play, Square, RefreshCw, CheckCircle2,
  AlertTriangle, HardDrive, Zap, Sliders, Radio,
  Activity, Layers, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';
import type { AiModelItem } from '@/types';

export default function AIModelsPage() {
  const [models, setModels] = useState<AiModelItem[]>([
    {
      id: 'mod-1',
      name: 'RTMDet-x / RT-DETRv2',
      version: 'v2.4.1-coastal',
      licence: 'Apache-2.0',
      task: 'TARGET_DETECTION',
      framework: 'OpenMMLab / TensorRT 10.2',
      vramMb: 3450,
      state: 'ACTIVE',
      assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03', 'UAV-KL-04'],
      fpsAverage: 31.4,
      latencyMs: 14.2,
    },
    {
      id: 'mod-2',
      name: 'ByteTrack Multi-Object Tracker',
      version: 'v2.1.0',
      licence: 'MIT',
      task: 'OBJECT_TRACKING',
      framework: 'C++ CUDA Plugin',
      vramMb: 850,
      state: 'ACTIVE',
      assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03'],
      fpsAverage: 45.0,
      latencyMs: 4.8,
    },
    {
      id: 'mod-3',
      name: 'PaddleOCR / CRNN License Plate',
      version: 'v2.8-in-anpr',
      licence: 'Apache-2.0',
      task: 'ANPR_OCR',
      framework: 'PaddleInference / ONNX',
      vramMb: 1950,
      state: 'ACTIVE',
      assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-05'],
      fpsAverage: 24.8,
      latencyMs: 22.1,
    },
    {
      id: 'mod-4',
      name: 'OSNet-IBN / ArcFace Re-ID',
      version: 'v1.4.2-r100',
      licence: 'Permissive — to be confirmed',
      task: 'FACE_RECOGNITION',
      framework: 'InsightFace / TensorRT',
      vramMb: 2400,
      state: 'ACTIVE',
      assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02'],
      fpsAverage: 28.2,
      latencyMs: 18.6,
    },
    {
      id: 'mod-5',
      name: 'CSRNet Density Estimator',
      version: 'v3.0.1-crowd',
      licence: 'MIT',
      task: 'CROWD_DENSITY',
      framework: 'PyTorch CUDA 12.4',
      vramMb: 2100,
      state: 'ACTIVE',
      assignedDroneCodes: ['UAV-KL-02', 'UAV-KL-06'],
      fpsAverage: 26.5,
      latencyMs: 19.4,
    },
    {
      id: 'mod-6',
      name: 'SlowFast Behavior Anomaly',
      version: 'v2.0-action',
      licence: 'Apache-2.0',
      task: 'BEHAVIOR_ANOMALY',
      framework: 'TorchVision / TensorRT',
      vramMb: 4200,
      state: 'STARTING',
      assignedDroneCodes: ['UAV-KL-01'],
      fpsAverage: 18.2,
      latencyMs: 34.0,
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  function toggleModelDrone(modelId: string, droneCode: string) {
    setModels(models.map(m => {
      if (m.id !== modelId) return m;
      const assigned = m.assignedDroneCodes.includes(droneCode)
        ? m.assignedDroneCodes.filter(c => c !== droneCode)
        : [...m.assignedDroneCodes, droneCode];
      return { ...m, assignedDroneCodes: assigned };
    }));
  }

  function handleHotSwap(modelId: string, action: 'START' | 'STOP' | 'RESTART') {
    setModels(models.map(m => {
      if (m.id !== modelId) return m;
      if (action === 'STOP') return { ...m, state: 'STOPPED' };
      if (action === 'START') return { ...m, state: 'ACTIVE' };
      return { ...m, state: 'STARTING' };
    }));

    const modelName = models.find(m => m.id === modelId)?.name;
    setToast(`Hot-swap operation "${action}" applied to model: ${modelName}`);
    setTimeout(() => setToast(null), 3500);

    if (action === 'RESTART') {
      setTimeout(() => {
        setModels(curr => curr.map(m => m.id === modelId ? { ...m, state: 'ACTIVE' } : m));
      }, 1500);
    }
  }

  const totalVramMb = models.filter(m => m.state === 'ACTIVE' || m.state === 'STARTING').reduce((acc, m) => acc + m.vramMb, 0);

  return (
    <div className="h-full flex flex-col overflow-y-auto chart-paper p-4 md:p-6 gap-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            AI Analytics &amp; Neural Models
          </h1>
          <p className="text-xs opacity-70" style={{ color: 'var(--text-muted)' }}>
            GPU cluster model management, per-drone inference assignment matrix, and real-time hot-swapping
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-mono font-medium border bg-emerald-50 text-emerald-800 border-emerald-300">
            CUDA 12.4 · TensorRT 10.2 · Active
          </span>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl p-3 bg-emerald-500/15 border border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TOP: CLUSTER STATUS BANNER
         ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between opacity-60 text-xs mb-1">
            <span>GPU Workers</span>
            <Cpu className="w-4 h-4 text-[var(--sea-600)]" />
          </div>
          <div className="text-xl font-bold font-mono">2x NVIDIA RTX 4090</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Dual Cluster Online</div>
        </div>

        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between opacity-60 text-xs mb-1">
            <span>VRAM Allocated</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono">{(totalVramMb / 1024).toFixed(1)} / 48.0 GB</div>
          <div className="text-[11px] opacity-70 font-mono mt-0.5">{((totalVramMb / (48 * 1024)) * 100).toFixed(0)}% Utilized</div>
        </div>

        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between opacity-60 text-xs mb-1">
            <span>Avg Throughput</span>
            <Zap className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-mono">174.2 FPS</div>
          <div className="text-[11px] opacity-70 font-mono mt-0.5">Target — to be benchmarked on approved infrastructure</div>
        </div>

        <div className="rounded-2xl p-4 border shadow-sm" style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between opacity-60 text-xs mb-1">
            <span>Mean Latency</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold font-mono">18.8 ms</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Target — to be benchmarked on approved infrastructure</div>
        </div>
      </div>

      {/* ── Human-in-the-Loop Policy Banner (RFP §11, Proposal §5.1.29) ── */}
      <div className="rounded-2xl p-4 border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-blue-900 dark:text-blue-200 mb-0.5">
            Human-in-the-Loop & Model Governance Policy (RFP §11 / Proposal §5.1.29)
          </div>
          <p className="text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
            Operator feedback, triage dispositions, and manual bounding adjustments are routed directly to the curated offline training dataset queue. Deployed neural models are never automatically retrained or updated online without formal forensic validation and custodian sign-off.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN: MODEL REGISTRY & PER-DRONE MATRIX
         ══════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 border shadow-sm flex-1 flex flex-col"
        style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--sea-600)]" />
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider">
              Neural Analytics Model Registry &amp; Drone Assignment Matrix
            </h2>
          </div>
          <span className="text-xs opacity-60">Checkboxes control live neural pipelines per UAV</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-mono opacity-60 uppercase text-[11px]" style={{ borderColor: 'var(--line)' }}>
                <th className="py-2.5 px-3">Model Name &amp; Task</th>
                <th className="py-2.5 px-3">Engine / Framework</th>
                <th className="py-2.5 px-3">Licence</th>
                <th className="py-2.5 px-3">VRAM</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Assigned Drones (Check to Hot-Swap)</th>
                <th className="py-2.5 px-3 text-right">Cluster Controls</th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.id} className="border-b transition-colors hover:bg-[var(--sand-100)]" style={{ borderColor: 'var(--line)' }}>
                  {/* Model Name & Task */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{m.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold"
                        style={{ background: 'var(--sand-200)', color: 'var(--ink-900)' }}>
                        {m.task.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] opacity-60 font-mono">{m.version}</span>
                    </div>
                  </td>

                  {/* Engine */}
                  <td className="py-3 px-3 font-mono opacity-75">{m.framework}</td>

                  {/* Licence */}
                  <td className="py-3 px-3 font-mono font-semibold">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                      {m.licence}
                    </span>
                  </td>

                  {/* VRAM */}
                  <td className="py-3 px-3 font-mono font-semibold">{m.vramMb} MB</td>

                  {/* Status Pill */}
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1',
                        m.state === 'ACTIVE' && 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        m.state === 'STARTING' && 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
                        m.state === 'STOPPED' && 'bg-gray-200 text-gray-700 border-gray-300',
                        m.state === 'ERROR' && 'bg-red-100 text-red-800 border-red-300'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', m.state === 'ACTIVE' ? 'bg-emerald-500' : m.state === 'STARTING' ? 'bg-amber-500' : 'bg-gray-400')} />
                      {m.state}
                    </span>
                  </td>

                  {/* Drone Checkboxes */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {UAVS.map(u => {
                        const isAssigned = m.assignedDroneCodes.includes(u.droneCode);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleModelDrone(m.id, u.droneCode)}
                            className={cn(
                              'px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all',
                              isAssigned
                                ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)] shadow-xs'
                                : 'bg-[var(--panel)] border-[var(--line)] opacity-50 hover:opacity-80'
                            )}
                            title={`Assign ${m.name} to ${u.droneCode}`}
                          >
                            {u.droneCode.replace('UAV-KL-', 'KL-')}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  {/* Hot-Swap Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {m.state !== 'ACTIVE' ? (
                        <button
                          onClick={() => handleHotSwap(m.id, 'START')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          title="Start Model"
                        >
                          <Play className="w-3 h-3 inline fill-white mr-1" />
                          Start
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHotSwap(m.id, 'STOP')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                          title="Stop Model"
                        >
                          <Square className="w-3 h-3 inline fill-white mr-1" />
                          Stop
                        </button>
                      )}

                      <button
                        onClick={() => handleHotSwap(m.id, 'RESTART')}
                        className="p-1.5 rounded-lg border hover:bg-[var(--panel)] transition-colors opacity-70 hover:opacity-100"
                        title="Hot-Swap / Reload Model"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

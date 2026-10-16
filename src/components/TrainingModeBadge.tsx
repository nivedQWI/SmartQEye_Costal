// ============================================================
// SmartQEye Coastal — Training Mode Badge & Sandbox Banner
// RFP §13 & Proposal 5.1.35
// ============================================================

import { GraduationCap, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore, TRAINING_MODULES } from '@/lib/store';

export function TrainingModeBadge() {
  const navigate = useNavigate();
  const {
    isTrainingMode,
    completedModuleIds,
    toggleTrainingMode,
    resetTrainingProgress
  } = useTrainingStore();

  if (!isTrainingMode) {
    return (
      <button
        onClick={toggleTrainingMode}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--surface)] cursor-pointer opacity-75 hover:opacity-100"
        style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
        title="Activate Training & Simulation Sandbox Mode"
      >
        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
        <span className="hidden sm:inline">Training Mode</span>
      </button>
    );
  }

  const total = TRAINING_MODULES.length;
  const completed = completedModuleIds.length;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 animate-pulse"
        title="Training Mode Active: All dispatches and actions are sandboxed"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="tracking-wide">TRAINING SANDBOX</span>
        <span className="opacity-40">|</span>
        <button
          onClick={() => navigate('/help')}
          className="hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{completed}/{total} Completed</span>
        </button>
      </div>

      <button
        onClick={resetTrainingProgress}
        className="p-1 rounded hover:bg-[var(--surface)] text-xs opacity-60 hover:opacity-100 cursor-pointer"
        title="Reset Training Progress"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={toggleTrainingMode}
        className="p-1 rounded hover:bg-[var(--surface)] text-xs text-red-500 opacity-60 hover:opacity-100 cursor-pointer"
        title="Exit Training Mode"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

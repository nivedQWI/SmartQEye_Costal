// ============================================================
// SmartQEye Coastal — Guided Tour Floating Component
// RFP §13 & Proposal 5.1.35
// ============================================================

import { useNavigate } from 'react-router-dom';
import {
  Compass, ChevronLeft, ChevronRight, X, ExternalLink,
  CheckCircle2, Sparkles
} from 'lucide-react';
import { useTrainingStore, TOUR_DEFINITIONS, TRAINING_MODULES } from '@/lib/store';

export function GuidedTour() {
  const navigate = useNavigate();
  const {
    activeTourId,
    tourStepIndex,
    nextTourStep,
    prevTourStep,
    endTour,
    markModuleComplete
  } = useTrainingStore();

  if (!activeTourId) return null;

  const tour = TOUR_DEFINITIONS[activeTourId];
  if (!tour || !tour.steps[tourStepIndex]) return null;

  const currentStep = tour.steps[tourStepIndex];
  const isLast = tourStepIndex === tour.steps.length - 1;

  const handleFinish = () => {
    // Find corresponding module
    const mod = TRAINING_MODULES.find(m => m.tourId === activeTourId);
    if (mod) {
      markModuleComplete(mod.id);
    }
    endTour();
  };

  return (
    <div
      role="region"
      aria-label="Interactive Guided Tour"
      className="fixed bottom-14 right-6 z-50 w-96 rounded-2xl border shadow-2xl p-5 space-y-3.5 bg-[var(--panel)] animate-in fade-in slide-in-from-bottom-4"
      style={{ borderColor: 'var(--line)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="text-xs font-bold leading-tight">{tour.title}</div>
            <div className="text-[10px] font-mono opacity-60">
              Step {tourStepIndex + 1} of {tour.steps.length}
            </div>
          </div>
        </div>

        <button
          onClick={endTour}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-[var(--surface)] transition-colors cursor-pointer"
          title="Exit Tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Body */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[var(--sea-600)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {currentStep.title}
        </h4>
        <p className="text-xs opacity-80 leading-relaxed">
          {currentStep.content}
        </p>

        {currentStep.route && (
          <button
            onClick={() => navigate(currentStep.route!)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer pt-1"
          >
            <span>Open {currentStep.route} in Workspace</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={prevTourStep}
          disabled={tourStepIndex === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors opacity-80 hover:opacity-100 disabled:opacity-30 cursor-pointer"
          style={{ borderColor: 'var(--line)' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-1">
          {tour.steps.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === tourStepIndex ? 'bg-[var(--sea-600)] w-4' : 'bg-gray-400 opacity-40'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Finish
          </button>
        ) : (
          <button
            onClick={nextTourStep}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

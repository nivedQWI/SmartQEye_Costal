// ============================================================
// SmartQEye Coastal — ModalityToggle Shared Component
// Phase 7B Shared Component Library
// Toggle between RGB HD Optical, Thermal LWIR, and Split Views
// ============================================================

import React from 'react';
import { Eye, Flame, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VideoModality = 'RGB' | 'THERMAL' | 'SPLIT';

export interface ModalityToggleProps {
  modality: VideoModality;
  onChange: (modality: VideoModality) => void;
  size?: 'sm' | 'md';
  className?: string;
  hasThermalSensor?: boolean;
}

export function ModalityToggle({
  modality,
  onChange,
  size = 'md',
  className,
  hasThermalSensor = true,
}: ModalityToggleProps) {
  const options: { value: VideoModality; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'RGB', label: 'RGB', icon: Eye },
    { value: 'THERMAL', label: 'Thermal', icon: Flame },
    { value: 'SPLIT', label: 'Split', icon: Columns },
  ];

  const sizeClasses = {
    sm: 'p-0.5 text-[10px]',
    md: 'p-1 text-xs',
  }[size];

  const itemSize = {
    sm: 'px-2 py-0.5 gap-1',
    md: 'px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <div
      role="group"
      aria-label="Sensor Modality Selector"
      className={cn(
        'inline-flex items-center rounded-lg border bg-[var(--surface)] font-mono font-bold',
        sizeClasses,
        className
      )}
      style={{ borderColor: 'var(--line)' }}
    >
      {options.map(opt => {
        const Icon = opt.icon;
        const isActive = modality === opt.value;
        const isDisabled = opt.value === 'THERMAL' && !hasThermalSensor;

        return (
          <button
            key={opt.value}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center rounded-md transition-all cursor-pointer font-semibold',
              itemSize,
              isActive
                ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-xs font-bold border'
                : 'opacity-65 hover:opacity-100 text-[var(--text)] border border-transparent',
              isDisabled && 'opacity-30 cursor-not-allowed'
            )}
            style={{ borderColor: isActive ? 'var(--line)' : undefined }}
            title={isDisabled ? 'Sensor does not support Thermal LWIR' : `Switch to ${opt.label} view`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

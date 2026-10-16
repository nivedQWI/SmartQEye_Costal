import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HumanInterpretationNoteProps {
  className?: string;
  variant?: 'subtle' | 'card' | 'banner';
}

export function HumanInterpretationNote({ className, variant = 'subtle' }: HumanInterpretationNoteProps) {
  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium',
        'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
        className
      )}>
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Observed behaviour only.</strong> Operational interpretation and action rest with authorised Kerala Police personnel.
        </span>
      </div>
    );
  }

  return (
    <footer
      className={cn(
        'mt-4 pt-3 pb-1 border-t text-[11px] leading-relaxed flex items-center justify-between gap-3 text-[var(--text-muted)]',
        className
      )}
      style={{ borderColor: 'var(--line)' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        <span>
          <strong className="text-[var(--text)]">Observed behaviour only.</strong> Operational interpretation and action rest with authorised Kerala Police personnel.
        </span>
      </div>
      <span className="font-mono text-[10px] opacity-60 flex-shrink-0">RFP §11 · Decision Support</span>
    </footer>
  );
}

export default HumanInterpretationNote;

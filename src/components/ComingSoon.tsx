// ============================================================
// SmartQEye Coastal — "Coming Soon" stub page
// Used for Phase 2 routes
// ============================================================

import { Anchor } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      {/* Quantumweave Logo */}
      <div
        className="w-20 h-20 rounded-2xl p-2.5 flex items-center justify-center bg-white shadow-md border"
        style={{ borderColor: 'var(--line)' }}
      >
        <img
          src="/QW_logo.png"
          alt="Quantumweave Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="text-center max-w-sm">
        <h1 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {description ?? 'This section is under development and will be available in Phase 2.'}
        </p>
      </div>

      <div
        className="px-4 py-2 rounded-full text-xs font-medium"
        style={{ background: 'var(--sand-200)', color: 'var(--ink-800)' }}
      >
        Coming in Next Phase
      </div>

      {/* Chart-paper decorative dots */}
      <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="var(--ink-600)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

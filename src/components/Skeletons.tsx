// ============================================================
// SmartQEye Coastal — Skeletons Shared Component
// Phase 7B Shared Component Library (Accessible Loading Skeletons)
// ============================================================

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[var(--surface)] opacity-70', className)}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full rounded-xl border bg-[var(--panel)] p-4 space-y-3" style={{ borderColor: 'var(--line)' }}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Row skeletons */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn(
                  'h-4',
                  cIdx === 0 ? 'w-28' : cIdx === 1 ? 'w-40 flex-1' : 'w-24'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-6 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="rounded-xl border bg-[var(--panel)] overflow-hidden space-y-2" style={{ borderColor: 'var(--line)' }}>
      <Skeleton className="aspect-video w-full" />
      <div className="p-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="p-6 rounded-xl border bg-[var(--panel)] space-y-6" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-3 w-96" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

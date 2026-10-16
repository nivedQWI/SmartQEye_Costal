// ============================================================
// SmartQEye Coastal — IST Clock in harbour bar
// ============================================================

import { useState, useEffect } from 'react';
import { formatIST, formatUTC } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';

export function ISTClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const istStr = formatIST(now);
  const utcStr = formatUTC(now);

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="flex flex-col items-end cursor-default select-none">
            <span className="font-mono tabular text-base font-semibold" style={{ color: 'var(--text)' }}>
              {istStr}
            </span>
            <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-muted)' }}>IST</span>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-lg px-3 py-2 text-xs font-mono shadow-lg"
            style={{ background: 'var(--raised)', color: 'var(--text)', border: '1px solid var(--line)' }}
            sideOffset={8}
          >
            {utcStr}
            <Tooltip.Arrow style={{ fill: 'var(--raised)' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

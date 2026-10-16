// ============================================================
// SmartQEye Coastal — SideDrawer Accessible Component
// Phase 7B Shared Component Library (Radix Dialog Primitive)
// ============================================================

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  side?: 'right' | 'left';
  footer?: React.ReactNode;
}

export function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  width = 'md',
  side = 'right',
  footer,
}: SideDrawerProps) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[width];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          aria-describedby={description ? 'drawer-description' : undefined}
          className={cn(
            'fixed inset-y-0 z-50 flex flex-col w-full bg-[var(--panel)] border-l shadow-2xl duration-300 ease-in-out',
            side === 'right' ? 'right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right' : 'left-0 border-r border-l-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
            widthClasses
          )}
          style={{ borderColor: 'var(--line)' }}
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <div>
              <Dialog.Title className="text-base font-bold font-serif leading-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description id="drawer-description" className="text-xs opacity-70 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>

            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-[var(--panel)] transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-4 border-t flex-shrink-0 bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

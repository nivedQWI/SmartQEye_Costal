// ============================================================
// SmartQEye Coastal — About Platform Modal Dialog
// Displays product version, git build hash, model bundle, vendor, and support
// ============================================================

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Info, X, Shield, Cpu, Terminal, ExternalLink, Phone, Mail } from 'lucide-react';
import { CENTRAL_DEPLOYMENT_CONFIG } from '@/config/deployment';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const cfg = CENTRAL_DEPLOYMENT_CONFIG;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl p-6 shadow-2xl z-50 animate-in zoom-in-95 border"
          style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 border shadow-xs overflow-hidden flex items-center justify-center" style={{ borderColor: 'var(--line)' }}>
                <img src="/QW_logo.png" alt="Quantumweave" className="w-full h-full object-contain" />
              </div>
              <div>
                <Dialog.Title className="font-serif text-lg font-bold">
                  {cfg.platformName}
                </Dialog.Title>
                <Dialog.Description className="text-xs opacity-60 font-mono">
                  Kerala Police Coastal Surveillance &amp; Maritime Intelligence
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors opacity-70 hover:opacity-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Details Grid */}
          <div className="py-4 space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="opacity-50 block text-[10px] uppercase">Product Version</span>
                <span className="font-bold text-sm">{cfg.productVersion}</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px] uppercase">Build Hash</span>
                <span className="font-bold text-sm text-[var(--sea-600)]">{cfg.buildHash}</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px] uppercase">Model Bundle</span>
                <span className="font-semibold">{cfg.modelBundleVersion}</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px] uppercase">Procurement Ref</span>
                <span className="font-semibold">KSUM RFP §11</span>
              </div>
            </div>

            {/* Vendor & Custodian */}
            <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--line)' }}>
              <div className="font-bold text-[11px] mb-1 text-[var(--text)]">{cfg.vendor}</div>
              <div className="text-[11px] opacity-70 mb-2">{cfg.vendorLocation}</div>
              <div className="text-[10px] opacity-80 pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <span>Dedicated for Kerala Coastal Police / Cyber Division</span>
                <span className="text-emerald-600 font-semibold">Authorized Build</span>
              </div>
            </div>

            {/* Support Desk */}
            <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300">
              <div className="font-bold text-[11px] mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Technical Support &amp; Emergency Operations Desk
              </div>
              <div className="flex items-center gap-4 text-[11px] mt-2">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 opacity-60" /> {cfg.supportContact}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 opacity-60" /> {cfg.emergencyDesk}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t text-[11px] opacity-60 text-center" style={{ borderColor: 'var(--line)' }}>
            Observed behaviour only. Operational interpretation rests with authorised Kerala Police personnel.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default AboutDialog;

// ============================================================
// SmartQEye Coastal — Persistent Coastal Contacts
// Tracks maritime contacts over time with Kerala craft taxonomy and continuity
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Search, Filter, Compass, Clock, Shield,
  Info, ExternalLink, Anchor, ChevronRight, CheckCircle2
} from 'lucide-react';
import { CONTACTS } from '@/lib/mockData';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { cn } from '@/lib/utils';
import type { ContactClass } from '@/types';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const filteredContacts = CONTACTS.filter(contact => {
    const matchesSearch = contact.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.classLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || contact.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const craftClasses = Array.from(new Set(CONTACTS.map(c => c.class)));

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">Persistent Coastal Contacts</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                MULTI-OBJECT TRACKING · BYTETRACK
              </span>
            </div>
            <p className="text-xs opacity-60">
              Persistent tracking &amp; cross-sortie re-identification across Thiruvananthapuram coastal jurisdiction
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              placeholder="Search contact ID or craft..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border text-xs font-mono w-56 focus:outline-hidden focus:ring-1 focus:ring-[var(--sea-600)]"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
            />
          </div>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium focus:outline-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="ALL">All Craft Classes</option>
            {craftClasses.map(cls => (
              <option key={cls} value={cls}>{cls.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Metric Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Active Tracked Contacts</span>
            <span className="text-2xl font-serif font-bold text-[var(--sea-600)]">{CONTACTS.length}</span>
            <span className="text-[11px] opacity-60 block mt-1">Across 6 UAV sectors</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">High Continuity (&gt;85%)</span>
            <span className="text-2xl font-serif font-bold text-emerald-600">
              {CONTACTS.filter(c => c.continuityConf > 0.85).length}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Confirmed persistent tracks</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Linked Attention Events</span>
            <span className="text-2xl font-serif font-bold text-amber-600">
              {CONTACTS.filter(c => (c.linkedAlertIds ?? []).length > 0).length}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Associative behaviour alerts</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Kerala Indigenous Craft</span>
            <span className="text-2xl font-serif font-bold text-cyan-600">
              {CONTACTS.filter(c => ['MOTORISED_COUNTRY_CRAFT', 'TRADITIONAL_WOODEN_CRAFT', 'CANOE_CATAMARAN'].includes(c.class)).length}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Recognised artisanal fleet</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-[10px] font-mono uppercase opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                <th className="py-3 px-4 font-bold">Contact Code</th>
                <th className="py-3 px-4 font-bold">Classification (Kerala Taxonomy)</th>
                <th className="py-3 px-4 font-bold">Class Conf.</th>
                <th className="py-3 px-4 font-bold">Track Continuity</th>
                <th className="py-3 px-4 font-bold">Speed / Heading</th>
                <th className="py-3 px-4 font-bold">Last Observed</th>
                <th className="py-3 px-4 font-bold">Alert Links</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredContacts.map(contact => (
                <tr
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[var(--sea-600)]">
                    {contact.code}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold block">{contact.classLabel}</span>
                    <span className="text-[10px] opacity-50 font-mono">{contact.class}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${Math.round(contact.classConf * 100)}%` }}
                        />
                      </div>
                      <span>{Math.round(contact.classConf * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.round(contact.continuityConf * 100)}%` }}
                        />
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {Math.round(contact.continuityConf * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {contact.lastSpeedKnots ? (
                      <span>{contact.lastSpeedKnots.toFixed(1)} kn · {contact.lastHeadingDeg}°</span>
                    ) : (
                      <span className="opacity-40">Stationary / Shore</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] opacity-70">
                    {new Date(contact.lastSeenAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
                  </td>
                  <td className="py-3 px-4">
                    {(contact.linkedAlertIds ?? []).length > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {(contact.linkedAlertIds ?? []).length} Linked
                      </span>
                    ) : (
                      <span className="text-[11px] opacity-40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[var(--sea-600)] font-semibold inline-flex items-center gap-1 group-hover:underline">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Human in the Loop Footer */}
        <HumanInterpretationNote />
      </div>
    </div>
  );
}

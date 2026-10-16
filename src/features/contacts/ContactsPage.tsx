// ============================================================
// SmartQEye Coastal — Persistent Coastal Contacts (Proposal 5.1.8, 5.1.15)
// Tracks maritime contacts over time with Kerala craft taxonomy, ByteTrack continuity & attention
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Search, Filter, Compass, Clock, Shield,
  Info, ExternalLink, Anchor, ChevronRight, CheckCircle2,
  AlertTriangle, Eye, Video, ArrowUpDown
} from 'lucide-react';
import { CONTACTS } from '@/lib/mockData';
import { AttentionBadge } from '@/components/AttentionBadge';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { cn } from '@/lib/utils';
import type { ContactClass, AttentionLevel } from '@/types';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedAttention, setSelectedAttention] = useState<string>('ALL');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [selectedUav, setSelectedUav] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'lastSeen' | 'dwell' | 'attention' | 'continuity'>('attention');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const craftClasses = useMemo(() => Array.from(new Set(CONTACTS.map(c => c.class))), []);

  const filteredContacts = useMemo(() => {
    return CONTACTS.filter(contact => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        contact.code.toLowerCase().includes(q) ||
        contact.classLabel.toLowerCase().includes(q) ||
        (contact.fineGrainedType && contact.fineGrainedType.toLowerCase().includes(q));

      const matchesClass = selectedClass === 'ALL' || contact.class === selectedClass;
      const matchesAttention = selectedAttention === 'ALL' || contact.attentionLevel === selectedAttention;
      const matchesModality = selectedModality === 'ALL' ||
        contact.modalitySeen === selectedModality ||
        (selectedModality !== 'ALL' && contact.modalitySeen === 'BOTH');
      const matchesUav = selectedUav === 'ALL' || contact.observedUavs?.includes(selectedUav);

      return matchesSearch && matchesClass && matchesAttention && matchesModality && matchesUav;
    }).sort((a, b) => {
      let diff = 0;
      if (sortBy === 'lastSeen') {
        diff = new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
      } else if (sortBy === 'dwell') {
        diff = (b.dwellTotalSec ?? 0) - (a.dwellTotalSec ?? 0);
      } else if (sortBy === 'continuity') {
        diff = b.continuityConf - a.continuityConf;
      } else if (sortBy === 'attention') {
        const rank: Record<AttentionLevel, number> = { CRITICAL: 4, ATTENTION: 3, MONITOR: 2, RECORD_ONLY: 1 };
        diff = (rank[b.attentionLevel ?? 'RECORD_ONLY'] ?? 0) - (rank[a.attentionLevel ?? 'RECORD_ONLY'] ?? 0);
      }
      return sortDir === 'asc' ? -diff : diff;
    });
  }, [searchTerm, selectedClass, selectedAttention, selectedModality, selectedUav, sortBy, sortDir]);

  // KPI Calculations
  const criticalAttentionCount = CONTACTS.filter(c => c.attentionLevel === 'CRITICAL' || c.attentionLevel === 'ATTENTION').length;
  const highContinuityCount = CONTACTS.filter(c => c.continuityConf > 0.85).length;
  const multiSortieCount = CONTACTS.filter(c => (c.pastMissions?.length ?? 0) > 0 || (c.observedUavs?.length ?? 0) > 1).length;

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
                MULTI-OBJECT TRACKING · BYTETRACK + KALMAN
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                PROPOSAL 5.1.8 &amp; 5.1.15
              </span>
            </div>
            <p className="text-xs opacity-60">
              Persistent tracking, kinematic extrapolation &amp; cross-sortie re-identification across Thiruvananthapuram coastal jurisdiction
            </p>
          </div>
        </div>

        {/* Global Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder="Search contact ID, class, hull..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-lg border text-xs font-mono w-64 focus:outline-hidden focus:ring-1 focus:ring-[var(--sea-600)]"
            style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-6 py-2.5 border-b flex-shrink-0 flex items-center justify-between gap-4 overflow-x-auto" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1 font-bold">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Attention Level Filter */}
          <select
            value={selectedAttention}
            onChange={e => setSelectedAttention(e.target.value)}
            className="px-2.5 py-1 rounded-md border text-xs font-semibold focus:outline-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="ALL">All Attention Levels</option>
            <option value="CRITICAL">● CRITICAL</option>
            <option value="ATTENTION">◑ ATTENTION</option>
            <option value="MONITOR">◔ MONITOR</option>
            <option value="RECORD_ONLY">○ RECORD ONLY</option>
          </select>

          {/* Craft Class Filter */}
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-2.5 py-1 rounded-md border text-xs font-medium focus:outline-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="ALL">All Craft Classes</option>
            {craftClasses.map(cls => (
              <option key={cls} value={cls}>{cls.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {/* Modality Filter */}
          <select
            value={selectedModality}
            onChange={e => setSelectedModality(e.target.value)}
            className="px-2.5 py-1 rounded-md border text-xs font-mono focus:outline-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="ALL">All Modalities</option>
            <option value="RGB">RGB Only</option>
            <option value="THERMAL">Thermal Only</option>
            <option value="BOTH">Dual Modality (RGB+Thermal)</option>
          </select>

          {/* UAV Filter */}
          <select
            value={selectedUav}
            onChange={e => setSelectedUav(e.target.value)}
            className="px-2.5 py-1 rounded-md border text-xs font-mono focus:outline-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="ALL">All Observing UAVs</option>
            <option value="UAV-KL-01">UAV-KL-01 (Kovalam)</option>
            <option value="UAV-KL-02">UAV-KL-02 (Trivandrum)</option>
            <option value="UAV-KL-03">UAV-KL-03 (Vizhinjam)</option>
            <option value="UAV-KL-04">UAV-KL-04 (Valiyathura)</option>
            <option value="UAV-KL-05">UAV-KL-05 (Poovar)</option>
            <option value="UAV-KL-06">UAV-KL-06 (Shanghumugham)</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-1 font-bold">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 rounded-md border text-xs font-medium focus:outline-hidden"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <option value="attention">Operational Attention</option>
            <option value="lastSeen">Last Observed</option>
            <option value="dwell">Total Dwell Time</option>
            <option value="continuity">Continuity Conf.</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 rounded-md border text-xs font-mono hover:bg-[var(--surface-hover)]"
            style={{ borderColor: 'var(--line)' }}
            title="Toggle sort direction"
          >
            {sortDir.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Metric Overview Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Active Tracked Contacts</span>
            <span className="text-2xl font-serif font-bold text-[var(--sea-600)]">{CONTACTS.length}</span>
            <span className="text-[11px] opacity-60 block mt-1">Simultaneous multi-target ByteTrack</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Critical / High Attention</span>
            <span className="text-2xl font-serif font-bold text-red-600 dark:text-red-400">
              {criticalAttentionCount}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Requiring immediate operational watch</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Confirmed Continuity (&gt;85%)</span>
            <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {highContinuityCount}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Persistent Kalman &amp; appearance tracks</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Multi-Sortie / Cross-UAV Persistent</span>
            <span className="text-2xl font-serif font-bold text-cyan-600 dark:text-cyan-400">
              {multiSortieCount}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Cross-mission historical correlation</span>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="rounded-xl border overflow-hidden shadow-xs" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-[10px] font-mono uppercase opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                <th className="py-3 px-4 font-bold">Contact ID</th>
                <th className="py-3 px-4 font-bold">Kerala Craft Taxonomy</th>
                <th className="py-3 px-4 font-bold">Operational Attention</th>
                <th className="py-3 px-4 font-bold">Class Conf.</th>
                <th className="py-3 px-4 font-bold">Continuity</th>
                <th className="py-3 px-4 font-bold">Dwell Time</th>
                <th className="py-3 px-4 font-bold">Last Observed</th>
                <th className="py-3 px-4 font-bold">Sensor Modality</th>
                <th className="py-3 px-4 font-bold">Observing UAV</th>
                <th className="py-3 px-4 font-bold text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredContacts.map(contact => {
                const isC1042 = contact.code === 'C-1042';
                const dwellMinutes = Math.floor((contact.dwellTotalSec ?? 0) / 60);
                const dwellSeconds = (contact.dwellTotalSec ?? 0) % 60;

                return (
                  <tr
                    key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    className={cn(
                      'hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group',
                      isC1042 && 'bg-red-50/40 dark:bg-red-950/20'
                    )}
                  >
                    {/* Contact ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[var(--sea-600)] text-sm">
                          {contact.code}
                        </span>
                        {isC1042 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-600 text-white animate-pulse">
                            ACTIVE TARGET
                          </span>
                        )}
                        {contact.occlusionEvent && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300" title="Occlusion recovery event">
                            OCCLUDED 48s
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-semibold block text-[13px]">{contact.classLabel}</span>
                          {contact.isBroadClass ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mt-0.5" title={contact.broadClassReason}>
                              BROAD CLASS (Stand-off &gt;140m)
                            </span>
                          ) : (
                            <span className="text-[10px] opacity-50 font-mono">{contact.class}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Attention Level */}
                    <td className="py-3 px-4">
                      <AttentionBadge
                        level={contact.attentionLevel ?? 'RECORD_ONLY'}
                        factors={contact.attentionFactors}
                        size="sm"
                        showWhyButton={true}
                      />
                    </td>

                    {/* Class Conf */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${Math.round(contact.classConf * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px]">{Math.round(contact.classConf * 100)}%</span>
                      </div>
                    </td>

                    {/* Continuity Conf */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              contact.continuityConf > 0.85 ? 'bg-emerald-500' : contact.continuityConf > 0.70 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${Math.round(contact.continuityConf * 100)}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-[11px] font-semibold',
                          contact.continuityConf > 0.85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        )}>
                          {Math.round(contact.continuityConf * 100)}%
                        </span>
                      </div>
                    </td>

                    {/* Dwell */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {dwellMinutes}m {dwellSeconds}s
                    </td>

                    {/* Last Observed */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="block font-medium">
                        {new Date(contact.lastSeenAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
                      </span>
                      <span className="text-[10px] opacity-50">
                        {contact.lastSpeedKnots ? `${contact.lastSpeedKnots.toFixed(1)} kn · ${contact.lastHeadingDeg}°` : 'Stationary'}
                      </span>
                    </td>

                    {/* Modality */}
                    <td className="py-3 px-4 font-mono">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border',
                        contact.modalitySeen === 'BOTH'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : contact.modalitySeen === 'THERMAL'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                      )}>
                        {contact.modalitySeen ?? 'RGB'}
                      </span>
                    </td>

                    {/* Observed UAVs */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(contact.observedUavs ?? ['UAV-KL-03']).map(uav => (
                          <span key={uav} className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--sea-700)] dark:text-[var(--sea-300)] border border-[var(--line)] text-[10px]">
                            {uav}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contacts/${contact.id}`);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold text-[var(--sea-600)] dark:text-[var(--sea-400)] hover:bg-[var(--surface-hover)] border border-[var(--line)] inline-flex items-center gap-1 group-hover:border-[var(--sea-600)] transition-colors"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Human in the loop legal note */}
        <HumanInterpretationNote />
      </div>
    </div>
  );
}

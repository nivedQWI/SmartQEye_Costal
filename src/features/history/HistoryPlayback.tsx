// ============================================================
// SmartQEye Coastal — History & Playback (/history)
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, List, Map, Clock, Filter, Video } from 'lucide-react';
import { eventsApi } from '@/lib/api';
import type { EventFilters } from '@/lib/api';
import { cn, formatIST, formatISTFull, eventTypeLabel, formatCoords } from '@/lib/utils';
import { SeverityChip } from '@/components/SeverityChip';
import { ModalityChip } from '@/components/FeedStateChip';
import { CoastalMap } from '@/components/CoastalMap';
import { DroneVideoPlayer } from '@/components/DroneVideoPlayer';
import type { CoastalEvent } from '@/types';

type ViewMode = 'list' | 'map' | 'timeline' | 'playback';

// ─── Facet filters ────────────────────────────────────────────

const EVENT_TYPES = [
  'intrusion', 'zone_entry', 'zone_dwell_exceeded', 'repeated_shoreline_approach',
  'loitering', 'crowd_threshold_exceeded', 'convergence', 'vessel_detected',
  'person_detected', 'vehicle_detected', 'course_speed_change',
];

interface FacetSidebarProps {
  filters: EventFilters;
  onChange: (f: EventFilters) => void;
}

function FacetSidebar({ filters, onChange }: FacetSidebarProps) {
  function toggle(key: keyof EventFilters, value: string) {
    const current = (filters[key] as string[]) ?? [];
    const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  return (
    <div className="w-56 flex-shrink-0 border-r overflow-y-auto" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="p-3 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Filter className="w-3.5 h-3.5 opacity-50" /> Filters
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Date range */}
        <div>
          <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">Date Range</div>
          <div className="space-y-1.5">
            <input
              type="date"
              className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
              onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
            />
            <input
              type="date"
              className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none"
              style={{ background: 'var(--raised)', borderColor: 'var(--line)', color: 'var(--text)' }}
              onChange={e => onChange({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        {/* UAV */}
        <div>
          <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">UAV</div>
          <div className="space-y-1">
            {['UAV-01', 'UAV-02', 'UAV-03', 'UAV-04', 'UAV-05', 'UAV-06'].map(code => (
              <label key={code} className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                <input
                  type="checkbox"
                  checked={filters.uavCode === code}
                  onChange={() => onChange({ ...filters, uavCode: filters.uavCode === code ? undefined : code })}
                  style={{ accentColor: 'var(--sea-600)' }}
                />
                <span className="font-mono">{code}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Event types */}
        <div>
          <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">Event Type</div>
          <div className="space-y-1">
            {EVENT_TYPES.map(et => (
              <label key={et} className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                <input
                  type="checkbox"
                  checked={filters.eventType?.includes(et) ?? false}
                  onChange={() => toggle('eventType', et)}
                  style={{ accentColor: 'var(--sea-600)' }}
                />
                <span className="truncate">{eventTypeLabel(et)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Modality */}
        <div>
          <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-2">Modality</div>
          <div className="space-y-1">
            {['RGB', 'THERMAL'].map(m => (
              <label key={m} className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80">
                <input
                  type="checkbox"
                  checked={filters.modality?.includes(m) ?? false}
                  onChange={() => toggle('modality', m)}
                  style={{ accentColor: 'var(--sea-600)' }}
                />
                <span className="font-mono">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          className="w-full py-1.5 text-xs rounded-lg border opacity-60 hover:opacity-100 transition-opacity"
          style={{ borderColor: 'var(--line)' }}
          onClick={() => onChange({})}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

// ─── Event row ────────────────────────────────────────────────

function EventRow({ event, onClick }: { event: CoastalEvent; onClick: () => void }) {
  return (
    <tr
      className="border-b cursor-pointer hover:bg-[var(--sand-100)] dark:hover:bg-[var(--raised)] transition-colors"
      style={{ borderColor: 'var(--line)' }}
      onClick={onClick}
    >
      <td className="pl-4 pr-3 py-2.5 w-28 whitespace-nowrap">
        <span className="font-mono text-xs tabular" style={{ color: 'var(--text-muted)' }}>
          {formatIST(event.occurredAt)}
        </span>
      </td>
      <td className="pr-3 py-2.5">
        <div className="text-sm font-medium">{eventTypeLabel(event.type)}</div>
        {event.zone && <div className="text-xs opacity-50 truncate max-w-[200px]">{event.zone.name}</div>}
      </td>
      <td className="pr-3 py-2.5 w-20">
        <span className="font-mono text-xs">{event.uav.code}</span>
      </td>
      <td className="pr-3 py-2.5 w-20">
        {event.contact && <span className="font-mono text-xs" style={{ color: 'var(--sea-accent)' }}>{event.contact.code}</span>}
      </td>
      <td className="pr-3 py-2.5 w-16">
        {event.modality && <ModalityChip modality={event.modality} size="sm" />}
      </td>
      <td className="pr-4 py-2.5 w-20 text-xs font-mono opacity-50">
        {formatCoords(event.location.lat, event.location.lon).split(' ')[0]}
      </td>
    </tr>
  );
}

// ─── Timeline view ────────────────────────────────────────────

function TimelineView({ events }: { events: CoastalEvent[] }) {
  const grouped = events.slice(0, 50).reduce((acc, ev) => {
    const hour = new Date(ev.occurredAt).toISOString().slice(0, 13) + ':00';
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(ev);
    return acc;
  }, {} as Record<string, CoastalEvent[]>);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([hour, evs]) => (
        <div key={hour}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 opacity-40" />
            <span className="text-xs font-mono opacity-50">{formatIST(hour + ':00Z')}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--sand-200)', color: 'var(--ink-800)' }}>
              {evs.length} events
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          </div>
          <div className="relative pl-5 space-y-2">
            <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: 'var(--line)' }} />
            {evs.map(ev => (
              <div key={ev.id} className="relative flex items-start gap-2">
                <div
                  className="absolute -left-[14px] w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: 'var(--sea-400)' }}
                />
                <div className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--raised)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">{eventTypeLabel(ev.type)}</span>
                    {ev.modality && <ModalityChip modality={ev.modality} size="sm" />}
                    <span className="ml-auto font-mono opacity-50">{ev.uav.code}</span>
                  </div>
                  {ev.contact && (
                    <span className="font-mono" style={{ color: 'var(--sea-accent)' }}>{ev.contact.code}</span>
                  )}
                  {ev.zone && <span className="opacity-50 ml-2">{ev.zone.name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── History page ─────────────────────────────────────────────

export default function HistoryPlayback() {
  const [filters, setFilters] = useState<EventFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<CoastalEvent | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', filters, page],
    queryFn: () => eventsApi.list({ ...filters, page, pageSize: 50 }),
  });

  const events = data?.items ?? [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Facet sidebar */}
      <FacetSidebar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b flex-shrink-0" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-1 max-w-sm" style={{ borderColor: 'var(--line)', background: 'var(--raised)' }}>
            <Search className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search events, contacts, zones…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: 'var(--text)' }}
            />
          </div>

          {/* View mode */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
            {([
              ['list', <List key="list" className="w-3.5 h-3.5" />],
              ['playback', <Video key="playback" className="w-3.5 h-3.5" />],
              ['map', <Map key="map" className="w-3.5 h-3.5" />],
              ['timeline', <Clock key="timeline" className="w-3.5 h-3.5" />]
            ] as const).map(([mode, icon]) => (
              <button
                key={mode}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors', viewMode === mode ? 'text-white' : 'opacity-50')}
                style={{ background: viewMode === mode ? 'var(--sea-600)' : 'var(--raised)' }}
                onClick={() => setViewMode(mode)}
              >
                {icon}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>

          <span className="text-xs opacity-50 ml-auto">{data?.total ?? 0} events</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 gap-2" style={{ color: 'var(--text-muted)' }}>
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Loading events…
            </div>
          ) : viewMode === 'playback' ? (
            <div className="flex h-full overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 bg-black">
                <DroneVideoPlayer
                  sceneName="vizhinjam_patrol"
                  initialModality={selectedEvent?.modality ?? 'RGB'}
                  highlightContactId={selectedEvent?.contact?.code}
                  className="flex-1 w-full h-full"
                />
              </div>
              <div className="w-80 flex-shrink-0 border-l p-4 overflow-y-auto space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                  <h3 className="font-serif text-sm font-bold">Forensic Playback Record</h3>
                  <span className="font-mono text-xs text-[var(--sea-accent)] font-bold">{selectedEvent?.id ?? 'HIST-REC-01'}</span>
                </div>
                {selectedEvent ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-medium opacity-60 uppercase tracking-wider mb-1">Event Type</div>
                      <div className="font-semibold text-sm">{eventTypeLabel(selectedEvent.type)}</div>
                    </div>
                    <div>
                      <div className="font-medium opacity-60 uppercase tracking-wider mb-1">Timestamp (IST)</div>
                      <div className="font-mono">{formatISTFull(selectedEvent.occurredAt)}</div>
                    </div>
                    <div>
                      <div className="font-medium opacity-60 uppercase tracking-wider mb-1">UAV &amp; Mission</div>
                      <div className="font-mono">{selectedEvent.uav.code} · {selectedEvent.mission.code}</div>
                    </div>
                    {selectedEvent.contact && (
                      <div>
                        <div className="font-medium opacity-60 uppercase tracking-wider mb-1">Persistent Coastal Contact</div>
                        <div className="font-mono font-bold text-[var(--sea-accent)]">{selectedEvent.contact.code}</div>
                      </div>
                    )}
                    {selectedEvent.zone && (
                      <div>
                        <div className="font-medium opacity-60 uppercase tracking-wider mb-1">Zone Context</div>
                        <div className="font-mono">{selectedEvent.zone.code} ({selectedEvent.zone.name})</div>
                        <div className="opacity-60 text-[11px] mt-0.5">Profile: {selectedEvent.zone.profile}</div>
                      </div>
                    )}
                    <div>
                      <div className="font-medium opacity-60 uppercase tracking-wider mb-1">GPS Coordinates</div>
                      <div className="font-mono">{formatCoords(selectedEvent.location.lat, selectedEvent.location.lon)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs opacity-60 text-center py-6">
                    Select an event from the list to synchronize forensic playback with contact and zone overlays.
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'timeline' ? (
            <TimelineView events={events} />
          ) : viewMode === 'map' ? (
            <CoastalMap height="100%" className="h-full" />
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider border-b sticky top-0 z-10" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--text-muted)' }}>
                      <th className="pl-4 pr-3 py-2 w-28">Time (IST)</th>
                      <th className="pr-3 py-2">Event / Zone</th>
                      <th className="pr-3 py-2 w-20">UAV</th>
                      <th className="pr-3 py-2 w-20">Contact</th>
                      <th className="pr-3 py-2 w-16">Modality</th>
                      <th className="pr-4 py-2 w-20">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <EventRow key={ev.id} event={ev} onClick={() => { setSelectedEvent(ev); setViewMode('playback'); }} />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-2 border-t text-xs flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Page {page} · {events.length} of {data?.total} events
                </span>
                <div className="flex gap-1">
                  <button className="px-2.5 py-1 rounded border disabled:opacity-30 hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--line)' }} disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>←</button>
                  <button className="px-2.5 py-1 rounded border disabled:opacity-30 hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--line)' }} disabled={!data || page * 50 >= data.total} onClick={() => setPage(p => p + 1)}>→</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

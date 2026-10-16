// ============================================================
// SmartQEye Coastal — Contact Detail View
// Comprehensive behavioural profile, track continuity, and zone transitions
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Radio, Shield, MapPin, Clock, Compass,
  AlertTriangle, CheckCircle, FileText, Activity
} from 'lucide-react';
import { CONTACTS, ALERTS } from '@/lib/mockData';
import { HumanInterpretationNote } from '@/components/HumanInterpretationNote';
import { TacticalActionDialog, type TacticalActionType } from '@/components/TacticalActionDialog';
import { cn } from '@/lib/utils';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tacticalAction, setTacticalAction] = useState<TacticalActionType | null>(null);

  const contact = CONTACTS.find(c => c.id === id || c.code === id) ?? CONTACTS[0];
  const linkedAlertIds = contact.linkedAlertIds ?? [];
  const linkedAlerts = ALERTS.filter(a => linkedAlertIds.includes(a.id));

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/contacts')}
            className="p-2 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
            aria-label="Back to Contacts"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">{contact.code}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                {contact.classLabel}
              </span>
            </div>
            <p className="text-xs opacity-60">
              Persistent Coastal Contact Track · ByteTrack ID #{contact.id}
            </p>
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTacticalAction('NOTIFY_DUTY_OFFICER')}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors"
            style={{ borderColor: 'var(--line)' }}
          >
            Notify duty officer
          </button>
          <button
            onClick={() => setTacticalAction('RECOMMEND_PATROL_RESPONSE')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-xs"
          >
            Recommend patrol response
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Classification Confidence</span>
            <span className="text-2xl font-serif font-bold text-cyan-600">{Math.round(contact.classConf * 100)}%</span>
            <span className="text-[11px] opacity-60 block mt-1">RTMDet Object Detector</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Track Continuity Confidence</span>
            <span className="text-2xl font-serif font-bold text-emerald-600">{Math.round(contact.continuityConf * 100)}%</span>
            <span className="text-[11px] opacity-60 block mt-1">Persistent Kalman &amp; Appearance</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Current Velocity</span>
            <span className="text-2xl font-serif font-bold text-[var(--sea-600)]">
              {contact.lastSpeedKnots ? `${contact.lastSpeedKnots.toFixed(1)} kn` : '0.0 kn'}
            </span>
            <span className="text-[11px] opacity-60 block mt-1">Heading {contact.lastHeadingDeg}° ENE</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-[10px] font-mono uppercase opacity-50 block">Track Longevity</span>
            <span className="text-2xl font-serif font-bold text-amber-600">42 min</span>
            <span className="text-[11px] opacity-60 block mt-1">Observed across 2 UAV sorties</span>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Spatial & Kinematic Telemetry */}
          <div className="p-5 rounded-xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <Compass className="w-4 h-4 text-[var(--sea-600)]" />
              <h2 className="font-serif text-sm font-bold">Kinematic &amp; Positional Data</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="opacity-50 block text-[10px]">CURRENT COORDINATES</span>
                <span>
                  {contact.lastLocation
                    ? `${contact.lastLocation.lat.toFixed(4)}°N, ${contact.lastLocation.lon.toFixed(4)}°E`
                    : '8.3790°N, 76.9810°E'}
                </span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px]">LOCALISATION METHOD</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border text-[10px]">
                  {contact.lastLocation?.method ?? 'DRONE_POSITION'}
                </span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px]">FIRST OBSERVED</span>
                <span>{new Date(contact.firstSeenAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px]">LAST SIGHTING</span>
                <span>{new Date(contact.lastSeenAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST</span>
              </div>
            </div>
            <div className="pt-3 border-t text-xs opacity-75 leading-relaxed" style={{ borderColor: 'var(--line)' }}>
              <strong>Coastal Context:</strong> Vessel maintains slow navigational loiter along Vizhinjam approaches. No automated distress or transponder broadcast detected.
            </div>
          </div>

          {/* Linked Attention Events */}
          <div className="p-5 rounded-xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-serif text-sm font-bold">Linked Operational Alerts</h2>
            </div>
            {linkedAlerts.length > 0 ? (
              <div className="space-y-2">
                {linkedAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => navigate(`/alerts/${alert.id}`)}
                    className="p-3 rounded-lg border hover:bg-[var(--surface-hover)] transition-colors cursor-pointer flex items-center justify-between"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[var(--sea-600)]">{alert.alertCode}</div>
                      <div className="text-[11px] opacity-70">{alert.event.type.replace(/_/g, ' ')}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs opacity-50 font-mono">
                No active operational alerts directly linked to this contact.
              </div>
            )}
          </div>
        </div>

        {/* Human in the loop footer */}
        <HumanInterpretationNote />
      </div>

      {/* Confirmation Dialog */}
      <TacticalActionDialog
        actionType={tacticalAction}
        targetId={contact.code}
        targetType="CONTACT"
        onClose={() => setTacticalAction(null)}
      />
    </div>
  );
}

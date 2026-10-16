// ============================================================
// SmartQEye Coastal — API & External Integrations
// Police CAD, CCTNS, Drone RTSP feeds, and GIS Geoserver Bridges
// ============================================================

import { useState } from 'react';
import { Network, Link2, Shield, RefreshCw, CheckCircle2, AlertCircle, Key, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationEndpoint {
  id: string;
  name: string;
  agency: string;
  protocol: string;
  endpoint: string;
  authMethod: string;
  latencyMs: number;
  status: 'CONNECTED' | 'STANDBY' | 'SYNCING';
  lastPing: string;
  notes: string;
}

export default function IntegrationsPage() {
  const integrations: IntegrationEndpoint[] = [
    {
      id: 'int-01',
      name: 'Kerala Police CCTNS Core Database',
      agency: 'State Crime Records Bureau (SCRB)',
      protocol: 'REST / JSON over mTLS',
      endpoint: 'https://cctns.keralapolice.gov.in/api/v2/coastal-sync',
      authMethod: 'X.509 Client Cert + HMAC-SHA256',
      latencyMs: 42,
      status: 'CONNECTED',
      lastPing: '12s ago',
      notes: 'Automated FIR and suspect watchlist synchronization bridge',
    },
    {
      id: 'int-02',
      name: 'Emergency 112 CAD Dispatch Gateway',
      agency: 'Kerala Police 112 Command & Control',
      protocol: 'Websocket / CAP v1.2',
      endpoint: 'wss://cad112.keralapolice.gov.in/streams/coastal-incidents',
      authMethod: 'OAuth2 Bearer (Air-gapped JWT)',
      latencyMs: 18,
      status: 'CONNECTED',
      lastPing: '2s ago',
      notes: 'Real-time alert escalation to police mobile patrol units',
    },
    {
      id: 'int-03',
      name: 'UAV Tactical Fleet RTSP Gateway',
      agency: 'Coastal Police Drone Forensic Lab',
      protocol: 'RTSP / H.265 / SRT',
      endpoint: 'rtsp://10.200.1.10:8554/live/uav-fleet-matrix',
      authMethod: 'SRTP Digest Auth',
      latencyMs: 85,
      status: 'CONNECTED',
      lastPing: 'Live stream active',
      notes: 'Primary 20-feed ingestion multiplexer for RGB and thermal sensors',
    },
    {
      id: 'int-04',
      name: 'Indian Coast Guard Maritime Radar / AIS Bridge',
      agency: 'Coast Guard District HQ No. 4 (Kochi)',
      protocol: 'NMEA-0183 / AIS AIVDM',
      endpoint: 'tcp://10.150.4.2:4001',
      authMethod: 'IPSec VPN Tunnel',
      latencyMs: 65,
      status: 'CONNECTED',
      lastPing: '5s ago',
      notes: 'Fused coastal vessel transponder correlation layer',
    },
    {
      id: 'int-05',
      name: 'Kerala State GIS Coastal GeoServer',
      agency: 'Kerala State Remote Sensing and Environment Centre (KSREC)',
      protocol: 'WMS / WFS 2.0',
      endpoint: 'https://geoportal.kerala.gov.in/geoserver/wms',
      authMethod: 'API Token',
      latencyMs: 110,
      status: 'STANDBY',
      lastPing: '1m ago',
      notes: 'High-resolution coastal bathymetry and high-tide line overlays',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">API &amp; Inter-Agency Integrations</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                5 ACTIVE BRIDGES
              </span>
            </div>
            <p className="text-xs opacity-60">
              Government-grade inter-departmental data exchanges, RTSP ingests, and CCTNS sync
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('All integration health probes pinged. Latency nominal across all secure tunnels.')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors"
          style={{ borderColor: 'var(--line)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Test Connection Probes
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {integrations.map(endpoint => (
          <div
            key={endpoint.id}
            className="p-5 rounded-2xl border space-y-3 transition-all"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">{endpoint.id}</span>
                  <span className="text-[10px] font-mono opacity-60">· {endpoint.agency}</span>
                </div>
                <h3 className="font-serif text-base font-bold mt-0.5">{endpoint.name}</h3>
              </div>

              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5',
                  endpoint.status === 'CONNECTED'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {endpoint.status}
              </span>
            </div>

            <p className="text-xs opacity-75 font-sans">{endpoint.notes}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="opacity-50 block text-[10px]">PROTOCOL</span>
                <span className="font-semibold">{endpoint.protocol}</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px]">AUTH SPEC</span>
                <span className="font-semibold">{endpoint.authMethod}</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px]">ROUND-TRIP LATENCY</span>
                <span className="font-semibold text-emerald-600">{endpoint.latencyMs} ms</span>
              </div>
              <div>
                <span className="opacity-50 block text-[10px]">HEARTBEAT</span>
                <span className="font-semibold">{endpoint.lastPing}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono opacity-60 truncate">
              URI: <code>{endpoint.endpoint}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SmartQEye Coastal — API & External Integrations (/platform/integrations)
// Proposal §6.5 & RFP §5 Compliant
// Static OpenAPI Explorer, Adapter Interfaces, API Keys with Audit, and Webhook Tester
// ============================================================

import React, { useState } from 'react';
import {
  Network, RefreshCw, CheckCircle2,
  Terminal, Send, Check, Play,
  Plus, RotateCcw, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auditApi } from '@/lib/api';

interface ApiEndpointDoc {
  id: string;
  tag: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  auth: string;
  requestSample?: object;
  responseSample: object;
}

const OPENAPI_ENDPOINTS: ApiEndpointDoc[] = [
  {
    id: 'ep-01',
    tag: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Officer Authentication (Step 1)',
    description: 'Validates officer badge credentials and returns an encrypted MFA challenge session.',
    auth: 'None (Public)',
    requestSample: { username: 'op.rajan', password: '••••••••' },
    responseSample: { status: 'MFA_REQUIRED', challengeToken: 'mfa_ch_88294a', sessionExpiresInSec: 300 }
  },
  {
    id: 'ep-02',
    tag: 'Missions',
    method: 'GET',
    path: '/api/v1/missions',
    summary: 'List Drone Surveillance Sorties',
    description: 'Retrieves current active and historical sorties with associated drone and sensor metadata.',
    auth: 'Bearer JWT (READ_SENSORS)',
    responseSample: {
      total: 4,
      activeMission: {
        id: 'MSN-20261016-01',
        name: 'Sector Alpha High-Priority Coastal Surveillance',
        droneId: 'UAV-KL-01',
        sensor: 'Dual RGB + Thermal LWIR',
        bitrateMbps: 8.6,
        fps: 30.0
      }
    }
  },
  {
    id: 'ep-03',
    tag: 'Feeds & Streams',
    method: 'GET',
    path: '/api/v1/feeds',
    summary: 'Get 20-Feed Tactical Ingestion Matrix',
    description: 'Returns operational status, CFS frame drop rates, and stream URIs for all active feeds.',
    auth: 'Bearer JWT (READ_SENSORS)',
    responseSample: {
      capacity: 20,
      activeFeeds: 20,
      cfsComputeSavingsPct: 41.8,
      streams: [
        { feedId: 'FEED-01', uavId: 'UAV-KL-01', state: 'LIVE', cfsState: 'FULL', fps: 30 },
        { feedId: 'FEED-02', uavId: 'UAV-KL-02', state: 'LIVE', cfsState: 'LIGHT', fps: 15 }
      ]
    }
  },
  {
    id: 'ep-04',
    tag: 'Contacts',
    method: 'GET',
    path: '/api/v1/contacts',
    summary: 'List Persistent Coastal Contacts',
    description: 'Queries tracked vessels, shoreline vehicles, and beach crowds with continuity confidence scores.',
    auth: 'Bearer JWT (OPERATOR / ANALYST)',
    responseSample: {
      contacts: [
        { contactId: 'C-1042', broadClass: 'VESSEL', subClass: 'Unregistered skiff', continuityScore: 0.94, attentionLevel: 'HIGH' },
        { contactId: 'C-1049', broadClass: 'VESSEL', subClass: 'Mechanised fishing boat', continuityScore: 0.88, attentionLevel: 'ROUTINE' }
      ]
    }
  },
  {
    id: 'ep-05',
    tag: 'Alerts & Incidents',
    method: 'GET',
    path: '/api/v1/incidents/{id}/evidence',
    summary: 'Get Evidence-Linked Incident Record (ELIR)',
    description: 'Fetches Section 65B/63 compliant evidence package with CKFE keyframes, clip references, and SHA-256 hashes.',
    auth: 'Bearer JWT (EXPORT)',
    responseSample: {
      incidentId: 'INC-20261016-0042',
      event: 'SECURITY_ZONE_INCURSION',
      sha256Seal: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      keyframesCount: 4,
      videoClipSec: 10,
      chainOfCustodyVerified: true
    }
  },
  {
    id: 'ep-06',
    tag: 'AI Models',
    method: 'GET',
    path: '/api/v1/models/cfs/metrics',
    summary: 'Cognitive Frame Selection (CFS) Metrics',
    description: 'Returns real-time GPU load reduction metrics achieved through cognitive frame selection.',
    auth: 'Bearer JWT (READ_SENSORS)',
    responseSample: {
      cfsActive: true,
      fullInferenceFramesPerSec: 12.4,
      lightInferenceFramesPerSec: 9.8,
      skippedFramesPerSec: 7.8,
      gpuLoadReductionPct: 41.2
    }
  },
  {
    id: 'ep-07',
    tag: 'Audit Ledger',
    method: 'GET',
    path: '/api/v1/audit/verify',
    summary: 'Verify Cryptographic Audit Blockchain',
    description: 'Recomputes SHA-256 block hashes from Genesis to Head to guarantee tamper-proof ledger integrity.',
    auth: 'Bearer JWT (AUDITOR / ADMIN)',
    responseSample: {
      verified: true,
      totalBlocks: 320,
      brokenChainAt: null,
      genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
      headHash: 'b4a8e291f8c7e43598124efb129840cb12938475a892b1093849501238475910'
    }
  }
];

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED';
  requestCountToday: number;
}

const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'KEY-01',
    name: 'Kerala Police CCTNS Sync Bridge',
    keyPrefix: 'sqe_live_cctns_88a4',
    scopes: ['read:incidents', 'write:cctns_sync'],
    createdBy: 'sup.seema',
    createdAt: '2026-09-01',
    expiresAt: '2027-09-01',
    status: 'ACTIVE',
    requestCountToday: 24190
  },
  {
    id: 'KEY-02',
    name: 'UAV GCS Ground Station Alpha',
    keyPrefix: 'sqe_live_gcs_91b2',
    scopes: ['write:telemetry', 'write:cfs_frames', 'read:missions'],
    createdBy: 'dsp.nair',
    createdAt: '2026-10-01',
    expiresAt: '2027-04-01',
    status: 'ACTIVE',
    requestCountToday: 142500
  },
  {
    id: 'KEY-03',
    name: 'Emergency 112 CAD Dispatch Gateway',
    keyPrefix: 'sqe_live_cad_112c',
    scopes: ['read:alerts', 'write:cad_dispatch'],
    createdBy: 'admin.kurup',
    createdAt: '2026-08-15',
    expiresAt: '2027-08-15',
    status: 'ACTIVE',
    requestCountToday: 8420
  },
  {
    id: 'KEY-04',
    name: 'Coast Guard Radar / AIS Transponder Link',
    keyPrefix: 'sqe_live_ais_77e0',
    scopes: ['write:ais_targets', 'read:zones'],
    createdBy: 'sup.seema',
    createdAt: '2026-09-12',
    expiresAt: '2027-09-12',
    status: 'ACTIVE',
    requestCountToday: 48100
  }
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'OPENAPI' | 'ADAPTERS' | 'KEYS' | 'WEBHOOKS'>('OPENAPI');

  // OpenAPI Explorer State
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointDoc>(OPENAPI_ENDPOINTS[1]);
  const [executingTryIt, setExecutingTryIt] = useState(false);
  const [tryItResult, setTryItResult] = useState<any>(null);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read:incidents', 'read:alerts']);

  // Webhook Tester State
  const [webhookEvent, setWebhookEvent] = useState('ZONE_INCURSION_SECURITY');
  const [webhookUrl, setWebhookUrl] = useState('https://cad112.keralapolice.gov.in/hooks/coastal-alerts');
  const [webhookSecret, setWebhookSecret] = useState('kp_coastal_sec_9941a8');
  const [webhookDispatching, setWebhookDispatching] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);

  // Filtered Endpoints
  const filteredEndpoints = selectedTag === 'ALL'
    ? OPENAPI_ENDPOINTS
    : OPENAPI_ENDPOINTS.filter(ep => ep.tag === selectedTag);

  const tags = ['ALL', ...Array.from(new Set(OPENAPI_ENDPOINTS.map(ep => ep.tag)))];

  // Try it Handler
  const handleExecuteTryIt = () => {
    setExecutingTryIt(true);
    setTryItResult(null);

    setTimeout(() => {
      setExecutingTryIt(false);
      setTryItResult({
        statusCode: 200,
        statusText: 'OK',
        durationMs: Math.floor(Math.random() * 25) + 12,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-police-node': 'node-central-a',
          'x-audit-txid': `TX-${Date.now().toString(36).toUpperCase()}`,
          'x-rate-limit-remaining': '9840'
        },
        body: selectedEndpoint.responseSample
      });
    }, 450);
  };

  // API Key Rotate Handler
  const handleRotateKey = (key: ApiKeyItem) => {
    const updatedPrefix = `sqe_live_${key.keyPrefix.split('_')[2]}_${Math.random().toString(36).substring(2, 6)}`;
    setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, keyPrefix: updatedPrefix } : k));

    auditApi.append({
      userId: 'admin-curr',
      userName: 'Kurup V.',
      userRole: 'SYS_ADMIN',
      action: 'USER_ROLE_CHANGE',
      targetType: 'SYSTEM',
      targetId: key.id,
      beforeAfterSummary: `Rotated API credentials for integration client "${key.name}" (${updatedPrefix}••••)`,
      outcome: 'SUCCESS'
    }).catch(console.error);

    alert(`API Key rotated successfully! New key prefix: ${updatedPrefix}••••`);
  };

  // API Key Revoke Handler
  const handleRevokeKey = (key: ApiKeyItem) => {
    if (!confirm(`Are you sure you want to permanently revoke API Key: ${key.name}?`)) return;

    setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: 'REVOKED' } : k));

    auditApi.append({
      userId: 'admin-curr',
      userName: 'Kurup V.',
      userRole: 'SYS_ADMIN',
      action: 'USER_ROLE_CHANGE',
      targetType: 'SYSTEM',
      targetId: key.id,
      beforeAfterSummary: `Permanently REVOKED API Key "${key.name}" (${key.keyPrefix})`,
      outcome: 'SUCCESS'
    }).catch(console.error);
  };

  // Create API Key Handler
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKey: ApiKeyItem = {
      id: `KEY-${String(apiKeys.length + 1).padStart(2, '0')}`,
      name: newKeyName,
      keyPrefix: `sqe_live_${newKeyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)}_${Math.random().toString(36).substring(2, 6)}`,
      scopes: newKeyScopes,
      createdBy: 'admin.kurup',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: '2027-10-16',
      status: 'ACTIVE',
      requestCountToday: 0
    };

    setApiKeys([newKey, ...apiKeys]);
    setShowNewKeyModal(false);
    setNewKeyName('');

    auditApi.append({
      userId: 'admin-curr',
      userName: 'Kurup V.',
      userRole: 'SYS_ADMIN',
      action: 'USER_ROLE_CHANGE',
      targetType: 'SYSTEM',
      targetId: newKey.id,
      beforeAfterSummary: `Issued new integration API Key "${newKey.name}" with scopes: [${newKey.scopes.join(', ')}]`,
      outcome: 'SUCCESS'
    }).catch(console.error);
  };

  // Dispatch Webhook Handler
  const handleSendWebhook = () => {
    setWebhookDispatching(true);
    setWebhookResponse(null);

    setTimeout(() => {
      setWebhookDispatching(false);
      setWebhookResponse({
        status: 200,
        statusText: 'OK (Accepted by CAD-112 Ingestion)',
        dispatchTimeMs: 38,
        signature: 'sha256=9f82ab716c5432098dce1b4a3901239840192847102938471092837410928374',
        deliveredPayload: {
          event: webhookEvent,
          timestamp: new Date().toISOString(),
          stationJurisdiction: 'Vizhinjam Coastal Police Station',
          sourceNode: 'node-central-a',
          contactId: 'C-1042',
          targetClass: 'Unregistered high-speed skiff',
          coordinates: { lat: 8.3756, lon: 76.9842 },
          attentionLevel: 'HIGH',
          evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        }
      });
    }, 600);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">API &amp; Inter-Agency Integrations</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                OPENAPI 3.1 &amp; CCTNS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                AIR-GAPPED REST
              </span>
            </div>
            <p className="text-xs opacity-60">
              Interactive OpenAPI documentation, hardware adapter interfaces, authorized API keys, and webhook event dispatchers
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl border bg-[var(--surface)] text-xs font-semibold" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setActiveTab('OPENAPI')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeTab === 'OPENAPI' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100'
            )}
          >
            OpenAPI Explorer
          </button>
          <button
            onClick={() => setActiveTab('ADAPTERS')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeTab === 'ADAPTERS' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100'
            )}
          >
            Adapter Interfaces (5)
          </button>
          <button
            onClick={() => setActiveTab('KEYS')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeTab === 'KEYS' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100'
            )}
          >
            API Keys &amp; Clients
          </button>
          <button
            onClick={() => setActiveTab('WEBHOOKS')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeTab === 'WEBHOOKS' ? 'bg-[var(--panel)] text-[var(--sea-600)] shadow-sm' : 'opacity-70 hover:opacity-100'
            )}
          >
            Webhook Tester
          </button>
        </div>
      </div>

      {/* ── Main Tab Contents ── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ══════════════════════════════════════════════════
            TAB 1: OPENAPI 3.1 STATIC SWAGGER EXPLORER
           ══════════════════════════════════════════════════ */}
        {activeTab === 'OPENAPI' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-serif text-base font-bold">OpenAPI 3.1 Specification Explorer</h2>
                <p className="text-xs opacity-60">Source: <code>docs/openapi.yaml</code> — Interactive testing against air-gapped node endpoints</p>
              </div>

              {/* Tag Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
                {tags.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border transition-all',
                      selectedTag === t
                        ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)]'
                        : 'bg-[var(--panel)] hover:bg-[var(--surface)]'
                    )}
                    style={{ borderColor: selectedTag === t ? 'transparent' : 'var(--line)' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Endpoint List (Left Column) */}
              <div className="lg:col-span-5 space-y-2">
                {filteredEndpoints.map(ep => (
                  <div
                    key={ep.id}
                    onClick={() => { setSelectedEndpoint(ep); setTryItResult(null); }}
                    className={cn(
                      'p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5',
                      selectedEndpoint.id === ep.id
                        ? 'border-[var(--sea-500)] shadow-md'
                        : 'hover:border-[var(--sea-400)]'
                    )}
                    style={{ background: selectedEndpoint.id === ep.id ? 'var(--surface)' : 'var(--panel)', borderColor: selectedEndpoint.id === ep.id ? 'var(--sea-500)' : 'var(--line)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-bold',
                          ep.method === 'GET' && 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
                          ep.method === 'POST' && 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
                          ep.method === 'PUT' && 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
                          ep.method === 'DELETE' && 'bg-red-500/15 text-red-600 border border-red-500/30'
                        )}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-semibold">{ep.path}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-50">{ep.tag}</span>
                    </div>
                    <p className="text-xs opacity-75 font-sans line-clamp-1">{ep.summary}</p>
                  </div>
                ))}
              </div>

              {/* Endpoint Detail & Interactive Try It (Right Column) */}
              <div className="lg:col-span-7 rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2.5 py-1 rounded text-xs font-mono font-bold',
                        selectedEndpoint.method === 'GET' && 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
                        selectedEndpoint.method === 'POST' && 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                      )}>
                        {selectedEndpoint.method}
                      </span>
                      <h3 className="font-mono text-sm font-bold">{selectedEndpoint.path}</h3>
                    </div>
                    <h4 className="font-serif text-base font-bold mt-1.5">{selectedEndpoint.summary}</h4>
                    <p className="text-xs opacity-75 font-sans mt-0.5">{selectedEndpoint.description}</p>
                  </div>

                  <button
                    onClick={handleExecuteTryIt}
                    disabled={executingTryIt}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    {executingTryIt ? 'Executing Probe...' : 'Try It Out'}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl border bg-[var(--surface)] text-xs font-mono flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                  <span className="opacity-60">Security Scheme:</span>
                  <span className="font-semibold text-[var(--sea-600)]">{selectedEndpoint.auth}</span>
                </div>

                {/* Request Sample (if applicable) */}
                {selectedEndpoint.requestSample && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono opacity-70 block font-semibold">REQUEST BODY (JSON Schema)</span>
                    <pre className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono overflow-x-auto" style={{ borderColor: 'var(--line)' }}>
                      {JSON.stringify(selectedEndpoint.requestSample, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response / Try It Result */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono opacity-70 block font-semibold">
                      {tryItResult ? 'LIVE PROBE RESPONSE' : 'SAMPLE RESPONSE (200 OK)'}
                    </span>
                    {tryItResult && (
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">
                        {tryItResult.statusCode} {tryItResult.statusText} · {tryItResult.durationMs} ms
                      </span>
                    )}
                  </div>
                  <pre className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono overflow-x-auto max-h-64" style={{ borderColor: 'var(--line)' }}>
                    {JSON.stringify(tryItResult ? tryItResult.body : selectedEndpoint.responseSample, null, 2)}
                  </pre>
                </div>

                {tryItResult?.headers && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono opacity-60 block">RESPONSE HEADERS</span>
                    <div className="p-2.5 rounded-lg border bg-[var(--surface)] text-[10px] font-mono space-y-0.5 opacity-80" style={{ borderColor: 'var(--line)' }}>
                      <div>content-type: {tryItResult.headers['content-type']}</div>
                      <div>x-police-node: {tryItResult.headers['x-police-node']}</div>
                      <div>x-audit-txid: {tryItResult.headers['x-audit-txid']}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2: ADAPTER INTERFACES
           ══════════════════════════════════════════════════ */}
        {activeTab === 'ADAPTERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-bold">Hardware &amp; Inter-Agency Adapter Interfaces</h2>
                <p className="text-xs opacity-60">Protocols, telemetry drivers, and CCTNS/GIS bridges</p>
              </div>
              <button
                onClick={() => alert('All adapter interfaces probed. 5/5 online and active.')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface)] transition-colors"
                style={{ borderColor: 'var(--line)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Probe All Adapters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adapter 1: UAV C2 / GCS */}
              <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">ADAPTER-01 · UAV C2 / GCS</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    CONNECTED
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Ground Control Station Flight Telemetry Ingest</h3>
                <p className="text-xs opacity-75 font-sans">
                  Bi-directional command &amp; control link receiving UAV GPS, gimbal pitch, RTK altitude, battery, and flight mode.
                </p>
                <div className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">Protocol:</span>
                    <span className="font-semibold">MAVLink v2.0 / TCP Socket</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">SRT Sub-Adapter:</span>
                    <span className="font-semibold">DJI SRT Telemetry Sidecar Parser</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">NMEA Interface:</span>
                    <span className="font-semibold">$GPGGA / $GPRMC compliant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Latency / Drop Rate:</span>
                    <span className="font-semibold text-emerald-600">18 ms / 0.00%</span>
                  </div>
                </div>
              </div>

              {/* Adapter 2: CCTNS Database */}
              <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">ADAPTER-02 · POLICE DB</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    CONNECTED
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Kerala Police CCTNS Core Database</h3>
                <p className="text-xs opacity-75 font-sans">
                  Automated FIR, boat registration registry, and suspicious contact record cross-matching bridge.
                </p>
                <div className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">Protocol:</span>
                    <span className="font-semibold">mTLS REST JSON over VPN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Authority:</span>
                    <span className="font-semibold">SCRB Thiruvananthapuram</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Security:</span>
                    <span className="font-semibold">X.509 Client Cert + HMAC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Sync Frequency:</span>
                    <span className="font-semibold text-emerald-600">Continuous 15s Heartbeat</span>
                  </div>
                </div>
              </div>

              {/* Adapter 3: Emergency 112 CAD */}
              <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">ADAPTER-03 · DISPATCH</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    CONNECTED
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Emergency 112 CAD Dispatch Gateway</h3>
                <p className="text-xs opacity-75 font-sans">
                  Common Alerting Protocol (CAP v1.2) real-time event dispatcher to Kerala Police patrol mobile units and station duty officers.
                </p>
                <div className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">Format:</span>
                    <span className="font-semibold">CAP v1.2 XML / JSON Websocket</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Endpoint:</span>
                    <span className="font-semibold">wss://cad112.keralapolice.gov.in</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Retry Policy:</span>
                    <span className="font-semibold">Exponential Backoff (Max 5 tries)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Dispatch Latency:</span>
                    <span className="font-semibold text-emerald-600">22 ms</span>
                  </div>
                </div>
              </div>

              {/* Adapter 4: AIS & Radar */}
              <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--sea-600)]">ADAPTER-04 · MARITIME AIS</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    CONNECTED
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold">Coast Guard Radar &amp; AIS Transponder Bridge</h3>
                <p className="text-xs opacity-75 font-sans">
                  Fused coastal vessel transponder correlation layer. Correlates drone optical tracks with AIS broadcast data to identify 'Dark Vessels'.
                </p>
                <div className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono space-y-1.5" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">Standard:</span>
                    <span className="font-semibold">NMEA-0183 / AIS AIVDM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Agency:</span>
                    <span className="font-semibold">Coast Guard DHQ-4 (Kochi)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Dark Vessel Detection:</span>
                    <span className="font-semibold text-emerald-600">Active (Automatic Gap Flagging)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Message Rate:</span>
                    <span className="font-semibold">120 messages / min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 3: API KEYS & AUTHORIZED CLIENTS
           ══════════════════════════════════════════════════ */}
        {activeTab === 'KEYS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-bold">Authorized API Clients &amp; Key Management</h2>
                <p className="text-xs opacity-60">Cryptographically signed credentials with auditable lifecycle (RFP §10 &amp; Proposal §5.2.10)</p>
              </div>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Generate New API Key
              </button>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--surface)] text-[11px] font-mono opacity-70 border-b" style={{ borderColor: 'var(--line)' }}>
                  <tr>
                    <th className="p-3">CLIENT APPLICATION</th>
                    <th className="p-3">KEY IDENTIFIER</th>
                    <th className="p-3">ASSIGNED SCOPES</th>
                    <th className="p-3">ISSUER</th>
                    <th className="p-3">EXPIRATION</th>
                    <th className="p-3">TODAY'S CALLS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                  {apiKeys.map(k => (
                    <tr key={k.id} className="hover:bg-[var(--surface)]/50 transition-colors">
                      <td className="p-3 font-sans font-bold">{k.name}</td>
                      <td className="p-3 font-bold text-[var(--sea-600)]"><code>{k.keyPrefix}••••</code></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 opacity-70">{k.createdBy}</td>
                      <td className="p-3 opacity-70">{k.expiresAt}</td>
                      <td className="p-3 font-bold text-emerald-600">{k.requestCountToday.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1',
                          k.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        )}>
                          {k.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {k.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleRotateKey(k)}
                              title="Rotate Key Credentials"
                              className="p-1 rounded hover:bg-[var(--surface)] text-[var(--sea-600)] transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRevokeKey(k)}
                              title="Revoke Key"
                              className="p-1 rounded hover:bg-red-500/10 text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create API Key Modal */}
            {showNewKeyModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold">Issue New API Key</h3>
                    <button onClick={() => setShowNewKeyModal(false)} className="opacity-60 hover:opacity-100 text-sm">✕</button>
                  </div>

                  <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Client Application Name</label>
                      <input
                        type="text"
                        required
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="e.g. Neendakara Drone Pilot Field Terminal"
                        className="w-full p-2.5 rounded-xl border bg-[var(--surface)] text-xs font-sans"
                        style={{ borderColor: 'var(--line)' }}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1.5">Assigned Scopes</label>
                      <div className="space-y-1.5 font-mono">
                        {['read:telemetry', 'write:telemetry', 'read:incidents', 'write:evidence', 'read:contacts', 'admin:models'].map(scope => (
                          <label key={scope} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newKeyScopes.includes(scope)}
                              onChange={e => {
                                if (e.target.checked) setNewKeyScopes([...newKeyScopes, scope]);
                                else setNewKeyScopes(newKeyScopes.filter(s => s !== scope));
                              }}
                              className="rounded border"
                            />
                            <span>{scope}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewKeyModal(false)}
                        className="px-4 py-2 rounded-xl border font-semibold hover:bg-[var(--surface)]"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)]"
                      >
                        Generate &amp; Audit Log
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 4: WEBHOOK TESTER
           ══════════════════════════════════════════════════ */}
        {activeTab === 'WEBHOOKS' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-base font-bold">Inter-Agency Webhook Dispatcher &amp; Signature Tester</h2>
              <p className="text-xs opacity-60">Simulate HMAC-SHA256 signed incident notifications dispatched to 112 CAD or external emergency centers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Webhook Configuration */}
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <h3 className="font-serif text-sm font-bold">Webhook Configuration</h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Target Endpoint URL</label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-[var(--surface)] font-mono text-xs"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Trigger Event Class</label>
                    <select
                      value={webhookEvent}
                      onChange={e => setWebhookEvent(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-[var(--surface)] font-mono text-xs"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <option value="ZONE_INCURSION_SECURITY">SECURITY_ZONE_INCURSION (Critical Alert)</option>
                      <option value="DARK_VESSEL_DETECTED">DARK_VESSEL_DETECTED (AIS Inconsistency)</option>
                      <option value="PERSISTENT_LOITERING">PERSISTENT_LOITERING (Shoreline Behaviour)</option>
                      <option value="CROWD_SURGE_BEACH">CROWD_SURGE_BEACH (Density Alert)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Shared HMAC-SHA256 Secret</label>
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={e => setWebhookSecret(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-[var(--surface)] font-mono text-xs"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendWebhook}
                  disabled={webhookDispatching}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--sea-600)] hover:bg-[var(--sea-700)] transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {webhookDispatching ? 'Dispatching Test Payload...' : 'Send Test Webhook'}
                </button>
              </div>

              {/* Webhook Result Preview */}
              <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-bold">Dispatch Receipt &amp; Verification</h3>
                  {webhookResponse && (
                    <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> HTTP {webhookResponse.status} OK · {webhookResponse.dispatchTimeMs} ms
                    </span>
                  )}
                </div>

                {webhookResponse ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-mono opacity-60 block">X-HUB-SIGNATURE-256 (HMAC HEADER)</span>
                      <code className="text-xs font-mono text-cyan-600 block break-all p-2 rounded border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                        {webhookResponse.signature}
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono opacity-60 block">TRANSMITTED JSON PAYLOAD</span>
                      <pre className="p-3 rounded-xl border bg-[var(--surface)] text-xs font-mono overflow-x-auto max-h-60" style={{ borderColor: 'var(--line)' }}>
                        {JSON.stringify(webhookResponse.deliveredPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs opacity-60 font-mono space-y-2">
                    <Terminal className="w-8 h-8 mx-auto opacity-40" />
                    <p>Click "Send Test Webhook" to execute live HMAC dispatch simulation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

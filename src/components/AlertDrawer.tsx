// ============================================================
// SmartQEye Coastal — AlertDrawer Component
// Phase 7A: Slide-Over Active Alerts Panel from Bell
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Check, ExternalLink, ArrowRight, ShieldAlert } from 'lucide-react';
import { SideDrawer } from '@/components/SideDrawer';
import { SeverityChip } from '@/components/SeverityChip';
import { AttentionBadge } from '@/components/AttentionBadge';
import { useAlertStore } from '@/lib/store';
import { formatIST } from '@/lib/utils';
import type { Alert } from '@/types';

export interface AlertDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertDrawer({ open, onOpenChange }: AlertDrawerProps) {
  const navigate = useNavigate();
  const { alerts, unreadCount, acknowledgeAlert } = useAlertStore();

  const activeAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'ACKNOWLEDGED').slice(0, 15);

  const handleOpenAlert = (alert: Alert) => {
    onOpenChange(false);
    navigate(`/alerts/${alert.id}`);
  };

  const handleAcknowledge = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    acknowledgeAlert(id);
  };

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Active Coastal Alerts & Triage"
      description={`${unreadCount} unread alert${unreadCount === 1 ? '' : 's'} requiring officer assessment`}
      width="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => {
              onOpenChange(false);
              navigate('/alerts');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--sea-600)] hover:underline cursor-pointer"
          >
            <span>Open Full Alert Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono opacity-60">
            Showing top {activeAlerts.length} alerts
          </span>
        </div>
      }
    >
      <div className="space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="py-12 text-center space-y-2 opacity-60">
            <Bell className="w-8 h-8 mx-auto opacity-30" />
            <div className="text-xs font-mono">Zero unacknowledged coastal alerts</div>
          </div>
        ) : (
          activeAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => handleOpenAlert(alert)}
              className="p-3.5 rounded-xl border bg-[var(--surface)] hover:bg-[var(--panel)] transition-all cursor-pointer space-y-2 group shadow-2xs"
              style={{ borderColor: alert.status === 'NEW' ? 'var(--sea-600)' : 'var(--line)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SeverityChip severity={alert.severity} size="sm" />
                  <span className="font-mono font-bold text-xs">{alert.alertCode}</span>
                </div>
                <div className="text-[10px] font-mono opacity-60">
                  {formatIST(alert.createdAt || alert.event.occurredAt)}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold leading-tight group-hover:text-[var(--sea-600)] transition-colors">
                  {alert.event.type.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] opacity-70 mt-0.5 line-clamp-2">
                  {alert.notes || `Detected maritime activity by ${alert.event.uav.code} in ${alert.event.zone?.name || 'Coastal Sector'}`}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t text-xs" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] font-mono opacity-60">
                  UAV: {alert.event.uav.code}
                </span>

                <div className="flex items-center gap-2">
                  {alert.status === 'NEW' && (
                    <button
                      onClick={(e) => handleAcknowledge(e, alert.id)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                      title="Acknowledge alert"
                    >
                      <Check className="w-3 h-3 inline mr-0.5" /> Ack
                    </button>
                  )}
                  <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SideDrawer>
  );
}

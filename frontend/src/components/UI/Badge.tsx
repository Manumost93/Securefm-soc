import { TicketPriority, TicketStatus, EventSeverity } from '../../types';

const priorityConfig: Record<TicketPriority, { label: string; fg: string; bg: string; border: string; glow?: boolean }> = {
  low:      { label: 'BAJA',    fg: '#3a5060', bg: 'rgba(58,80,96,0.15)',   border: 'rgba(58,80,96,0.3)'   },
  medium:   { label: 'MEDIA',   fg: '#6d7fa0', bg: 'rgba(109,127,160,0.1)',  border: 'rgba(109,127,160,0.25)' },
  high:     { label: 'ALTA',    fg: '#c8931a', bg: 'rgba(200,147,26,0.1)',   border: 'rgba(200,147,26,0.3)'   },
  critical: { label: 'CRÍTICA', fg: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.35)',  glow: true },
};

const statusConfig: Record<TicketStatus, { label: string; fg: string; bg: string; border: string; glow?: boolean }> = {
  open:        { label: 'ABIERTO',    fg: '#c8931a', bg: 'rgba(200,147,26,0.1)',  border: 'rgba(200,147,26,0.3)',  glow: true  },
  in_progress: { label: 'EN CURSO',   fg: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',  glow: true  },
  pending:     { label: 'PENDIENTE',  fg: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)'              },
  resolved:    { label: 'RESUELTO',   fg: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)'              },
  closed:      { label: 'CERRADO',    fg: '#1e2a3a', bg: 'rgba(30,42,58,0.2)',   border: 'rgba(30,42,58,0.4)'                },
};

const severityConfig: Record<EventSeverity, { label: string; fg: string; bg: string; border: string; glow?: boolean }> = {
  info:     { label: 'INFO',    fg: '#2a3a4a', bg: 'rgba(42,58,74,0.2)',    border: 'rgba(42,58,74,0.3)'                },
  low:      { label: 'BAJO',    fg: '#6d7fa0', bg: 'rgba(109,127,160,0.1)', border: 'rgba(109,127,160,0.25)'            },
  medium:   { label: 'MEDIO',   fg: '#c8931a', bg: 'rgba(200,147,26,0.1)',  border: 'rgba(200,147,26,0.3)'              },
  high:     { label: 'ALTO',    fg: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  glow: true  },
  critical: { label: 'CRÍTICO', fg: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.35)',  glow: true  },
};

const CyberBadge: React.FC<{ label: string; fg: string; bg: string; border: string; glow?: boolean }> = ({ label, fg, bg, border, glow }) => (
  <span className="badge" style={{
    color: fg,
    background: bg,
    borderColor: border,
    boxShadow: glow ? `0 0 8px ${fg}55, inset 0 0 4px ${fg}15` : undefined,
  }}>
    {label}
  </span>
);

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <CyberBadge {...(priorityConfig[priority] || priorityConfig.medium)} />
);
export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <CyberBadge {...(statusConfig[status] || statusConfig.open)} />
);
export const SeverityBadge: React.FC<{ severity: EventSeverity | string }> = ({ severity }) => (
  <CyberBadge {...(severityConfig[severity as EventSeverity] || severityConfig.info)} />
);

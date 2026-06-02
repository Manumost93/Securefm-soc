import { TicketPriority, TicketStatus, EventSeverity } from '../../types';

const priorityConfig: Record<TicketPriority, { label: string; fg: string; bg: string; border: string }> = {
  low:      { label: 'Baja',    fg: '#6F6558', bg: 'rgba(111,101,88,0.1)',  border: 'rgba(111,101,88,0.22)'  },
  medium:   { label: 'Media',   fg: '#C58A2B', bg: 'rgba(197,138,43,0.1)', border: 'rgba(197,138,43,0.22)'  },
  high:     { label: 'Alta',    fg: '#B08A57', bg: 'rgba(176,138,87,0.12)', border: 'rgba(176,138,87,0.28)' },
  critical: { label: 'Crítica', fg: '#9F3A32', bg: 'rgba(159,58,50,0.1)',  border: 'rgba(159,58,50,0.28)'   },
};

const statusConfig: Record<TicketStatus, { label: string; fg: string; bg: string; border: string }> = {
  open:        { label: 'Abierto',   fg: '#B08A57', bg: 'rgba(176,138,87,0.1)',  border: 'rgba(176,138,87,0.28)'  },
  in_progress: { label: 'En curso',  fg: '#C58A2B', bg: 'rgba(197,138,43,0.1)', border: 'rgba(197,138,43,0.28)'  },
  pending:     { label: 'Pendiente', fg: '#8A5A3C', bg: 'rgba(138,90,60,0.1)',  border: 'rgba(138,90,60,0.22)'   },
  resolved:    { label: 'Resuelto',  fg: '#5F6F52', bg: 'rgba(95,111,82,0.1)',  border: 'rgba(95,111,82,0.22)'   },
  closed:      { label: 'Cerrado',   fg: '#A89C8E', bg: 'rgba(168,156,142,0.1)',border: 'rgba(168,156,142,0.2)'  },
};

const severityConfig: Record<EventSeverity, { label: string; fg: string; bg: string; border: string }> = {
  info:     { label: 'Info',    fg: '#A89C8E', bg: 'rgba(168,156,142,0.1)', border: 'rgba(168,156,142,0.2)'  },
  low:      { label: 'Bajo',    fg: '#6F6558', bg: 'rgba(111,101,88,0.1)', border: 'rgba(111,101,88,0.22)'   },
  medium:   { label: 'Medio',   fg: '#C58A2B', bg: 'rgba(197,138,43,0.1)', border: 'rgba(197,138,43,0.22)'  },
  high:     { label: 'Alto',    fg: '#B08A57', bg: 'rgba(176,138,87,0.12)',border: 'rgba(176,138,87,0.28)'   },
  critical: { label: 'Crítico', fg: '#9F3A32', bg: 'rgba(159,58,50,0.1)', border: 'rgba(159,58,50,0.28)'    },
};

const NcBadge: React.FC<{ label: string; fg: string; bg: string; border: string }> = ({ label, fg, bg, border }) => (
  <span className="badge" style={{ color: fg, background: bg, borderColor: border }}>
    {label}
  </span>
);

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <NcBadge {...(priorityConfig[priority] || priorityConfig.medium)} />
);
export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <NcBadge {...(statusConfig[status] || statusConfig.open)} />
);
export const SeverityBadge: React.FC<{ severity: EventSeverity | string }> = ({ severity }) => (
  <NcBadge {...(severityConfig[severity as EventSeverity] || severityConfig.info)} />
);

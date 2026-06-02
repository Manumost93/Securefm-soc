import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'gold' | 'red' | 'purple' | 'amber' | 'green';
  subtitle?: string;
}

const colorMap = {
  gold:   { fg: '#c8931a', bg: 'rgba(200,147,26,0.08)',  border: 'rgba(200,147,26,0.22)',  glow: '0 0 18px rgba(200,147,26,0.18)' },
  red:    { fg: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.22)',   glow: '0 0 18px rgba(239,68,68,0.18)'  },
  purple: { fg: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.22)',  glow: '0 0 18px rgba(139,92,246,0.15)' },
  amber:  { fg: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)',  glow: '0 0 18px rgba(245,158,11,0.15)' },
  green:  { fg: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.22)',   glow: '0 0 18px rgba(34,197,94,0.15)'  },
};

const StatCard: React.FC<Props> = ({ title, value, icon: Icon, color = 'gold', subtitle }) => {
  const c = colorMap[color];
  return (
    <div className="stat-card relative" style={{
      background: 'linear-gradient(145deg, #070a15 0%, #04060e 100%)',
      border: `1px solid ${c.border}`,
      boxShadow: `${c.glow}, 0 4px 24px rgba(0,0,0,0.6)`,
    }}>
      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-3 h-3" style={{ borderTop: `1px solid ${c.fg}60`, borderRight: `1px solid ${c.fg}60` }} />
      <div className="absolute bottom-0 left-0 w-3 h-3" style={{ borderBottom: `1px solid ${c.fg}40`, borderLeft: `1px solid ${c.fg}40` }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.fg}50, transparent)` }} />

      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#1e2a3a', letterSpacing: '0.12em' }}>
          {title}
        </p>
        <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon size={14} style={{ color: c.fg, filter: `drop-shadow(0 0 3px ${c.fg})` }} />
        </div>
      </div>

      <p className="font-mono text-4xl font-bold leading-none" style={{ color: c.fg, textShadow: `0 0 16px ${c.fg}70` }}>
        {value}
      </p>

      {subtitle && (
        <p className="font-mono text-xs" style={{ color: '#1e2a3a' }}>{subtitle}</p>
      )}

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${c.fg}20, transparent)` }} />
    </div>
  );
};

export default StatCard;

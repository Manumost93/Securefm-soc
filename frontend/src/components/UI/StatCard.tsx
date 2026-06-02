import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'gold' | 'red' | 'purple' | 'amber' | 'green';
  subtitle?: string;
}

const colorMap = {
  gold:   { fg: '#B08A57', bg: 'rgba(176,138,87,0.1)',  border: 'rgba(176,138,87,0.2)'  },
  red:    { fg: '#9F3A32', bg: 'rgba(159,58,50,0.1)',   border: 'rgba(159,58,50,0.2)'   },
  purple: { fg: '#5F6F52', bg: 'rgba(95,111,82,0.1)',   border: 'rgba(95,111,82,0.2)'   },
  amber:  { fg: '#C58A2B', bg: 'rgba(197,138,43,0.1)',  border: 'rgba(197,138,43,0.2)'  },
  green:  { fg: '#5F6F52', bg: 'rgba(95,111,82,0.1)',   border: 'rgba(95,111,82,0.2)'   },
};

const StatCard: React.FC<Props> = ({ title, value, icon: Icon, color = 'gold', subtitle }) => {
  const c = colorMap[color];
  return (
    <div className="stat-card relative" style={{
      background: '#FFFCF6',
      border: `1px solid #D8C8B5`,
      boxShadow: '0 1px 3px rgba(31,28,24,0.05), 0 4px 12px rgba(31,28,24,0.06)',
    }}>
      {/* Accent top border */}
      <div className="absolute top-0 left-6 right-6 h-px rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${c.fg}40, transparent)` }} />

      <div className="flex items-center justify-between">
        <p className="font-sans text-xs font-medium uppercase tracking-wide" style={{ color: '#A89C8E', letterSpacing: '0.06em' }}>
          {title}
        </p>
        <div className="w-8 h-8 flex items-center justify-center rounded-md" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon size={15} style={{ color: c.fg }} />
        </div>
      </div>

      <p className="font-sans text-4xl font-bold leading-none" style={{ color: c.fg }}>
        {value}
      </p>

      {subtitle && (
        <p className="font-sans text-xs" style={{ color: '#A89C8E' }}>{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;

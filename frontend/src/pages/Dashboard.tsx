import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, AlertTriangle, Activity, Shield, Clock, ArrowRight, Zap, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { TicketStats, SecurityStats, Ticket as TicketType } from '../types';
import StatCard from '../components/UI/StatCard';
import { PriorityBadge, StatusBadge, SeverityBadge } from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded font-mono text-xs" style={{ background: '#070a15', border: '1px solid rgba(200,147,26,0.25)', color: '#c8931a' }}>
      <p style={{ color: '#3a4a5a' }}>{label}</p>
      <p>Tickets: <span style={{ color: '#c8931a' }}>{payload[0].value}</span></p>
    </div>
  );
};

function buildTimeline(tickets: TicketType[]) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    return { label: format(d, 'd MMM', { locale: es }), date: format(d, 'yyyy-MM-dd'), count: 0 };
  });
  for (const t of tickets) {
    const key = t.createdAt.slice(0, 10);
    const day = days.find((d) => d.date === key);
    if (day) day.count++;
  }
  return days;
}

const DashboardPage: React.FC = () => {
  const { user, isTechnician } = useAuth();
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [secStats, setSecStats] = useState<SecurityStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ts, ss, rt] = await Promise.all([
          api.get<TicketStats>('/tickets/stats'),
          isTechnician ? api.get<SecurityStats>('/logs/stats') : Promise.resolve(null),
          api.get<TicketType[]>('/tickets'),
        ]);
        setTicketStats(ts.data);
        if (ss) setSecStats(ss.data);
        setAllTickets(rt.data);
        setRecentTickets(rt.data.slice(0, 6));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [isTechnician]);

  if (loading) return <LoadingSpinner message="Cargando dashboard..." />;

  const timeline = buildTimeline(allTickets);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-8" style={{ background: 'linear-gradient(180deg, transparent, #c8931a, transparent)', boxShadow: '0 0 8px rgba(200,147,26,0.5)' }} />
          <div>
            <h2 className="font-mono font-bold text-base tracking-widest" style={{ color: '#8a9bb5' }}>
              BIENVENIDO,{' '}
              <span style={{ color: '#c8931a', textShadow: '0 0 8px rgba(200,147,26,0.5)' }}>
                {user?.name?.split(' ')[0].toUpperCase()}
              </span>
            </h2>
            <p className="font-mono text-xs" style={{ color: '#1e2a3a' }}>// PANEL PRINCIPAL — {new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>
        <Link to="/tickets/new" className="btn-primary">
          <Plus size={12} /> NUEVA INCIDENCIA
        </Link>
      </div>

      {/* Ticket stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={ticketStats?.total ?? 0} icon={Ticket} color="gold" />
        <StatCard title="Abiertos" value={ticketStats?.open ?? 0} icon={Activity} color="amber" subtitle="Requieren atención" />
        <StatCard title="En Progreso" value={ticketStats?.inProgress ?? 0} icon={Clock} color="purple" />
        <StatCard title="Críticos" value={ticketStats?.critical ?? 0} icon={AlertTriangle} color="red" />
      </div>

      {/* SOC stats */}
      {isTechnician && secStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Eventos SOC" value={secStats.total} icon={Shield} color="gold" />
          <StatCard title="Críticos SOC" value={secStats.critical} icon={AlertTriangle} color="red" />
          <StatCard title="Login Fallidos" value={secStats.loginFailed} icon={AlertTriangle} color="amber" />
          <StatCard title="Últ. 24h" value={secStats.last24h} icon={Activity} color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Timeline chart */}
        <div className="lg:col-span-2 card card-corners p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Incidencias — últimos 14 días</p>
            <span className="font-mono text-xs" style={{ color: '#1e2a3a' }}>{allTickets.length} total</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8931a" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#c8931a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#1e2a3a', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#1e2a3a', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#c8931a" strokeWidth={1.5} fill="url(#goldGrad)" dot={false} activeDot={{ r: 3, fill: '#c8931a', stroke: '#070a15', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="gold-line mt-3" />

          {/* Recent tickets mini-list */}
          <p className="section-title mt-4 mb-3">Incidencias recientes</p>
          <div className="space-y-0.5">
            {recentTickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded transition-all"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,147,26,0.03)'; e.currentTarget.style.borderColor = 'rgba(200,147,26,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#4a5a6a' }}>{ticket.title}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: '#1e2a3a' }}>
                    {ticket.location} · {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
          </div>
          <Link to="/tickets" className="flex items-center gap-1 mt-3 font-mono text-xs transition-colors" style={{ color: '#1e2a3a' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c8931a'}
            onMouseLeave={e => e.currentTarget.style.color = '#1e2a3a'}>
            VER TODAS LAS INCIDENCIAS <ArrowRight size={10} />
          </Link>
        </div>

        {/* Sidebar panel */}
        <div className="space-y-4">
          <div className="card card-corners p-5">
            <p className="section-title mb-4">Acceso rápido</p>
            <div className="space-y-2">
              {[
                { to: '/tickets/new', label: 'NUEVA INCIDENCIA', icon: Zap, color: '#c8931a' },
                { to: '/soc', label: 'SOC CENTER', icon: Shield, color: '#ef4444', show: isTechnician },
                { to: '/audit', label: 'WEBSEC AUDIT', icon: Activity, color: '#8b5cf6' },
              ].filter(i => i.show !== false).map(({ to, label, icon: Icon, color }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs transition-all"
                  style={{ background: `${color}08`, border: `1px solid ${color}18`, color }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.boxShadow = `0 0 12px ${color}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.boxShadow = 'none'; }}>
                  <Icon size={12} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {isTechnician && secStats && secStats.suspiciousIps.length > 0 && (
            <div className="card p-4" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="section-title mb-3" style={{ color: 'rgba(239,68,68,0.5)' }}>IPs sospechosas</p>
              {secStats.suspiciousIps.slice(0, 4).map((item) => (
                <div key={item.ip} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-xs" style={{ color: '#3a4a5a' }}>{item.ip}</span>
                  <span className="badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', boxShadow: '0 0 6px rgba(239,68,68,0.3)' }}>
                    {item.count} evt
                  </span>
                </div>
              ))}
              <Link to="/soc" className="flex items-center gap-1 mt-2 font-mono text-xs" style={{ color: '#1e2a3a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#1e2a3a'}>
                VER SOC <ArrowRight size={10} />
              </Link>
            </div>
          )}

          {isTechnician && secStats && (
            <div className="card card-corners p-4">
              <p className="section-title mb-3">Últimos eventos</p>
              <div className="space-y-2">
                {secStats.recent.slice(0, 4).map((log) => (
                  <div key={log.id} className="flex items-center justify-between">
                    <span className="font-mono text-xs truncate" style={{ color: '#2a3a4a', maxWidth: '60%' }}>{log.eventType}</span>
                    <SeverityBadge severity={log.severity} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

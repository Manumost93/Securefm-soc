import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, AlertTriangle, Activity, Shield, Clock, ArrowRight, Plus, Search } from 'lucide-react';
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
    <div className="px-3 py-2 rounded-md font-sans text-xs" style={{ background: '#FFFCF6', border: '1px solid #D8C8B5', boxShadow: '0 4px 12px rgba(31,28,24,0.1)' }}>
      <p style={{ color: '#A89C8E' }}>{label}</p>
      <p style={{ color: '#1F1C18' }}>Tickets: <span style={{ color: '#B08A57', fontWeight: 600 }}>{payload[0].value}</span></p>
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
        <div>
          <h2 className="font-sans font-semibold text-base" style={{ color: '#1F1C18' }}>
            Bienvenido, <span style={{ color: '#B08A57' }}>{user?.name?.split(' ')[0]}</span>
          </h2>
          <p className="font-sans text-xs mt-0.5" style={{ color: '#A89C8E' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/tickets/new" className="btn-primary">
          <Plus size={14} /> Nueva incidencia
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
          <StatCard title="Últimas 24h" value={secStats.last24h} icon={Activity} color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Timeline + recent tickets */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Incidencias — últimos 14 días</p>
            <span className="font-sans text-xs" style={{ color: '#A89C8E' }}>{allTickets.length} total</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="bronzeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B08A57" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#B08A57" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#A89C8E', fontSize: 9, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A89C8E', fontSize: 9, fontFamily: 'Inter' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#B08A57" strokeWidth={1.5} fill="url(#bronzeGrad)"
                dot={false} activeDot={{ r: 3, fill: '#B08A57', stroke: '#FFFCF6', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="sand-line mt-4 mb-4" />

          <p className="section-title mb-3">Incidencias recientes</p>
          <div className="space-y-0.5">
            {recentTickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F6F1E8'; e.currentTarget.style.borderColor = '#D8C8B5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#1F1C18' }}>{ticket.title}</p>
                  <p className="font-sans text-xs mt-0.5" style={{ color: '#A89C8E' }}>
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
          <Link to="/tickets"
            className="flex items-center gap-1 mt-4 font-sans text-xs transition-colors"
            style={{ color: '#A89C8E' }}
            onMouseEnter={e => e.currentTarget.style.color = '#B08A57'}
            onMouseLeave={e => e.currentTarget.style.color = '#A89C8E'}>
            Ver todas las incidencias <ArrowRight size={11} />
          </Link>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="section-title mb-4">Acceso rápido</p>
            <div className="space-y-2">
              {[
                { to: '/tickets/new', label: 'Nueva incidencia', icon: Plus, fg: '#B08A57', bg: 'rgba(176,138,87,0.08)', border: 'rgba(176,138,87,0.2)' },
                { to: '/soc', label: 'SOC Center', icon: Shield, fg: '#9F3A32', bg: 'rgba(159,58,50,0.07)', border: 'rgba(159,58,50,0.18)', show: isTechnician },
                { to: '/audit', label: 'WebSec Audit', icon: Search, fg: '#5F6F52', bg: 'rgba(95,111,82,0.08)', border: 'rgba(95,111,82,0.2)' },
              ].filter(i => i.show !== false).map(({ to, label, icon: Icon, fg, bg, border }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md font-sans text-sm transition-all"
                  style={{ background: bg, border: `1px solid ${border}`, color: fg }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.92)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {isTechnician && secStats && secStats.suspiciousIps.length > 0 && (
            <div className="card p-4" style={{ border: '1px solid rgba(159,58,50,0.2)' }}>
              <p className="section-title mb-3" style={{ color: '#9F3A32' }}>IPs sospechosas</p>
              {secStats.suspiciousIps.slice(0, 4).map((item) => (
                <div key={item.ip} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-xs" style={{ color: '#6F6558' }}>{item.ip}</span>
                  <span className="badge" style={{ color: '#9F3A32', background: 'rgba(159,58,50,0.1)', borderColor: 'rgba(159,58,50,0.25)' }}>
                    {item.count}
                  </span>
                </div>
              ))}
              <Link to="/soc" className="flex items-center gap-1 mt-2 font-sans text-xs transition-colors"
                style={{ color: '#A89C8E' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9F3A32'}
                onMouseLeave={e => e.currentTarget.style.color = '#A89C8E'}>
                Ver SOC <ArrowRight size={10} />
              </Link>
            </div>
          )}

          {isTechnician && secStats && (
            <div className="card p-4">
              <p className="section-title mb-3">Últimos eventos</p>
              <div className="space-y-2.5">
                {secStats.recent.slice(0, 4).map((log) => (
                  <div key={log.id} className="flex items-center justify-between">
                    <span className="font-sans text-xs truncate" style={{ color: '#6F6558', maxWidth: '60%' }}>{log.eventType}</span>
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

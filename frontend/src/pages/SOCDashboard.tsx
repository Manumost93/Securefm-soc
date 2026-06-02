import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, XCircle, Globe, Activity, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { SecurityLog, SecurityStats } from '../types';
import { SeverityBadge } from '../components/UI/Badge';
import StatCard from '../components/UI/StatCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { downloadCSV, logsToCSV } from '../utils/export';
import { format } from 'date-fns';

const SEV_COLORS: Record<string, string> = {
  info: '#1e2a3a', low: '#4a5a6a', medium: '#c8931a', high: '#f59e0b', critical: '#ef4444',
};
const EVENT_LABELS: Record<string, string> = {
  login_success: 'Login OK', login_failed: 'Login FAIL', access_denied: 'Denegado',
  ticket_created: 'Ticket+', ticket_deleted: 'Ticket-', role_changed: 'Rol',
  suspicious_ip: 'IP Susp.', rate_limit_triggered: 'RateLimit', web_audit_executed: 'Audit',
};

const BatTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded font-mono text-xs" style={{ background: '#070a15', border: '1px solid rgba(200,147,26,0.25)', color: '#c8931a' }}>
      <p style={{ color: '#3a4a5a' }}>{label}</p>
      <p>{payload[0].name}: <span style={{ color: '#c8931a' }}>{payload[0].value}</span></p>
    </div>
  );
};

const SOCDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<SecurityStats>('/logs/stats'),
      api.get<SecurityLog[]>('/logs'),
    ]).then(([s, l]) => {
      setStats(s.data);
      setLogs(l.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    if (severity && l.severity !== severity) return false;
    if (eventType && l.eventType !== eventType) return false;
    return true;
  });

  const handleExport = () => downloadCSV(logsToCSV(filtered), 'securefm_soc_logs');

  if (loading) return <LoadingSpinner message="Cargando SOC..." />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-0.5 h-8" style={{ background: 'linear-gradient(180deg, transparent, #ef4444, transparent)', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }} />
        <div>
          <h2 className="font-mono font-bold text-base tracking-widest" style={{ color: '#8a9bb5' }}>
            SOC — <span style={{ color: '#ef4444', textShadow: '0 0 8px rgba(239,68,68,0.5)' }}>SECURITY CENTER</span>
          </h2>
          <p className="font-mono text-xs" style={{ color: '#1e2a3a' }}>// Monitorización de eventos de seguridad</p>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Eventos" value={stats.total} icon={Activity} color="gold" />
            <StatCard title="Críticos" value={stats.critical} icon={AlertTriangle} color="red" />
            <StatCard title="Login Fallidos" value={stats.loginFailed} icon={XCircle} color="amber" />
            <StatCard title="Acceso Denegado" value={stats.accessDenied} icon={Shield} color="purple" />
            <StatCard title="Últ. 24h" value={stats.last24h} icon={Activity} color="green" subtitle="Eventos recientes" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Bar chart */}
            <div className="card card-corners p-5">
              <p className="section-title mb-4">Eventos por tipo</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.byType.map((t) => ({ name: EVENT_LABELS[t.type] || t.type, count: t.count }))} margin={{ left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: '#1e2a3a', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#1e2a3a', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BatTooltip />} />
                  <Bar dataKey="count" name="Eventos" fill="rgba(200,147,26,0.6)" radius={[2, 2, 0, 0]}
                    activeBar={{ fill: '#c8931a', filter: 'drop-shadow(0 0 6px rgba(200,147,26,0.6))' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="card card-corners p-5">
              <p className="section-title mb-4">Severidad</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stats.bySeverity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={65} innerRadius={30}>
                    {stats.bySeverity.map((entry) => (
                      <Cell key={entry.severity} fill={SEV_COLORS[entry.severity] || '#1e2a3a'}
                        stroke={SEV_COLORS[entry.severity] || '#1e2a3a'} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<BatTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {stats.bySeverity.map((s) => (
                  <span key={s.severity} className="flex items-center gap-1 font-mono text-xs" style={{ color: '#1e2a3a' }}>
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: SEV_COLORS[s.severity] || '#1e2a3a' }} />
                    {s.severity} ({s.count})
                  </span>
                ))}
              </div>
            </div>

            {/* Countries + IPs */}
            <div className="card card-corners p-5">
              <p className="section-title mb-4 flex items-center gap-2"><Globe size={11} /> Actividad por país</p>
              <div className="space-y-2">
                {stats.byCountry.map((c) => (
                  <div key={c.country} className="flex items-center gap-2">
                    <span className="font-mono text-xs w-8" style={{ color: '#2a3a4a' }}>{c.country}</span>
                    <div className="flex-1 rounded-sm h-1" style={{ background: '#0b1020' }}>
                      <div className="h-1 rounded-sm" style={{
                        width: `${Math.min(100, (c.count / (stats.byCountry[0]?.count || 1)) * 100)}%`,
                        background: 'rgba(200,147,26,0.5)',
                      }} />
                    </div>
                    <span className="font-mono text-xs w-5 text-right" style={{ color: '#1e2a3a' }}>{c.count}</span>
                  </div>
                ))}
              </div>

              {stats.suspiciousIps.length > 0 && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(239,68,68,0.1)' }}>
                  <p className="section-title mb-2" style={{ color: 'rgba(239,68,68,0.5)' }}>IPs con alertas</p>
                  {stats.suspiciousIps.map((s) => (
                    <div key={s.ip} className="flex items-center justify-between py-1">
                      <span className="font-mono text-xs" style={{ color: '#3a4a5a' }}>{s.ip}</span>
                      <span className="badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Logs table */}
      <div className="card card-corners p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title flex items-center gap-2">
            <Filter size={11} /> Eventos ({filtered.length})
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-ghost" disabled={filtered.length === 0}>
              <Download size={11} /> CSV
            </button>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input py-1.5" style={{ width: '130px' }}>
              <option value="">Severidad</option>
              {['info','low','medium','high','critical'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="input py-1.5" style={{ width: '160px' }}>
              <option value="">Tipo</option>
              {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cyber-table">
            <thead><tr>
              <th>Fecha</th><th>Tipo</th><th>Usuario</th><th>IP</th><th>País</th><th>Severidad</th><th>Descripción</th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 100).map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-xs whitespace-nowrap" style={{ color: '#1e2a3a' }}>
                    {format(new Date(log.createdAt), 'dd/MM HH:mm:ss')}
                  </td>
                  <td className="font-mono text-xs" style={{ color: '#3a4a5a' }}>{log.eventType}</td>
                  <td className="text-xs" style={{ color: '#2a3a4a' }}>{log.userEmail || '—'}</td>
                  <td className="font-mono text-xs" style={{ color: '#1e2a3a' }}>{log.ip || '—'}</td>
                  <td className="font-mono text-xs" style={{ color: '#1a2030' }}>{log.country || '—'}</td>
                  <td><SeverityBadge severity={log.severity} /></td>
                  <td className="text-xs max-w-xs truncate" style={{ color: '#2a3a4a' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="font-mono text-xs text-center py-8" style={{ color: '#1e2a3a' }}>Sin eventos con los filtros aplicados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOCDashboardPage;

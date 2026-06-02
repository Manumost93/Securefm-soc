import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Ticket, Download } from 'lucide-react';
import api from '../../services/api';
import { Ticket as TicketType, TicketStatus, TicketPriority } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { downloadCSV, ticketsToCSV } from '../../utils/export';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIES = ['Electricidad','Climatización','Fontanería','Seguridad','IT','Mantenimiento general','Limpieza técnica','Prevención'];
const STATUSES: { value: TicketStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'open', label: 'Abierto' }, { value: 'in_progress', label: 'En Progreso' },
  { value: 'pending', label: 'Pendiente' }, { value: 'resolved', label: 'Resuelto' }, { value: 'closed', label: 'Cerrado' },
];
const PRIORITIES: { value: TicketPriority | ''; label: string }[] = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'critical', label: 'Crítica' }, { value: 'high', label: 'Alta' }, { value: 'medium', label: 'Media' }, { value: 'low', label: 'Baja' },
];

const TicketListPage: React.FC = () => {
  const { isTechnician } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (category) params.set('category', category);
      const res = await api.get<TicketType[]>(`/tickets?${params}`);
      setTickets(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [search, status, priority, category]);

  const handleExport = () => downloadCSV(ticketsToCSV(tickets), 'securefm_tickets');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-6" style={{ background: 'linear-gradient(180deg, transparent, #c8931a, transparent)', boxShadow: '0 0 6px rgba(200,147,26,0.5)' }} />
          <div>
            <h2 className="font-mono font-bold text-base tracking-widest" style={{ color: '#8a9bb5' }}>INCIDENCIAS</h2>
            <p className="font-mono text-xs" style={{ color: '#1e2a3a' }}>{tickets.length} registros</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-ghost" disabled={tickets.length === 0}>
            <Download size={12} /> EXPORTAR CSV
          </button>
          {isTechnician && (
            <Link to="/tickets/new" className="btn-primary">
              <Plus size={12} /> NUEVO
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }} />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-8" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Cargando incidencias..." />
      ) : tickets.length === 0 ? (
        <EmptyState icon={Ticket} title="Sin incidencias" description="No se encontraron resultados."
          action={isTechnician ? <Link to="/tickets/new" className="btn-primary">Crear incidencia</Link> : undefined} />
      ) : (
        <div className="card card-corners overflow-hidden">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Incidencia</th><th>Categoría</th><th>Ubicación</th>
                <th>Prioridad</th><th>Estado</th><th>Asignado</th><th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link to={`/tickets/${ticket.id}`} className="font-medium transition-colors"
                      style={{ color: '#4a5a6a' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#c8931a'}
                      onMouseLeave={e => e.currentTarget.style.color = '#4a5a6a'}>
                      {ticket.title}
                    </Link>
                    <p className="font-mono text-xs mt-0.5" style={{ color: '#1a2030' }}>#{ticket.id.slice(0, 8)}</p>
                  </td>
                  <td><span className="badge" style={{ color: '#2a3a4a', background: 'rgba(42,58,74,0.2)', borderColor: 'rgba(42,58,74,0.3)' }}>{ticket.category}</span></td>
                  <td className="text-xs" style={{ color: '#2a3a4a' }}>{ticket.location}</td>
                  <td><PriorityBadge priority={ticket.priority} /></td>
                  <td><StatusBadge status={ticket.status} /></td>
                  <td className="text-xs" style={{ color: '#2a3a4a' }}>{ticket.assignee?.name || '—'}</td>
                  <td className="font-mono text-xs" style={{ color: '#1a2030' }}>
                    {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TicketListPage;

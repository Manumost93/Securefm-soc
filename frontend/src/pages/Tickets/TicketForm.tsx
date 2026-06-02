import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../services/api';
import { Ticket, User } from '../../types';

const CATEGORIES = ['Electricidad', 'Climatización', 'Fontanería', 'Seguridad', 'IT', 'Mantenimiento general', 'Limpieza técnica', 'Prevención'];
const PRIORITIES = [{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }];
const STATUSES = [{ value: 'open', label: 'Abierto' }, { value: 'in_progress', label: 'En Progreso' }, { value: 'pending', label: 'Pendiente' }, { value: 'resolved', label: 'Resuelto' }, { value: 'closed', label: 'Cerrado' }];

const TicketFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', description: '', category: 'IT', location: '',
    priority: 'medium', status: 'open', assigneeId: '',
  });
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<User[]>('/users/technicians').then((r) => setTechnicians(r.data)).catch(() => {});
    if (isEdit) {
      api.get<Ticket>(`/tickets/${id}`).then((r) => {
        const t = r.data;
        setForm({
          title: t.title, description: t.description, category: t.category,
          location: t.location, priority: t.priority, status: t.status,
          assigneeId: t.assignee?.id || '',
        });
      }).catch(() => navigate('/tickets'));
    }
  }, [id, isEdit, navigate]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { ...form, assigneeId: form.assigneeId || null };
      if (isEdit) await api.put(`/tickets/${id}`, data);
      else await api.post('/tickets', data);
      navigate('/tickets');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/tickets" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} /> Volver
        </Link>
        <h2 className="text-lg font-bold text-white">{isEdit ? 'Editar Incidencia' : 'Nueva Incidencia'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Título *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="input" placeholder="Descripción breve de la incidencia" required />
        </div>

        <div>
          <label className="label">Descripción *</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input min-h-[100px] resize-y" placeholder="Detalla el problema con toda la información relevante..." required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Categoría *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prioridad</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="input">
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Ubicación *</label>
          <input value={form.location} onChange={(e) => set('location', e.target.value)} className="input" placeholder="Ej: Sala técnica planta 1, Parking zona B..." required />
        </div>

        {isEdit && (
          <div>
            <label className="label">Estado</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="label">Asignar a técnico</label>
          <select value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} className="input">
            <option value="">Sin asignar</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            <Save size={15} /> {loading ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear incidencia')}
          </button>
          <Link to="/tickets" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  );
};

export default TicketFormPage;

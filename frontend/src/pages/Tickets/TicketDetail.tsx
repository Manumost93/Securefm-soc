import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MapPin, Tag, User, Clock, MessageSquare, Send } from 'lucide-react';
import api from '../../services/api';
import { Ticket } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isTechnician } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Ticket>(`/tickets/${id}`)
      .then((res) => setTicket(res.data))
      .catch(() => navigate('/tickets'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { content: comment });
      const res = await api.get<Ticket>(`/tickets/${id}`);
      setTicket(res.data);
      setComment('');
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta incidencia? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/tickets');
    } catch (err) { console.error(err); setDeleting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!ticket) return null;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link to="/tickets"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#A89C8E' }}
          onMouseEnter={e => e.currentTarget.style.color = '#1F1C18'}
          onMouseLeave={e => e.currentTarget.style.color = '#A89C8E'}>
          <ArrowLeft size={15} /> Volver a incidencias
        </Link>
        <div className="flex items-center gap-2">
          {isTechnician && (
            <Link to={`/tickets/${id}/edit`} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
              <Edit size={14} /> Editar
            </Link>
          )}
          {isAdmin && (
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-1.5 text-sm py-1.5">
              <Trash2 size={14} /> {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <p className="font-mono text-xs mb-1.5" style={{ color: '#C4B8AA' }}>#{ticket.id.slice(0, 8)}</p>
                <h2 className="text-xl font-semibold" style={{ color: '#1F1C18' }}>{ticket.title}</h2>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#6F6558' }}>{ticket.description}</p>
          </div>

          <div className="card p-5">
            <h3 className="font-sans font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#1F1C18' }}>
              <MessageSquare size={15} style={{ color: '#A89C8E' }} />
              Historial ({ticket.comments.length})
            </h3>
            {ticket.comments.length === 0 ? (
              <p className="text-sm" style={{ color: '#A89C8E' }}>Sin comentarios aún.</p>
            ) : (
              <div className="space-y-3">
                {ticket.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#EFE6D8', border: '1px solid #D8C8B5' }}>
                      <span className="text-xs font-semibold" style={{ color: '#6F6558' }}>{c.user.name[0]}</span>
                    </div>
                    <div className="flex-1 rounded-md p-3" style={{ background: '#F6F1E8', border: '1px solid #E5D8C5' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: '#1F1C18' }}>{c.user.name}</span>
                        <span className="text-xs capitalize" style={{ color: '#A89C8E' }}>{c.user.role}</span>
                        <span className="text-xs ml-auto font-mono" style={{ color: '#C4B8AA' }}>
                          {format(new Date(c.createdAt), "d MMM HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#6F6558' }}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isTechnician && (
              <div className="mt-4 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                  placeholder="Añadir comentario..."
                  className="input text-sm flex-1"
                />
                <button onClick={handleComment} disabled={submitting || !comment.trim()} className="btn-primary px-3">
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-sans font-semibold text-xs uppercase tracking-wide" style={{ color: '#A89C8E', letterSpacing: '0.07em' }}>Detalles</h3>
            {[
              { icon: Tag, label: 'Categoría', value: ticket.category },
              { icon: MapPin, label: 'Ubicación', value: ticket.location },
              { icon: User, label: 'Creado por', value: ticket.creator.name },
              { icon: User, label: 'Asignado a', value: ticket.assignee?.name || 'Sin asignar' },
              { icon: Clock, label: 'Creado', value: format(new Date(ticket.createdAt), "d MMM yyyy", { locale: es }) },
              { icon: Clock, label: 'Actualizado', value: format(new Date(ticket.updatedAt), "d MMM yyyy HH:mm", { locale: es }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon size={13} style={{ color: '#C4B8AA', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-xs" style={{ color: '#A89C8E' }}>{label}</p>
                  <p className="text-sm font-medium" style={{ color: '#1F1C18' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;

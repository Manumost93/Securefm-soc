import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Edit, Shield } from 'lucide-react';
import api from '../services/api';
import { User, UserRole } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ROLE_STYLE: Record<UserRole, { fg: string; bg: string; border: string }> = {
  admin:      { fg: '#9F3A32', bg: 'rgba(159,58,50,0.1)',  border: 'rgba(159,58,50,0.25)'  },
  technician: { fg: '#B08A57', bg: 'rgba(176,138,87,0.1)', border: 'rgba(176,138,87,0.25)' },
  viewer:     { fg: '#A89C8E', bg: 'rgba(168,156,142,0.1)',border: 'rgba(168,156,142,0.22)' },
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'viewer' as UserRole });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get<User[]>('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleRoleChange = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/users/${editing.id}`, { role: newRole });
      load(); setEditing(null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    setError(''); setCreating(true);
    try {
      await api.post('/users', form);
      load(); setShowCreate(false);
      setForm({ email: '', password: '', name: '', role: 'viewer' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error al crear usuario');
    } finally { setCreating(false); }
  };

  const toggleActive = async (user: User) => {
    try { await api.put(`/users/${user.id}`, { active: !user.active }); load(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans font-semibold text-base flex items-center gap-2" style={{ color: '#1F1C18' }}>
            <UsersIcon size={16} style={{ color: '#B08A57' }} /> Gestión de usuarios
          </h2>
          <p className="font-sans text-xs mt-0.5" style={{ color: '#A89C8E' }}>{users.length} usuarios registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      {showCreate && (
        <div className="card p-5 space-y-4" style={{ border: '1px solid rgba(176,138,87,0.25)' }}>
          <h3 className="font-sans font-semibold text-sm" style={{ color: '#1F1C18' }}>Crear nuevo usuario</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div><label className="label">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></div>
            <div><label className="label">Contraseña</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" /></div>
            <div>
              <label className="label">Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="input">
                <option value="viewer">Viewer</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="font-sans text-sm" style={{ color: '#9F3A32' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="btn-primary">{creating ? 'Creando...' : 'Crear'}</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No hay usuarios" />
      ) : (
        <div className="card overflow-hidden">
          <table className="cyber-table">
            <thead>
              <tr>
                {['Usuario', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const rs = ROLE_STYLE[user.role];
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#EFE6D8', border: '1px solid #D8C8B5' }}>
                          <span className="font-sans font-semibold text-xs" style={{ color: '#6F6558' }}>{user.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-sans font-medium text-sm" style={{ color: '#1F1C18' }}>{user.name}</p>
                          <p className="font-sans text-xs" style={{ color: '#A89C8E' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge flex items-center gap-1 w-fit" style={{ color: rs.fg, background: rs.bg, borderColor: rs.border }}>
                        <Shield size={10} /> {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        color: user.active ? '#5F6F52' : '#A89C8E',
                        background: user.active ? 'rgba(95,111,82,0.1)' : 'rgba(168,156,142,0.1)',
                        borderColor: user.active ? 'rgba(95,111,82,0.22)' : 'rgba(168,156,142,0.2)',
                      }}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="font-sans text-xs" style={{ color: '#A89C8E' }}>
                      {format(new Date(user.createdAt), 'd MMM yyyy', { locale: es })}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setEditing(user); setNewRole(user.role); }}
                          className="flex items-center gap-1 font-sans text-xs transition-colors"
                          style={{ color: '#A89C8E' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#B08A57'}
                          onMouseLeave={e => e.currentTarget.style.color = '#A89C8E'}>
                          <Edit size={12} /> Rol
                        </button>
                        <button onClick={() => toggleActive(user)}
                          className="font-sans text-xs transition-colors"
                          style={{ color: '#A89C8E' }}
                          onMouseEnter={e => e.currentTarget.style.color = user.active ? '#9F3A32' : '#5F6F52'}
                          onMouseLeave={e => e.currentTarget.style.color = '#A89C8E'}>
                          {user.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(31,28,24,0.45)' }}>
          <div className="card p-6 w-full max-w-sm">
            <h3 className="font-sans font-semibold mb-4" style={{ color: '#1F1C18' }}>
              Cambiar rol de {editing.name}
            </h3>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="input mb-4">
              <option value="viewer">Viewer</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleRoleChange} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Edit, Shield } from 'lucide-react';
import api from '../services/api';
import { User, UserRole } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ROLE_BADGES: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
  technician: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  viewer: 'bg-slate-700/60 text-slate-400 border border-slate-600/50',
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
      load();
      setEditing(null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    try {
      await api.post('/users', form);
      load();
      setShowCreate(false);
      setForm({ email: '', password: '', name: '', role: 'viewer' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error al crear usuario');
    } finally { setCreating(false); }
  };

  const toggleActive = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { active: !user.active });
      load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UsersIcon size={18} className="text-blue-400" /> Gestión de Usuarios
          </h2>
          <p className="text-slate-500 text-xs">{users.length} usuarios registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      {showCreate && (
        <div className="card p-5 space-y-4 border border-blue-500/20">
          <h3 className="text-white font-semibold text-sm">Crear nuevo usuario</h3>
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm">{creating ? 'Creando...' : 'Crear'}</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No hay usuarios" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700/50">
              <tr>
                {['Usuario', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-500 font-mono uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-300">{user.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.name}</p>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_BADGES[user.role]}`}>
                      <Shield size={10} /> {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-700/60 text-slate-500 border border-slate-600/50'}`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {format(new Date(user.createdAt), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditing(user); setNewRole(user.role); }}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit size={12} /> Rol
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        className={`text-xs transition-colors ${user.active ? 'text-slate-500 hover:text-amber-400' : 'text-slate-600 hover:text-green-400'}`}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Cambiar rol de {editing.name}</h3>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="input mb-4">
              <option value="viewer">Viewer</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleRoleChange} disabled={saving} className="btn-primary text-sm flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

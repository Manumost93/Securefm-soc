import { useState, FormEvent } from 'react';
import { UserCircle, Lock, Save, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card card-corners p-6">
    <p className="section-title mb-5">{title}</p>
    {children}
  </div>
);

const Toast: React.FC<{ type: 'ok' | 'err'; msg: string }> = ({ type, msg }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded font-mono text-xs" style={{
    background: type === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
    border: `1px solid ${type === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
    color: type === 'ok' ? '#22c55e' : '#ef4444',
  }}>
    {type === 'ok' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
    {msg}
  </div>
);

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [nameMsg, setNameMsg] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  const handleName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    try {
      await api.put('/profile/name', { name });
      setNameMsg({ type: 'ok', msg: 'Nombre actualizado correctamente' });
    } catch (err: any) {
      setNameMsg({ type: 'err', msg: err.response?.data?.message || 'Error al actualizar' });
    } finally { setSavingName(false); }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (passForm.next !== passForm.confirm) {
      setPassMsg({ type: 'err', msg: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (passForm.next.length < 6) {
      setPassMsg({ type: 'err', msg: 'La nueva contraseña debe tener mínimo 6 caracteres' });
      return;
    }
    setSavingPass(true);
    try {
      await api.put('/profile/password', { currentPassword: passForm.current, newPassword: passForm.next });
      setPassMsg({ type: 'ok', msg: 'Contraseña actualizada. Vuelve a iniciar sesión si es necesario.' });
      setPassForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPassMsg({ type: 'err', msg: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error al cambiar contraseña' });
    } finally { setSavingPass(false); }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ background: '#c8931a', boxShadow: '0 0 6px rgba(200,147,26,0.6)' }} />
        <div>
          <h2 className="font-mono font-bold text-base tracking-widest" style={{ color: '#8a9bb5' }}>PERFIL</h2>
          <p className="font-mono text-xs" style={{ color: '#1e2a3a' }}>// Configuración de cuenta y seguridad</p>
        </div>
      </div>

      {/* User info card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded flex items-center justify-center font-mono font-bold text-2xl shrink-0" style={{
          background: 'rgba(200,147,26,0.08)',
          border: '1px solid rgba(200,147,26,0.25)',
          color: '#c8931a',
          boxShadow: '0 0 16px rgba(200,147,26,0.12)',
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-mono font-bold" style={{ color: '#c8931a' }}>{user?.name}</p>
          <p className="font-mono text-xs" style={{ color: '#3a4a5a' }}>{user?.email}</p>
          <p className="font-mono text-xs mt-1" style={{ color: '#2a3a4a' }}>
            ROL: <span style={{ color: '#8b5cf6' }}>{user?.role?.toUpperCase()}</span>
          </p>
        </div>
        <UserCircle size={20} style={{ color: '#1e2a3a', marginLeft: 'auto' }} />
      </div>

      {/* Change name */}
      <Section title="Nombre de usuario">
        <form onSubmit={handleName} className="space-y-4">
          <div>
            <label className="label">Nombre visible</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
          </div>
          {nameMsg && <Toast {...nameMsg} />}
          <button type="submit" className="btn-primary" disabled={savingName}>
            <Save size={13} /> {savingName ? 'GUARDANDO...' : 'GUARDAR NOMBRE'}
          </button>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Cambiar contraseña">
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Contraseña actual</label>
            <div className="relative">
              <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }} />
              <input type="password" value={passForm.current} onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                className="input pl-8" placeholder="••••••••" required />
            </div>
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <div className="relative">
              <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }} />
              <input type="password" value={passForm.next} onChange={(e) => setPassForm({ ...passForm, next: e.target.value })}
                className="input pl-8" placeholder="Mínimo 6 caracteres" required />
            </div>
          </div>
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <div className="relative">
              <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }} />
              <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                className="input pl-8" placeholder="Repetir contraseña" required />
            </div>
          </div>
          {passMsg && <Toast {...passMsg} />}
          <button type="submit" className="btn-primary" disabled={savingPass}>
            <Lock size={13} /> {savingPass ? 'CAMBIANDO...' : 'CAMBIAR CONTRASEÑA'}
          </button>
        </form>
      </Section>

      {/* Security info */}
      <div className="card p-4" style={{ border: '1px solid rgba(139,92,246,0.15)' }}>
        <p className="section-title mb-3">Información de seguridad</p>
        <div className="space-y-2 font-mono text-xs" style={{ color: '#2a3a4a' }}>
          <p>→ Las contraseñas se almacenan con bcrypt (coste 12)</p>
          <p>→ Los tokens JWT expiran en 8 horas</p>
          <p>→ Todos los accesos quedan registrados en el SOC</p>
          <p>→ Máximo 20 intentos de login por 15 minutos</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

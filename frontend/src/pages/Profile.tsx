import { useState, FormEvent } from 'react';
import { UserCircle, Lock, Save, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card p-6">
    <p className="section-title mb-5">{title}</p>
    {children}
  </div>
);

const Toast: React.FC<{ type: 'ok' | 'err'; msg: string }> = ({ type, msg }) => (
  <div className="flex items-center gap-2 px-3 py-2.5 rounded-md font-sans text-sm" style={{
    background: type === 'ok' ? 'rgba(95,111,82,0.08)' : 'rgba(159,58,50,0.07)',
    border: `1px solid ${type === 'ok' ? 'rgba(95,111,82,0.22)' : 'rgba(159,58,50,0.2)'}`,
    color: type === 'ok' ? '#5F6F52' : '#9F3A32',
  }}>
    {type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
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
    setSavingName(true); setNameMsg(null);
    try {
      await api.put('/profile/name', { name });
      setNameMsg({ type: 'ok', msg: 'Nombre actualizado correctamente' });
    } catch (err: any) {
      setNameMsg({ type: 'err', msg: err.response?.data?.message || 'Error al actualizar' });
    } finally { setSavingName(false); }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault(); setPassMsg(null);
    if (passForm.next !== passForm.confirm) { setPassMsg({ type: 'err', msg: 'Las contraseñas nuevas no coinciden' }); return; }
    if (passForm.next.length < 6) { setPassMsg({ type: 'err', msg: 'La nueva contraseña debe tener mínimo 6 caracteres' }); return; }
    setSavingPass(true);
    try {
      await api.put('/profile/password', { currentPassword: passForm.current, newPassword: passForm.next });
      setPassMsg({ type: 'ok', msg: 'Contraseña actualizada correctamente.' });
      setPassForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPassMsg({ type: 'err', msg: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error al cambiar contraseña' });
    } finally { setSavingPass(false); }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="font-sans font-semibold text-base" style={{ color: '#1F1C18' }}>Perfil</h2>
        <p className="font-sans text-xs mt-0.5" style={{ color: '#A89C8E' }}>Configuración de cuenta y seguridad</p>
      </div>

      {/* User info card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-semibold text-2xl shrink-0" style={{
          background: 'rgba(176,138,87,0.1)',
          border: '1px solid rgba(176,138,87,0.25)',
          color: '#B08A57',
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-sans font-semibold" style={{ color: '#1F1C18' }}>{user?.name}</p>
          <p className="font-sans text-sm" style={{ color: '#A89C8E' }}>{user?.email}</p>
          <span className="badge mt-1.5" style={{
            color: '#B08A57',
            background: 'rgba(176,138,87,0.1)',
            borderColor: 'rgba(176,138,87,0.25)',
          }}>{user?.role}</span>
        </div>
        <UserCircle size={20} style={{ color: '#D8C8B5', flexShrink: 0 }} />
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
            <Save size={13} /> {savingName ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Cambiar contraseña">
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Contraseña actual</label>
            <div className="relative">
              <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C4B8AA' }} />
              <input type="password" value={passForm.current} onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                className="input pl-8" placeholder="••••••••" required />
            </div>
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <div className="relative">
              <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C4B8AA' }} />
              <input type="password" value={passForm.next} onChange={(e) => setPassForm({ ...passForm, next: e.target.value })}
                className="input pl-8" placeholder="Mínimo 6 caracteres" required />
            </div>
          </div>
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <div className="relative">
              <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C4B8AA' }} />
              <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                className="input pl-8" placeholder="Repetir contraseña" required />
            </div>
          </div>
          {passMsg && <Toast {...passMsg} />}
          <button type="submit" className="btn-primary" disabled={savingPass}>
            <Lock size={13} /> {savingPass ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </Section>

      {/* Security info */}
      <div className="card p-4">
        <p className="section-title mb-3">Información de seguridad</p>
        <div className="space-y-2 font-sans text-sm" style={{ color: '#6F6558' }}>
          <p>Las contraseñas se almacenan con bcrypt (coste 12)</p>
          <p>Los tokens JWT expiran en 8 horas</p>
          <p>Todos los accesos quedan registrados en el SOC</p>
          <p>Máximo 20 intentos de login por 15 minutos</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

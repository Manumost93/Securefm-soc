import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const DEMO_USERS = [
  { email: 'admin@securefm.local',  pass: 'Admin123!',  role: 'Admin',      color: '#9F3A32' },
  { email: 'tech@securefm.local',   pass: 'Tech123!',   role: 'Técnico',    color: '#B08A57' },
  { email: 'viewer@securefm.local', pass: 'Viewer123!', role: 'Observador', color: '#A89C8E' },
];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: '#F6F1E8',
    }}>
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-5 rounded-xl" style={{
            background: '#FFFCF6',
            border: '1px solid #D8C8B5',
            boxShadow: '0 2px 8px rgba(31,28,24,0.08)',
          }}>
            <Shield size={24} style={{ color: '#B08A57' }} />
          </div>
          <h1 className="font-display font-semibold text-2xl" style={{ color: '#1F1C18', letterSpacing: '-0.01em' }}>
            SecureFM SOC
          </h1>
          <p className="font-sans text-sm mt-1.5" style={{ color: '#A89C8E' }}>
            Plataforma de gestión y seguridad
          </p>
          <div className="sand-line mt-5" />
        </div>

        {/* Form card */}
        <div className="card p-7">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C4B8AA' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="usuario@securefm.local"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C4B8AA' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-9"
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#C4B8AA' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#6F6558')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#C4B8AA')}
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="font-sans text-sm px-3 py-2.5 rounded-md" style={{
                background: 'rgba(159,58,50,0.07)',
                border: '1px solid rgba(159,58,50,0.2)',
                color: '#9F3A32',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,252,246,0.3)', borderTopColor: '#FFFCF6' }} />
                  Autenticando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #EFE6D8' }}>
            <p className="font-sans text-xs font-medium mb-3" style={{ color: '#A89C8E' }}>
              Accesos de demostración
            </p>
            <div className="space-y-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.pass); }}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-all"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#EFE6D8';
                    e.currentTarget.style.borderColor = '#D8C8B5';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: u.color }} />
                  <span className="font-sans text-xs font-medium" style={{ color: '#6F6558' }}>{u.role}</span>
                  <span className="font-sans text-xs ml-auto" style={{ color: '#A89C8E' }}>{u.pass}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center font-sans text-xs mt-6" style={{ color: '#C4B8AA' }}>
          SecureFM SOC · Cloud & DevSecOps Edition
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

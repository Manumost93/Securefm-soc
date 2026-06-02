import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const DEMO_USERS = [
  { email: 'admin@securefm.local', pass: 'Admin123!', role: 'ADMIN', color: '#ef4444' },
  { email: 'tech@securefm.local',  pass: 'Tech123!',  role: 'TECH',  color: '#c8931a' },
  { email: 'viewer@securefm.local',pass: 'Viewer123!',role: 'VIEWER',color: '#6d7fa0' },
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
      setError(err.response?.data?.message || 'ACCESO DENEGADO — Credenciales inválidas');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: '#02030a',
      backgroundImage: `
        radial-gradient(ellipse 60% 50% at 50% 0%, rgba(109,40,217,0.06) 0%, transparent 60%),
        linear-gradient(rgba(200,147,26,0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200,147,26,0.018) 1px, transparent 1px)
      `,
      backgroundSize: 'auto, 48px 48px, 48px 48px',
    }}>

      {/* Glow orbs */}
      <div className="absolute pointer-events-none" style={{ top: '20%', left: '8%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(200,147,26,0.04) 0%, transparent 65%)', borderRadius: '50%' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '15%', right: '8%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(109,40,217,0.05) 0%, transparent 65%)', borderRadius: '50%' }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4" style={{
            background: 'rgba(200,147,26,0.06)',
            border: '1px solid rgba(200,147,26,0.3)',
            borderRadius: '6px',
            boxShadow: '0 0 28px rgba(200,147,26,0.18), inset 0 1px 0 rgba(200,147,26,0.1)',
          }}>
            <Shield size={28} style={{ color: '#c8931a', filter: 'drop-shadow(0 0 6px rgba(200,147,26,0.8))' }} />
          </div>
          <h1 className="font-mono font-bold text-xl tracking-widest" style={{ color: '#c8931a', textShadow: '0 0 14px rgba(200,147,26,0.4)' }}>
            SECUREFM SOC
          </h1>
          <p className="font-mono text-xs mt-1.5 tracking-wider" style={{ color: '#1e2a3a' }}>
            SISTEMA DE ACCESO RESTRINGIDO
          </p>
          <div className="gold-line mt-3" />
        </div>

        {/* Form */}
        <div className="relative p-7 rounded" style={{
          background: 'linear-gradient(145deg, #070a15 0%, #04060e 100%)',
          border: '1px solid rgba(200,147,26,0.12)',
          boxShadow: '0 0 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,147,26,0.04)',
        }}>
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-3 h-3" style={{ borderTop: '1px solid rgba(200,147,26,0.5)', borderLeft: '1px solid rgba(200,147,26,0.5)' }} />
          <div className="absolute top-0 right-0 w-3 h-3" style={{ borderTop: '1px solid rgba(200,147,26,0.5)', borderRight: '1px solid rgba(200,147,26,0.5)' }} />
          <div className="absolute bottom-0 left-0 w-3 h-3" style={{ borderBottom: '1px solid rgba(200,147,26,0.3)', borderLeft: '1px solid rgba(200,147,26,0.3)' }} />
          <div className="absolute bottom-0 right-0 w-3 h-3" style={{ borderBottom: '1px solid rgba(200,147,26,0.3)', borderRight: '1px solid rgba(200,147,26,0.3)' }} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Identificador</label>
              <div className="relative">
                <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9" placeholder="usuario@securefm.local" required autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="label">Clave de acceso</label>
              <div className="relative">
                <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-9" placeholder="••••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#1e2a3a' }}>
                  {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="font-mono text-xs px-3 py-2 rounded" style={{
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444',
              }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border rounded-full animate-spin" style={{ borderColor: 'rgba(200,147,26,0.3)', borderTopColor: '#c8931a' }} />
                  AUTENTICANDO...
                </span>
              ) : 'INICIAR SESIÓN'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(200,147,26,0.06)' }}>
            <p className="font-mono text-xs mb-2" style={{ color: '#1e2a3a', letterSpacing: '0.1em' }}>// ACCESOS DE DEMOSTRACIÓN</p>
            <div className="space-y-0.5">
              {DEMO_USERS.map((u) => (
                <button key={u.email} type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.pass); }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-all"
                  style={{ border: '1px solid transparent', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${u.color}0a`; e.currentTarget.style.borderColor = `${u.color}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <span style={{ color: u.color }}>[ {u.role} ]</span>
                  <span style={{ color: '#2a3a4a' }}>{u.email}</span>
                  <span style={{ color: '#1e2a3a' }}>{u.pass}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

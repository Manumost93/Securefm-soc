import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PAGE_TITLES: Record<string, string> = {
  '/':           'DASHBOARD',
  '/tickets':    'GESTIÓN DE INCIDENCIAS',
  '/tickets/new':'NUEVA INCIDENCIA',
  '/soc':        'SOC — SECURITY CENTER',
  '/audit':      'WEBSEC AUDITOR',
  '/users':      'GESTIÓN DE USUARIOS',
  '/profile':    'PERFIL DE USUARIO',
};

const Navbar: React.FC = () => {
  const { logout, user, isTechnician } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [criticalCount, setCriticalCount] = useState(0);
  const [showBell, setShowBell] = useState(false);

  const title = Object.entries(PAGE_TITLES)
    .sort(([a], [b]) => b.length - a.length)
    .find(([p]) => location.pathname.startsWith(p))?.[1] || 'SECUREFM SOC';

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Poll critical events every 60s
  const checkCritical = useCallback(async () => {
    if (!isTechnician) return;
    try {
      const res = await api.get('/logs/stats');
      setCriticalCount(res.data.critical || 0);
    } catch { /* silent */ }
  }, [isTechnician]);

  useEffect(() => {
    checkCritical();
    const id = setInterval(checkCritical, 60000);
    return () => clearInterval(id);
  }, [checkCritical]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = `${pad(time.getDate())}.${pad(time.getMonth()+1)}.${time.getFullYear()}`;

  return (
    <header className="h-14 flex items-center justify-between px-6 shrink-0" style={{
      background: 'linear-gradient(90deg, #04060e 0%, #02030a 100%)',
      borderBottom: '1px solid rgba(200,147,26,0.1)',
    }}>

      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-px h-5" style={{ background: 'linear-gradient(180deg, transparent, #c8931a, transparent)' }} />
        <div>
          <h1 className="font-mono font-bold text-sm tracking-widest" style={{ color: '#8a9bb5', letterSpacing: '0.12em' }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Clock */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded" style={{
          background: 'rgba(200,147,26,0.04)',
          border: '1px solid rgba(200,147,26,0.1)',
        }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse_gold" style={{ background: '#c8931a', boxShadow: '0 0 4px #c8931a' }} />
          <span className="font-mono text-xs" style={{ color: '#c8931a', textShadow: '0 0 6px rgba(200,147,26,0.4)' }}>
            {timeStr}
          </span>
          <span className="font-mono text-xs" style={{ color: '#2a3a4a' }}>{dateStr}</span>
        </div>

        {/* Separator */}
        <div className="w-px h-5" style={{ background: 'rgba(200,147,26,0.1)' }} />

        {/* User */}
        <span className="hidden sm:block font-mono text-xs" style={{ color: '#1e2a3a' }}>{user?.email}</span>

        {/* Bell + critical badge */}
        <div className="relative">
          <button
            onClick={() => setShowBell(!showBell)}
            className="w-7 h-7 flex items-center justify-center rounded transition-all"
            style={{ color: criticalCount > 0 ? '#f87171' : '#2a3a4a' }}>
            <Bell size={14} />
          </button>
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-mono text-xs font-bold"
              style={{ background: '#dc2626', color: '#fff', fontSize: '0.55rem', boxShadow: '0 0 8px rgba(220,38,38,0.6)' }}>
              {criticalCount > 99 ? '99' : criticalCount}
            </span>
          )}
          {showBell && (
            <div className="absolute right-0 top-9 w-56 rounded z-50 p-3" style={{
              background: '#070a15',
              border: '1px solid rgba(220,38,38,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            }}>
              <p className="font-mono text-xs mb-2" style={{ color: '#f87171' }}>
                ⚠ {criticalCount} eventos críticos
              </p>
              <p className="font-mono text-xs" style={{ color: '#2a3a4a' }}>Revisa el SOC Dashboard</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={logout}
          className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 rounded transition-all"
          style={{ color: '#2a3a4a', border: '1px solid transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
            e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#2a3a4a';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}>
          <LogOut size={12} />
          <span className="hidden sm:block tracking-wider">EXIT</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

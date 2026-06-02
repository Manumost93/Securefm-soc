import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PAGE_TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/tickets':     'Gestión de Incidencias',
  '/tickets/new': 'Nueva Incidencia',
  '/soc':         'SOC Security Center',
  '/audit':       'WebSec Auditor',
  '/users':       'Gestión de Usuarios',
  '/profile':     'Perfil',
};

const Navbar: React.FC = () => {
  const { logout, user, isTechnician } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [criticalCount, setCriticalCount] = useState(0);
  const [showBell, setShowBell] = useState(false);

  const title = Object.entries(PAGE_TITLES)
    .sort(([a], [b]) => b.length - a.length)
    .find(([p]) => location.pathname.startsWith(p))?.[1] || 'SecureFM SOC';

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
  const dateStr = `${pad(time.getDate())}/${pad(time.getMonth() + 1)}/${time.getFullYear()}`;

  return (
    <header className="h-14 flex items-center justify-between px-6 shrink-0" style={{
      background: '#FFFCF6',
      borderBottom: '1px solid #D8C8B5',
    }}>

      {/* Left — título de página */}
      <div className="flex items-center gap-3">
        <div className="w-px h-4 rounded-full" style={{ background: '#D8C8B5' }} />
        <h1 className="font-sans font-semibold text-sm" style={{ color: '#1F1C18', letterSpacing: '0.01em' }}>
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Reloj */}
        <div className="hidden md:flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums" style={{ color: '#6F6558' }}>{timeStr}</span>
          <span className="font-sans text-xs" style={{ color: '#C4B8AA' }}>·</span>
          <span className="font-sans text-xs" style={{ color: '#A89C8E' }}>{dateStr}</span>
        </div>

        <div className="w-px h-4 rounded-full" style={{ background: '#D8C8B5' }} />

        {/* Email usuario */}
        <span className="hidden sm:block font-sans text-xs" style={{ color: '#A89C8E' }}>
          {user?.email}
        </span>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setShowBell(!showBell)}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-all"
            style={{
              color: criticalCount > 0 ? '#9F3A32' : '#A89C8E',
              background: criticalCount > 0 ? 'rgba(159,58,50,0.08)' : 'transparent',
            }}>
            <Bell size={15} />
          </button>
          {criticalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold"
              style={{ background: '#9F3A32', color: '#fff', fontSize: '0.55rem' }}>
              {criticalCount > 99 ? '99' : criticalCount}
            </span>
          )}
          {showBell && (
            <div className="absolute right-0 top-10 w-60 rounded-md z-50 p-4" style={{
              background: '#FFFCF6',
              border: '1px solid #D8C8B5',
              boxShadow: '0 8px 24px rgba(31,28,24,0.12)',
            }}>
              <p className="font-sans text-sm font-medium mb-1" style={{ color: '#9F3A32' }}>
                {criticalCount} eventos críticos
              </p>
              <p className="font-sans text-xs" style={{ color: '#A89C8E' }}>Revisa el SOC Dashboard</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={logout}
          className="flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-md transition-all"
          style={{ color: '#A89C8E', border: '1px solid transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#9F3A32';
            e.currentTarget.style.background = 'rgba(159,58,50,0.07)';
            e.currentTarget.style.borderColor = 'rgba(159,58,50,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#A89C8E';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}>
          <LogOut size={13} />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

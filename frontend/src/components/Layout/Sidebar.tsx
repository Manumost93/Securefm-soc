import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Shield, Search, Users, UserCircle, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/tickets', label: 'Incidencias', icon: Ticket },
  { to: '/soc', label: 'SOC Center', icon: Shield },
  { to: '/audit', label: 'WebSec Audit', icon: Search },
];

const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <aside className="w-56 flex flex-col shrink-0" style={{
      background: 'linear-gradient(180deg, #04060e 0%, #02030a 100%)',
      borderRight: '1px solid rgba(200,147,26,0.1)',
    }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(200,147,26,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center" style={{
            background: 'rgba(200,147,26,0.06)',
            border: '1px solid rgba(200,147,26,0.3)',
            borderRadius: '4px',
            boxShadow: '0 0 18px rgba(200,147,26,0.15)',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}>
            <Shield size={16} style={{ color: '#c8931a', filter: 'drop-shadow(0 0 4px rgba(200,147,26,0.8))' }} />
          </div>
          <div>
            <p className="font-mono font-bold text-sm tracking-wider" style={{ color: '#c8931a', textShadow: '0 0 10px rgba(200,147,26,0.5)' }}>
              SECUREFM
            </p>
            <p className="font-mono text-xs" style={{ color: '#2a3a4a' }}>SOC_PLATFORM</p>
          </div>
        </div>

        {/* System status */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse_gold" style={{ background: '#c8931a', boxShadow: '0 0 5px rgba(200,147,26,0.8)' }} />
          <span className="font-mono text-xs" style={{ color: '#1e2a3a', letterSpacing: '0.08em' }}>SYS.ONLINE</span>
          <span className="font-mono text-xs ml-auto" style={{ color: '#1a2030' }}>v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-3 pt-3 pb-1.5 font-mono text-xs" style={{ color: '#1a2030', letterSpacing: '0.12em' }}>
          ── MÓDULOS
        </p>
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={13} />
            {label}
          </NavLink>
        ))}

        <p className="px-3 pt-4 pb-1.5 font-mono text-xs" style={{ color: '#1a2030', letterSpacing: '0.12em' }}>
          ── CUENTA
        </p>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <UserCircle size={13} />
          Perfil
        </NavLink>

        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1.5 font-mono text-xs" style={{ color: '#1a2030', letterSpacing: '0.12em' }}>
              ── ADMIN
            </p>
            <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={13} />
              Usuarios
            </NavLink>
          </>
        )}
      </nav>

      <div className="px-4"><div className="gold-line" /></div>

      {/* User footer */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded" style={{
          background: 'rgba(200,147,26,0.04)',
          border: '1px solid rgba(200,147,26,0.08)',
        }}>
          <div className="w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0" style={{
            background: 'rgba(200,147,26,0.1)',
            border: '1px solid rgba(200,147,26,0.3)',
            color: '#c8931a',
            boxShadow: '0 0 8px rgba(200,147,26,0.12)',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs truncate" style={{ color: '#4a5a6a' }}>{user?.name}</p>
            <p className="font-mono text-xs" style={{ color: '#c8931a', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
              ● {user?.role?.toUpperCase()}
            </p>
          </div>
          <Cpu size={11} style={{ color: '#1a2030', marginLeft: 'auto', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

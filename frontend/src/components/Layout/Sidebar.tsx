import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Shield, Search, Users, UserCircle } from 'lucide-react';
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
      background: '#1F1C18',
      borderRight: '1px solid rgba(255,252,246,0.07)',
    }}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,252,246,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-md" style={{
            background: 'rgba(176,138,87,0.15)',
            border: '1px solid rgba(176,138,87,0.3)',
          }}>
            <Shield size={15} style={{ color: '#B08A57' }} />
          </div>
          <div>
            <p className="font-display font-semibold text-sm" style={{ color: '#FFFCF6', letterSpacing: '0.01em', lineHeight: 1.2 }}>
              SecureFM
            </p>
            <p className="font-sans text-xs" style={{ color: 'rgba(255,252,246,0.3)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>
              SOC Platform
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#5F6F52' }} />
          <span className="font-sans text-xs" style={{ color: 'rgba(255,252,246,0.25)', letterSpacing: '0.03em', fontSize: '0.6875rem' }}>
            Sistema activo
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 pt-4">
        <p className="px-3 pb-2 font-sans text-xs font-medium" style={{ color: 'rgba(255,252,246,0.2)', letterSpacing: '0.07em', fontSize: '0.6rem', textTransform: 'uppercase' }}>
          Módulos
        </p>
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={14} />
            {label}
          </NavLink>
        ))}

        <p className="px-3 pt-5 pb-2 font-sans text-xs font-medium" style={{ color: 'rgba(255,252,246,0.2)', letterSpacing: '0.07em', fontSize: '0.6rem', textTransform: 'uppercase' }}>
          Cuenta
        </p>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <UserCircle size={14} />
          Perfil
        </NavLink>

        {isAdmin && (
          <>
            <p className="px-3 pt-5 pb-2 font-sans text-xs font-medium" style={{ color: 'rgba(255,252,246,0.2)', letterSpacing: '0.07em', fontSize: '0.6rem', textTransform: 'uppercase' }}>
              Administración
            </p>
            <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={14} />
              Usuarios
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,252,246,0.07)', margin: '0 12px' }} />

      {/* User footer */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md" style={{
          background: 'rgba(255,252,246,0.05)',
        }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center font-sans font-semibold text-xs shrink-0" style={{
            background: 'rgba(176,138,87,0.2)',
            color: '#B08A57',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-sans text-xs font-medium truncate" style={{ color: 'rgba(255,252,246,0.7)' }}>
              {user?.name}
            </p>
            <p className="font-sans text-xs" style={{ color: '#B08A57', fontSize: '0.6rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

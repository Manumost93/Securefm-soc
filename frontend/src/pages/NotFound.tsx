import { Link } from 'react-router-dom';
import { ShieldOff, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
        <ShieldOff size={36} className="text-red-400" />
      </div>
      <h1 className="text-6xl font-bold text-white font-mono mb-2">404</h1>
      <p className="text-slate-400 mb-6">Página no encontrada</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <Home size={15} /> Volver al inicio
      </Link>
    </div>
  </div>
);

export default NotFoundPage;

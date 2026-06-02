const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full animate-spin"
        style={{ border: '2px solid rgba(0,229,255,0.1)', borderTopColor: '#00e5ff', boxShadow: '0 0 12px rgba(0,229,255,0.3)' }} />
    </div>
    <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#1a3040' }}>{message}</p>
  </div>
);

export default LoadingSpinner;

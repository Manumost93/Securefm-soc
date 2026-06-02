const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="relative w-9 h-9">
      <div className="absolute inset-0 rounded-full animate-spin"
        style={{ border: '2px solid #EFE6D8', borderTopColor: '#B08A57' }} />
    </div>
    <p className="font-sans text-xs" style={{ color: '#A89C8E', letterSpacing: '0.03em' }}>{message}</p>
  </div>
);

export default LoadingSpinner;

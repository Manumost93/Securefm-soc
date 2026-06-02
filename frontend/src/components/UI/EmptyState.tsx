import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{
      background: '#EFE6D8',
      border: '1px solid #D8C8B5',
    }}>
      <Icon size={24} style={{ color: '#A89C8E' }} />
    </div>
    <div>
      <p className="font-sans font-medium text-sm" style={{ color: '#1F1C18' }}>{title}</p>
      {description && <p className="font-sans text-sm mt-1" style={{ color: '#A89C8E' }}>{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;

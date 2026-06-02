import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center">
      <Icon size={28} className="text-slate-600" />
    </div>
    <div>
      <p className="text-white font-medium">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;

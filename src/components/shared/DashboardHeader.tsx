import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  actionButton?: React.ReactNode;
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  onRefresh,
  loading = false,
  actionButton,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-xl">
            <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actionButton}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;


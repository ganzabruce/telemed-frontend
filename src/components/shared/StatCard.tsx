import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  gradient?: string; // e.g., 'from-blue-500 to-blue-600'
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  value, 
  label, 
  gradient = 'from-blue-500 to-blue-600',
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{label}</h3>
    </div>
  );
};

export default StatCard;


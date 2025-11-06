import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

type StatusType = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'ACTIVE' | 'INACTIVE' | 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'VERIFIED' | 'UNVERIFIED' | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<string, { color: string; icon?: React.ReactNode; label?: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
  CONFIRMED: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Confirmed' },
  COMPLETED: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" />, label: 'Cancelled' },
  ACTIVE: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Active' },
  INACTIVE: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <XCircle className="w-3 h-3" />, label: 'Inactive' },
  AVAILABLE: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Available' },
  BUSY: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="w-3 h-3" />, label: 'Busy' },
  OFFLINE: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <XCircle className="w-3 h-3" />, label: 'Offline' },
  VERIFIED: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Verified' },
  UNVERIFIED: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <AlertCircle className="w-3 h-3" />, label: 'Unverified' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true,
  className = '' 
}) => {
  const config = statusConfig[status] || { 
    color: 'bg-gray-100 text-gray-700 border-gray-200', 
    label: status 
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${config.color} ${sizeClasses[size]} ${className}`}>
      {showIcon && config.icon}
      {config.label || status}
    </span>
  );
};

export default StatusBadge;


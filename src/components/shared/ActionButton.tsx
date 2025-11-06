import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';

interface ActionButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const sizeMap = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  } as const;

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={sizeMap[size]}
      disabled={disabled}
      className={className}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </Button>
  );
};

export default ActionButton;


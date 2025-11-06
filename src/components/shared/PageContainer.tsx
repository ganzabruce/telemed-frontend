import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = '',
  padding = true 
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${padding ? 'p-4 md:p-6' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;


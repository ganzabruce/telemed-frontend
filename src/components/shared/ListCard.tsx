import React from 'react';

interface ListCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

const ListCard: React.FC<ListCardProps> = ({ 
  title, 
  children, 
  className = '',
  headerAction,
  emptyMessage = 'No items found',
  emptyIcon
}) => {
  const isEmpty = React.Children.count(children) === 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </div>
      <div className="p-6">
        {isEmpty ? (
          <div className="text-center py-12">
            {emptyIcon}
            <p className="text-gray-600 mt-4">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ListCard;


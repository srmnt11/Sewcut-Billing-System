import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  actionIcon?: React.ElementType;
};

export default function PageHeader({ 
  title, 
  description, 
  action, 
  actionLabel = "Add New",
  actionIcon: ActionIcon = Plus 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {action && (
        <Button 
          onClick={action}
          className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
        >
          <ActionIcon className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

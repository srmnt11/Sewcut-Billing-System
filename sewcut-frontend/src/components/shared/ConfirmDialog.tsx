import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: DialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<DialogVariant, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'neu-press',
    iconColor: 'text-rose-600',
    confirmClass: 'neu-press text-rose-600 hover:text-rose-700',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'neu-press',
    iconColor: 'text-amber-600',
    confirmClass: 'neu-press text-amber-700 hover:text-amber-800',
  },
  info: {
    icon: Info,
    iconBg: 'neu-press',
    iconColor: 'text-blue-600',
    confirmClass: 'neu-press text-blue-700 hover:text-blue-800',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'neu-press',
    iconColor: 'text-emerald-600',
    confirmClass: 'neu-press text-emerald-700 hover:text-emerald-800',
  },
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', config.iconBg)}>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div>
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={config.confirmClass}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

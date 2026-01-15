import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { cn } from '../lib/utils';
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
export function FormSection({
  title,
  children,
  className
}: FormSectionProps) {
  return <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
        <CardTitle className="text-lg font-medium text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>;
}
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'gradient' | 'dark';
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = 'default' 
}: StatsCardProps) {
  const variants = {
    default: 'bg-white',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
    dark: 'bg-slate-900 text-white'
  };

  return (
    <Card className={cn(
      "relative overflow-hidden p-6 border-0 shadow-sm hover:shadow-md transition-shadow duration-300",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            variant === 'default' ? 'text-slate-500' : 'text-white/80'
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            variant === 'default' ? 'text-slate-900' : 'text-white'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              variant === 'default' ? 'text-slate-500' : 'text-white/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trend === 'up' 
                  ? variant === 'default' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/20 text-white'
                  : variant === 'default' ? 'bg-red-100 text-red-700' : 'bg-white/20 text-white'
              )}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl",
            variant === 'default' 
              ? 'bg-slate-100' 
              : 'bg-white/20'
          )}>
            <Icon className={cn(
              "w-6 h-6",
              variant === 'default' ? 'text-slate-600' : 'text-white'
            )} />
          </div>
        )}
      </div>
      
      {/* Decorative element */}
      <div className={cn(
        "absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10",
        variant === 'default' ? 'bg-slate-900' : 'bg-white'
      )} />
    </Card>
  );
}

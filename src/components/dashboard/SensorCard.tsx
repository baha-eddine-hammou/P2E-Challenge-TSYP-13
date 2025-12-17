import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status: 'normal' | 'warning' | 'critical';
  color: string;
}

const SensorCard = ({ title, value, unit, icon, trend, status, color }: SensorCardProps) => {
  const statusColors = {
    normal: 'bg-hydro-emerald/10 border-hydro-emerald/20',
    warning: 'bg-hydro-amber/10 border-hydro-amber/20',
    critical: 'bg-destructive/10 border-destructive/20',
  };

  const statusDotColors = {
    normal: 'bg-hydro-emerald',
    warning: 'bg-hydro-amber',
    critical: 'bg-destructive',
  };

  return (
    <div className={cn(
      'rounded-2xl border p-6 transition-all duration-300 hover:shadow-md',
      statusColors[status]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full animate-pulse', statusDotColors[status])} />
          <span className="text-xs font-medium text-muted-foreground capitalize">{status}</span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {trend && (
        <div className={cn(
          'mt-3 inline-flex items-center gap-1 text-xs font-medium',
          trend.isPositive ? 'text-hydro-emerald' : 'text-destructive'
        )}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% from last hour</span>
        </div>
      )}
    </div>
  );
};

export default SensorCard;

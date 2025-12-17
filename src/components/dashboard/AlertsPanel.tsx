import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const AlertsPanel = ({ alerts: initialAlerts }: AlertsPanelProps) => {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const alertStyles = {
    warning: {
      bg: 'bg-hydro-amber/10 border-hydro-amber/20',
      icon: AlertTriangle,
      iconColor: 'text-hydro-amber',
    },
    success: {
      bg: 'bg-hydro-emerald/10 border-hydro-emerald/20',
      icon: CheckCircle,
      iconColor: 'text-hydro-emerald',
    },
    info: {
      bg: 'bg-hydro-ocean/10 border-hydro-ocean/20',
      icon: Info,
      iconColor: 'text-hydro-ocean',
    },
  };

  return (
    <div className="hydro-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">Recent Alerts</h3>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-hydro-emerald" />
            <p>All systems running smoothly!</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = alertStyles[alert.type];
            const Icon = style.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border transition-all',
                  style.bg
                )}
              >
                <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', style.iconColor)} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">{alert.time}</span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;

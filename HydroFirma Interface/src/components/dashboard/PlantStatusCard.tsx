import { Leaf, Droplets, Sun, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plant {
  id: string;
  name: string;
  type: string;
  health: number;
  stage: string;
  daysToHarvest: number;
  lastWatered: string;
}

interface PlantStatusCardProps {
  plant: Plant;
}

const PlantStatusCard = ({ plant }: PlantStatusCardProps) => {
  const healthColor =
    plant.health >= 80 ? 'text-hydro-emerald' :
    plant.health >= 60 ? 'text-hydro-amber' : 'text-destructive';

  const healthBg =
    plant.health >= 80 ? 'bg-hydro-emerald' :
    plant.health >= 60 ? 'bg-hydro-amber' : 'bg-destructive';

  return (
    <div className="hydro-card p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl bg-hydro-leaf/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Leaf className="w-7 h-7 text-hydro-leaf" />
        </div>
        <div className="text-right">
          <span className={cn('text-2xl font-bold font-display', healthColor)}>
            {plant.health}%
          </span>
          <p className="text-xs text-muted-foreground">Health</p>
        </div>
      </div>

      {/* Health Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-500', healthBg)}
          style={{ width: `${plant.health}%` }}
        />
      </div>

      <h3 className="font-display text-lg font-semibold text-foreground mb-1">{plant.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{plant.type}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Sun className="w-4 h-4 text-hydro-amber" />
          <span className="text-muted-foreground">{plant.stage}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-hydro-teal" />
          <span className="text-muted-foreground">{plant.daysToHarvest}d to harvest</span>
        </div>
        <div className="col-span-2 flex items-center gap-2 text-sm">
          <Droplets className="w-4 h-4 text-hydro-ocean" />
          <span className="text-muted-foreground">Last watered: {plant.lastWatered}</span>
        </div>
      </div>
    </div>
  );
};

export default PlantStatusCard;

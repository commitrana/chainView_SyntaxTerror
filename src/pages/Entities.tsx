import { Building2, Factory, Store, Warehouse } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { entities } from '@/data/mockData';
import { cn } from '@/lib/utils';

const typeIcons = {
  Factory: Factory,
  Distributor: Building2,
  Retailer: Store,
  Warehouse: Warehouse,
};

const typeColors = {
  Factory: 'bg-primary/10 text-primary',
  Distributor: 'bg-info/10 text-info',
  Retailer: 'bg-success/10 text-success',
  Warehouse: 'bg-warning/10 text-warning',
};

export default function Entities() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Entities</h1>
        <p className="mt-1 text-sm text-muted-foreground">Factories, distributors, warehouses, and retailers</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entities.map(entity => {
          const Icon = typeIcons[entity.type];
          return (
            <div key={entity.id} className="rounded-xl border border-border bg-card p-5 stat-card-hover">
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', typeColors[entity.type])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-heading text-sm font-semibold text-foreground">{entity.name}</h3>
                  <p className="text-xs text-muted-foreground">{entity.type} · {entity.location}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-semibold text-foreground">{entity.acceptanceRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Acceptance</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{entity.rejectionRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Rejection</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{entity.avgProcessingTime}</p>
                  <p className="text-[10px] text-muted-foreground">Avg. Time</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Acceptance Rate</span>
                  <span>{entity.acceptanceRate}%</span>
                </div>
                <Progress value={entity.acceptanceRate} className="h-1.5" />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {entity.productsHandled.toLocaleString()} products handled
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

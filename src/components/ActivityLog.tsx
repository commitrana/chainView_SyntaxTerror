import { QrCode, Shield, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityEntry } from '@/data/mockData';

const typeConfig = {
  scan: { icon: QrCode, color: 'text-success' },
  override: { icon: Shield, color: 'text-warning' },
  reroute: { icon: RotateCcw, color: 'text-primary' },
  system: { icon: Info, color: 'text-muted-foreground' },
};

export default function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const config = typeConfig[entry.type];
        const Icon = config.icon;
        return (
          <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
            <div className={cn('mt-0.5', config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{entry.action}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {entry.timestamp} · {entry.actor}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

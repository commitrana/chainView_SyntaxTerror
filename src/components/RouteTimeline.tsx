import { Check, Circle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RouteStep, StepStatus } from '@/data/mockData';

const stepConfig: Record<StepStatus, { icon: typeof Check; color: string; lineColor: string }> = {
  completed: { icon: Check, color: 'bg-success text-success-foreground', lineColor: 'bg-success' },
  current: { icon: Circle, color: 'bg-primary text-primary-foreground', lineColor: 'bg-border' },
  pending: { icon: Clock, color: 'bg-muted text-muted-foreground', lineColor: 'bg-border' },
  skipped: { icon: AlertTriangle, color: 'bg-destructive text-destructive-foreground', lineColor: 'bg-destructive/30' },
};

export default function RouteTimeline({ steps }: { steps: RouteStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const config = stepConfig[step.status];
        const Icon = config.icon;
        const isLast = i === steps.length - 1;

        return (
          <div key={i} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && <div className={cn('w-0.5 flex-1 min-h-[2rem]', config.lineColor)} />}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p className={cn('text-sm font-medium', step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                {step.level}
              </p>
              {step.timestamp && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.timestamp} · {step.scannedBy}
                </p>
              )}
              {step.status === 'skipped' && (
                <p className="mt-0.5 text-xs text-destructive">Checkpoint skipped — flagged</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

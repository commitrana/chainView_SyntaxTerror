import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/data/mockData';

const statusStyles: Record<ProductStatus, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Rerouted: 'bg-primary/10 text-primary border-primary/20',
  Flagged: 'bg-warning/10 text-warning border-warning/20',
};

export default function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', statusStyles[status])}>
      {status}
    </span>
  );
}

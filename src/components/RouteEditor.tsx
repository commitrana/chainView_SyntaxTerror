import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { RouteStep, SupplyChainLevel } from '@/data/mockData';

const ALL_LEVELS: SupplyChainLevel[] = ['Factory', 'Quality Check', 'Warehouse', 'Distributor', 'Retailer', 'Customer'];

interface RouteEditorProps {
  steps: RouteStep[];
  routeVersion: number;
  onSave: (steps: RouteStep[], newVersion: number) => void;
}

export default function RouteEditor({ steps, routeVersion, onSave }: RouteEditorProps) {
  const [editableSteps, setEditableSteps] = useState<RouteStep[]>(steps);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newLevel, setNewLevel] = useState<SupplyChainLevel | ''>('');
  const [modified, setModified] = useState(false);

  const futureStart = editableSteps.findIndex(s => s.status === 'pending');
  const canEdit = futureStart !== -1;

  const moveFutureStep = (idx: number, dir: -1 | 1) => {
    if (idx < futureStart) return;
    const targetIdx = idx + dir;
    if (targetIdx < futureStart || targetIdx >= editableSteps.length) return;
    const copy = [...editableSteps];
    [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
    setEditableSteps(copy);
    setModified(true);
  };

  const removeFutureStep = (idx: number) => {
    if (idx < futureStart) return;
    setEditableSteps(prev => prev.filter((_, i) => i !== idx));
    setModified(true);
  };

  const addStep = () => {
    if (!newLevel) return;
    setEditableSteps(prev => [...prev, { level: newLevel as SupplyChainLevel, status: 'pending' }]);
    setNewLevel('');
    setModified(true);
  };

  const handleSave = () => {
    onSave(editableSteps, routeVersion + 1);
    setModified(false);
    setShowConfirm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-sm font-semibold text-foreground">Route Editor</h3>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">v{routeVersion}</span>
          {modified && (
            <span className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs text-warning">
              <Shield className="h-3 w-3" /> Modified
            </span>
          )}
        </div>
        {modified && (
          <Button size="sm" onClick={() => setShowConfirm(true)} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Route
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {editableSteps.map((step, i) => {
          const isFuture = i >= futureStart && futureStart !== -1;
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-foreground">{step.level}</span>
              <span className="text-xs text-muted-foreground capitalize">{step.status}</span>
              {isFuture && (
                <div className="flex items-center gap-1">
                  <button onClick={() => moveFutureStep(i, -1)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveFutureStep(i, 1)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeFutureStep(i)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Select value={newLevel} onValueChange={(v) => setNewLevel(v as SupplyChainLevel)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add a step..." />
            </SelectTrigger>
            <SelectContent>
              {ALL_LEVELS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={addStep} disabled={!newLevel}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Route Modification</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the product route to version {routeVersion + 1}. The product will be marked as "Rerouted" and a badge will be applied. This action is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Confirm & Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

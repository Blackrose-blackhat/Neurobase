import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RowDetailsProps {
  row: any;
  isOpen: boolean;
  onClose: () => void;
}

export function RowDetails({ row, isOpen, onClose }: RowDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Row Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(row).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">{key}</div>
              <div className="col-span-2 break-words">
                {formatValue(value)}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  
  return String(value);
} 
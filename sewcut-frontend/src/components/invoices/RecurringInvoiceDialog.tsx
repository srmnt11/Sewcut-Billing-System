import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Repeat, Clock } from 'lucide-react';

interface RecurringInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: RecurringConfig) => void;
  invoiceId?: string;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  startDate: string;
  endDate?: string;
  endAfterOccurrences?: number;
  autoSend: boolean;
  reminderDays: number;
}

export default function RecurringInvoiceDialog({ 
  open, 
  onClose, 
  onSave,
  invoiceId 
}: RecurringInvoiceDialogProps) {
  const [config, setConfig] = useState<RecurringConfig>({
    frequency: 'monthly',
    interval: 1,
    startDate: new Date().toISOString().split('T')[0],
    autoSend: false,
    reminderDays: 3
  });

  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>('never');

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-amber-600" />
            Set Up Recurring Invoice
          </DialogTitle>
          <DialogDescription>
            Create a schedule to automatically generate this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frequency</Label>
              <Select
                value={config.frequency}
                onValueChange={(value: RecurringConfig['frequency']) => 
                  setConfig(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Every</Label>
              <Input
                type="number"
                min="1"
                value={config.interval}
                onChange={(e) => setConfig(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* End Options */}
          <div>
            <Label>Ends</Label>
            <Select value={endType} onValueChange={(value: any) => setEndType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="date">On specific date</SelectItem>
                <SelectItem value="occurrences">After number of occurrences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {endType === 'date' && (
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={config.endDate || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1"
              />
            </div>
          )}

          {endType === 'occurrences' && (
            <div>
              <Label>Number of Occurrences</Label>
              <Input
                type="number"
                min="1"
                value={config.endAfterOccurrences || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, endAfterOccurrences: parseInt(e.target.value) }))}
                className="mt-1"
                placeholder="e.g., 12"
              />
            </div>
          )}

          {/* Auto Send */}
          <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
            <Checkbox
              id="autoSend"
              checked={config.autoSend}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoSend: checked as boolean }))}
            />
            <label htmlFor="autoSend" className="text-sm font-medium cursor-pointer">
              Automatically send invoice to client
            </label>
          </div>

          {/* Reminder */}
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Send Reminder (days before due)
            </Label>
            <Input
              type="number"
              min="0"
              value={config.reminderDays}
              onChange={(e) => setConfig(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600">
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

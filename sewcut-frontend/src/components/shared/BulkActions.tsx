import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedCount: number;
  onExport: (format: 'csv' | 'pdf') => void;
  onImport: (file: File) => void;
  onBulkDelete?: () => void;
  onBulkStatusChange?: (status: string) => void;
  entityType: 'clients' | 'invoices' | 'quotations' | 'suppliers';
  availableStatuses?: string[];
}

export default function BulkActions({ 
  selectedCount, 
  onExport, 
  onImport,
  onBulkDelete,
  onBulkStatusChange,
  entityType,
  availableStatuses = ['active', 'inactive']
}: BulkActionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      await onExport(format);
      toast.success(`${entityType} exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await onImport(file);
      toast.success(`${entityType} imported successfully`);
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-gradient-to-b from-white to-slate-50/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Download className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Bulk Actions</CardTitle>
            {selectedCount > 0 && (
              <p className="text-xs text-amber-600 font-medium">{selectedCount} item{selectedCount > 1 ? 's' : ''} selected</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex-1 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex-1 rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          disabled={isImporting}
          className="w-full rounded-xl hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Import from CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedCount > 0 && (
          <>
            {onBulkStatusChange && availableStatuses && availableStatuses.length > 0 && (
              <div className="pt-3 border-t border-slate-200/80">
                <Label className="text-xs text-slate-500 mb-2 block font-medium">Change Status</Label>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => onBulkStatusChange(status)}
                      className="flex-1 text-xs rounded-lg capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                className="w-full rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedCount})
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

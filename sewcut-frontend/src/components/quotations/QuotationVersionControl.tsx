import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock,
  Check,
  X,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface QuotationVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  changes: string[];
  total: number;
}

interface QuotationVersionControlProps {
  quotationId: string;
  versions: QuotationVersion[];
  currentVersion: number;
  onRestore: (versionId: string) => void;
  onCompare: (v1: string, v2: string) => void;
}

export default function QuotationVersionControl({ 
  quotationId,
  versions,
  currentVersion,
  onRestore,
  onCompare
}: QuotationVersionControlProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(prev => prev.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, versionId]);
    }
  };

  const statusIcons = {
    draft: Clock,
    sent: FileText,
    approved: Check,
    rejected: X
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Version History</CardTitle>
          {selectedVersions.length === 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCompare(selectedVersions[0], selectedVersions[1])}
            >
              <Eye className="w-4 h-4 mr-2" />
              Compare
            </Button>
          )}
        </div>
        {selectedVersions.length > 0 && (
          <p className="text-xs text-slate-600">
            Select 2 versions to compare
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No version history available
            </p>
          ) : (
            versions.map((version) => {
              const StatusIcon = statusIcons[version.status];
              const isSelected = selectedVersions.includes(version.id);
              const isCurrent = version.version === currentVersion;
              
              return (
                <div
                  key={version.id}
                  className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                  onClick={() => handleVersionSelect(version.id)}
                >
                  {/* Current Badge */}
                  {isCurrent && (
                    <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
                      Current
                    </Badge>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Version Number */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-slate-200 font-bold text-slate-700">
                      v{version.version}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={statusColors[version.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {version.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {format(new Date(version.createdAt), 'MMM d, yyyy • h:mm a')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-1">
                        Created by <span className="font-medium">{version.createdBy}</span>
                      </p>
                      
                      <p className="text-sm font-semibold text-slate-900 mb-2">
                        ₱{version.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>

                      {/* Changes */}
                      {version.changes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs font-medium text-slate-700 mb-1">Changes:</p>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {version.changes.slice(0, 2).map((change, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-amber-500">•</span>
                                {change}
                              </li>
                            ))}
                            {version.changes.length > 2 && (
                              <li className="text-slate-500 italic">
                                +{version.changes.length - 2} more changes
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCurrent && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(version.id);
                        }}
                        className="flex-1 text-xs"
                      >
                        Restore
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

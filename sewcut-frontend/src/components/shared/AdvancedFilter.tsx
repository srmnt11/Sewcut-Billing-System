import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  User,
  Tag,
  Check,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  dateRange?: { start: string; end: string };
  amountRange?: { min: number; max: number };
  status?: string[];
  clients?: string[];
  categories?: string[];
  search?: string;
}

interface AdvancedFilterProps {
  filters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  availableStatuses?: string[];
  availableClients?: Array<{ id: string; name: string }>;
  availableCategories?: string[];
  maxAmount?: number;
}

export default function AdvancedFilter({
  filters,
  onFilterChange,
  availableStatuses = [],
  availableClients = [],
  availableCategories = [],
  maxAmount = 100000
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterConfig>(filters);
  const [amountRange, setAmountRange] = useState<[number, number]>([
    filters.amountRange?.min || 0,
    filters.amountRange?.max || maxAmount
  ]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, availableStatuses, availableClients, availableCategories, filters]);

  const activeFilterCount = 
    (filters.status?.length || 0) +
    (filters.clients?.length || 0) +
    (filters.categories?.length || 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.amountRange ? 1 : 0);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterConfig = {};
    setLocalFilters(emptyFilters);
    setAmountRange([0, maxAmount]);
    onFilterChange(emptyFilters);
  };

  const toggleArrayFilter = (key: keyof FilterConfig, value: string) => {
    const current = (localFilters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    setLocalFilters(prev => ({
      ...prev,
      [key]: updated.length > 0 ? updated : undefined
    }));
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full group relative overflow-hidden rounded-2xl border transition-all duration-500 ease-out",
          isOpen 
            ? "border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-lg shadow-amber-500/10" 
            : "border-slate-200/80 bg-gradient-to-r from-white to-slate-50/50 shadow-sm hover:shadow-md hover:border-amber-200/60"
        )}
      >
        {/* Animated background glow */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} />
        
        <div className="relative z-10 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
              isOpen
                ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 scale-110"
                : "bg-gradient-to-br from-amber-100 to-amber-200 group-hover:from-amber-200 group-hover:to-amber-300 group-hover:scale-105"
            )}>
              <SlidersHorizontal className={cn(
                "w-5 h-5 transition-all duration-500",
                isOpen ? "text-white rotate-180" : "text-amber-600 group-hover:text-amber-700"
              )} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-[15px]">Advanced Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold px-1.5 shadow-sm shadow-amber-500/30 animate-in fade-in duration-300">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <span className="text-slate-500 text-xs">
                {isOpen ? 'Click to collapse' : 'Refine your search with multiple criteria'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && !isOpen && (
              <div className="flex items-center gap-1 mr-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-600">{activeFilterCount} active</span>
              </div>
            )}
            {activeFilterCount > 0 && isOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleClearFilters(); }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl h-8 px-2.5 text-xs"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear All
              </Button>
            )}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
              isOpen 
                ? "bg-amber-100 rotate-180" 
                : "bg-slate-100 group-hover:bg-amber-50"
            )}>
              <ChevronDown className={cn(
                "w-4 h-4 transition-colors duration-300",
                isOpen ? "text-amber-600" : "text-slate-400 group-hover:text-amber-500"
              )} />
            </div>
          </div>
        </div>
      </button>

      {/* Animated Collapsible Content */}
      <div 
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{ 
          maxHeight: isOpen ? `${contentHeight + 40}px` : '0px',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)'
        }}
      >
        <div ref={contentRef} className="pt-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 p-5 space-y-4">
            {/* Filter Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "justify-between rounded-xl transition-all duration-300 h-12 group/btn hover:shadow-md",
                      filters.dateRange 
                        ? "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 shadow-sm shadow-amber-100 hover:shadow-amber-200" 
                        : "hover:border-amber-200 hover:bg-amber-50/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                        filters.dateRange 
                          ? "bg-amber-500 text-white shadow-sm" 
                          : "bg-amber-100 text-amber-600 group-hover/btn:bg-amber-200"
                      )}>
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium">Date Range</span>
                    </div>
                    {filters.dateRange && (
                      <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-500 text-[10px] px-1.5 h-5 shadow-sm">
                        1
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-xl shadow-xl border-slate-200/80 p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Select Date Range
                    </p>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</label>
                      <Input
                        type="date"
                        value={localFilters.dateRange?.start || ''}
                        onChange={(e) => setLocalFilters(prev => ({
                          ...prev,
                          dateRange: {
                            start: e.target.value,
                            end: prev.dateRange?.end || ''
                          }
                        }))}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</label>
                      <Input
                        type="date"
                        value={localFilters.dateRange?.end || ''}
                        onChange={(e) => setLocalFilters(prev => ({
                          ...prev,
                          dateRange: {
                            start: prev.dateRange?.start || '',
                            end: e.target.value
                          }
                        }))}
                        className="mt-1 rounded-lg"
                      />
                    </div>
                    <Button onClick={handleApplyFilters} className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 shadow-sm">
                      <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Amount Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "justify-between rounded-xl transition-all duration-300 h-12 group/btn hover:shadow-md",
                      filters.amountRange 
                        ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-sm shadow-emerald-100 hover:shadow-emerald-200" 
                        : "hover:border-emerald-200 hover:bg-emerald-50/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                        filters.amountRange 
                          ? "bg-emerald-500 text-white shadow-sm" 
                          : "bg-emerald-100 text-emerald-600 group-hover/btn:bg-emerald-200"
                      )}>
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium">Amount</span>
                    </div>
                    {filters.amountRange && (
                      <Badge className="ml-2 bg-emerald-500 text-white hover:bg-emerald-500 text-[10px] px-1.5 h-5 shadow-sm">
                        1
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-xl shadow-xl border-slate-200/80 p-4">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Amount Range
                    </p>
                    <div className="bg-emerald-50/50 rounded-lg px-3 py-2">
                      <label className="text-sm font-medium text-emerald-700">
                        ₱{amountRange[0].toLocaleString()} - ₱{amountRange[1].toLocaleString()}
                      </label>
                    </div>
                    <Slider
                      min={0}
                      max={maxAmount}
                      step={1000}
                      value={amountRange}
                      onValueChange={(value) => setAmountRange(value as [number, number])}
                      className="mt-2"
                    />
                    <Button
                      onClick={() => {
                        setLocalFilters(prev => ({
                          ...prev,
                          amountRange: { min: amountRange[0], max: amountRange[1] }
                        }));
                        handleApplyFilters();
                      }}
                      className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              {availableStatuses.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "justify-between rounded-xl transition-all duration-300 h-12 group/btn hover:shadow-md",
                        (filters.status?.length || 0) > 0 
                          ? "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm shadow-blue-100 hover:shadow-blue-200" 
                          : "hover:border-blue-200 hover:bg-blue-50/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                          (filters.status?.length || 0) > 0 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "bg-blue-100 text-blue-600 group-hover/btn:bg-blue-200"
                        )}>
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      {(filters.status?.length || 0) > 0 && (
                        <Badge className="ml-2 bg-blue-500 text-white hover:bg-blue-500 text-[10px] px-1.5 h-5 shadow-sm">
                          {filters.status?.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 rounded-xl shadow-xl border-slate-200/80 p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-blue-500" />
                        Filter by Status
                      </p>
                      {availableStatuses.map((status) => (
                        <div key={status} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('status', status)}>
                          <Checkbox
                            id={`status-${status}`}
                            checked={(localFilters.status || []).includes(status)}
                            onCheckedChange={() => toggleArrayFilter('status', status)}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {status}
                          </label>
                        </div>
                      ))}
                      <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg bg-blue-500 hover:bg-blue-600 shadow-sm">
                        <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Client Filter */}
              {availableClients.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "justify-between rounded-xl transition-all duration-300 h-12 group/btn hover:shadow-md",
                        (filters.clients?.length || 0) > 0 
                          ? "border-violet-300 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 shadow-sm shadow-violet-100 hover:shadow-violet-200" 
                          : "hover:border-violet-200 hover:bg-violet-50/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                          (filters.clients?.length || 0) > 0 
                            ? "bg-violet-500 text-white shadow-sm" 
                            : "bg-violet-100 text-violet-600 group-hover/btn:bg-violet-200"
                        )}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Clients</span>
                      </div>
                      {(filters.clients?.length || 0) > 0 && (
                        <Badge className="ml-2 bg-violet-500 text-white hover:bg-violet-500 text-[10px] px-1.5 h-5 shadow-sm">
                          {filters.clients?.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 rounded-xl shadow-xl border-slate-200/80 p-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-violet-500" />
                        Filter by Client
                      </p>
                      {availableClients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-violet-50/50 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('clients', client.id)}>
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={(localFilters.clients || []).includes(client.id)}
                            onCheckedChange={() => toggleArrayFilter('clients', client.id)}
                          />
                          <label
                            htmlFor={`client-${client.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {client.name}
                          </label>
                        </div>
                      ))}
                      <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg bg-violet-500 hover:bg-violet-600 shadow-sm">
                        <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "justify-between rounded-xl transition-all duration-300 h-12 group/btn hover:shadow-md",
                        (filters.categories?.length || 0) > 0 
                          ? "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm shadow-orange-100 hover:shadow-orange-200" 
                          : "hover:border-orange-200 hover:bg-orange-50/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                          (filters.categories?.length || 0) > 0 
                            ? "bg-orange-500 text-white shadow-sm" 
                            : "bg-orange-100 text-orange-600 group-hover/btn:bg-orange-200"
                        )}>
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Categories</span>
                      </div>
                      {(filters.categories?.length || 0) > 0 && (
                        <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-500 text-[10px] px-1.5 h-5 shadow-sm">
                          {filters.categories?.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 rounded-xl shadow-xl border-slate-200/80 p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-orange-500" />
                        Filter by Category
                      </p>
                      {availableCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('categories', category)}>
                          <Checkbox
                            id={`category-${category}`}
                            checked={(localFilters.categories || []).includes(category)}
                            onCheckedChange={() => toggleArrayFilter('categories', category)}
                          />
                          <label
                            htmlFor={`category-${category}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                      <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg bg-orange-500 hover:bg-orange-600 shadow-sm">
                        <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Active Filters
                </p>
                <div className="flex flex-wrap gap-2">
                  {filters.dateRange && (
                    <Badge className="gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 hover:from-amber-200 hover:to-orange-200 border-0 rounded-lg px-3 py-1.5 transition-all duration-200 hover:shadow-sm cursor-default">
                      <Calendar className="w-3 h-3" />
                      {filters.dateRange.start} to {filters.dateRange.end}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-amber-900 transition-colors ml-1"
                        onClick={() => {
                          setLocalFilters(prev => ({ ...prev, dateRange: undefined }));
                          onFilterChange({ ...filters, dateRange: undefined });
                        }}
                      />
                    </Badge>
                  )}
                  {filters.amountRange && (
                    <Badge className="gap-1.5 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 hover:from-emerald-200 hover:to-green-200 border-0 rounded-lg px-3 py-1.5 transition-all duration-200 hover:shadow-sm cursor-default">
                      <DollarSign className="w-3 h-3" />
                      ₱{filters.amountRange.min.toLocaleString()} - ₱{filters.amountRange.max.toLocaleString()}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-emerald-900 transition-colors ml-1"
                        onClick={() => {
                          setLocalFilters(prev => ({ ...prev, amountRange: undefined }));
                          onFilterChange({ ...filters, amountRange: undefined });
                          setAmountRange([0, maxAmount]);
                        }}
                      />
                    </Badge>
                  )}
                  {filters.status?.map((status) => (
                    <Badge key={status} className="gap-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 border-0 rounded-lg px-3 py-1.5 capitalize transition-all duration-200 hover:shadow-sm cursor-default">
                      {status}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-blue-900 transition-colors ml-1"
                        onClick={() => {
                          const updated = filters.status?.filter(s => s !== status);
                          onFilterChange({ ...filters, status: updated });
                          setLocalFilters(prev => ({ ...prev, status: updated }));
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

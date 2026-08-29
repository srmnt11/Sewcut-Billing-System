import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  User,
  Tag,
  Check,
  Sparkles,
  SlidersHorizontal,
  CreditCard
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  dateRange?: { start: string; end: string };
  amountRange?: { min: number; max: number };
  status?: string[];
  clients?: string[];
  categories?: string[];
  paymentTypes?: string[];
  search?: string;
}

interface AdvancedFilterProps {
  filters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  availableStatuses?: string[];
  availableClients?: Array<{ id: string; name: string }>;
  availableCategories?: string[];
  availablePaymentTypes?: Array<{ value: string; label: string }>;
  maxAmount?: number;
  showPaymentType?: boolean;
  showDateRange?: boolean;
}

export default function AdvancedFilter({
  filters,
  onFilterChange,
  availableStatuses = [],
  availableClients = [],
  availableCategories = [],
  availablePaymentTypes = [
    { value: 'downpayment', label: '50% Down Payment' },
    { value: 'full', label: 'Full Payment' }
  ],
  maxAmount = 100000,
  showPaymentType = false,
  showDateRange = true
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
    (filters.paymentTypes?.length || 0) +
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
          "w-full group relative overflow-hidden rounded-2xl transition-all duration-300",
          isOpen ? "neu-press" : "neu-surface-soft"
        )}
      >
        <div className="relative z-10 flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 neu-press",
              isOpen ? "scale-105" : "group-hover:scale-105"
            )}>
              <SlidersHorizontal className={cn(
                "w-5 h-5 transition-all duration-300 text-amber-600",
                isOpen ? "rotate-180" : "group-hover:text-amber-700"
              )} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-[15px]">Advanced Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full neu-press text-amber-700 text-[11px] font-bold px-1.5 animate-in fade-in duration-300">
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
                className="text-rose-500 hover:text-rose-600 rounded-xl h-8 px-2.5 text-xs"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear All
              </Button>
            )}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 neu-press",
              isOpen ? "rotate-180" : ""
            )}>
              <ChevronDown className={cn(
                "w-4 h-4 transition-colors duration-300",
                isOpen ? "text-amber-600" : "text-slate-400"
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
          <div className="rounded-2xl neu-surface-soft p-3.5 sm:p-5 space-y-4">
            {/* Filter Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* Date Range Filter */}
              {showDateRange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "justify-between rounded-xl transition-all duration-200 h-12 group/btn",
                      filters.dateRange ? "neu-press text-amber-700" : "neu-surface-soft text-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 neu-press",
                        filters.dateRange ? "text-amber-600" : "text-slate-500"
                      )}>
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium">Date Range</span>
                    </div>
                    {filters.dateRange && (
                      <Badge className="ml-2 neu-chip text-amber-700 text-[10px] px-1.5 h-5">
                        1
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-2xl neu-surface-soft p-4">
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
                    <Button onClick={handleApplyFilters} className="w-full rounded-lg">
                      <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              )}
              
              {/* Amount Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "justify-between rounded-xl transition-all duration-200 h-12 group/btn",
                      filters.amountRange ? "neu-press text-emerald-700" : "neu-surface-soft text-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 neu-press",
                        filters.amountRange ? "text-emerald-600" : "text-slate-500"
                      )}>
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium">Amount</span>
                    </div>
                    {filters.amountRange && (
                      <Badge className="ml-2 neu-chip text-emerald-700 text-[10px] px-1.5 h-5">
                        1
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-2xl neu-surface-soft p-4">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Amount Range
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Min</label>
                        <Input
                          type="number"
                          min={0}
                          value={amountRange[0]}
                          onChange={(e) => {
                            const value = Math.min(Math.max(Number(e.target.value) || 0, 0), amountRange[1]);
                            setAmountRange([value, amountRange[1]]);
                          }}
                          className="mt-1 rounded-lg"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Max</label>
                        <Input
                          type="number"
                          min={amountRange[0]}
                          value={amountRange[1]}
                          onChange={(e) => {
                            const value = Math.max(Number(e.target.value) || 0, amountRange[0]);
                            setAmountRange([amountRange[0], value]);
                          }}
                          className="mt-1 rounded-lg"
                          placeholder={maxAmount.toString()}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setLocalFilters(prev => ({
                          ...prev,
                          amountRange: { min: amountRange[0], max: amountRange[1] }
                        }));
                        handleApplyFilters();
                      }}
                      className="w-full rounded-lg"
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
                        "justify-between rounded-xl transition-all duration-200 h-12 group/btn",
                        (filters.status?.length || 0) > 0 ? "neu-press text-blue-700" : "neu-surface-soft text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 neu-press",
                          (filters.status?.length || 0) > 0 ? "text-blue-600" : "text-slate-500"
                        )}>
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      {(filters.status?.length || 0) > 0 && (
                        <Badge className="ml-2 neu-chip text-blue-700 text-[10px] px-1.5 h-5">
                          {filters.status?.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 rounded-2xl neu-surface-soft p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-blue-500" />
                        Filter by Status
                      </p>
                      {availableStatuses.map((status) => (
                        <div key={status} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('status', status)}>
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
                      <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg">
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
                        "justify-between rounded-xl transition-all duration-200 h-12 group/btn",
                        (filters.clients?.length || 0) > 0 ? "neu-press text-violet-700" : "neu-surface-soft text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 neu-press",
                          (filters.clients?.length || 0) > 0 ? "text-violet-600" : "text-slate-500"
                        )}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Clients</span>
                      </div>
                      {(filters.clients?.length || 0) > 0 && (
                        <Badge className="ml-2 neu-chip text-violet-700 text-[10px] px-1.5 h-5">
                          {filters.clients?.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 rounded-2xl neu-surface-soft p-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-violet-500" />
                        Filter by Client
                      </p>
                      {availableClients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('clients', client.id)}>
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
                      <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg">
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
                        "justify-between rounded-xl transition-all duration-200 h-12 group/btn",
                        (filters.categories?.length || 0) > 0 ? "neu-press text-orange-700" : "neu-surface-soft text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 neu-press",
                          (filters.categories?.length || 0) > 0 ? "text-orange-600" : "text-slate-500"
                        )}>
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Categories</span>
                      </div>
                      {(filters.categories?.length || 0) > 0 && (
                        <Badge className="ml-2 neu-chip text-orange-700 text-[10px] px-1.5 h-5">
                          {filters.categories?.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 rounded-2xl neu-surface-soft p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-orange-500" />
                        Filter by Category
                      </p>
                      {availableCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('categories', category)}>
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
                      <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg">
                        <Check className="w-4 h-4 mr-1.5" /> Apply Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {/* Payment Type Filter */}
              {showPaymentType && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "justify-between rounded-xl transition-all duration-200 h-12 group/btn",
                      (filters.paymentTypes?.length || 0) > 0 ? "neu-press text-cyan-700" : "neu-surface-soft text-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 neu-press",
                        (filters.paymentTypes?.length || 0) > 0 ? "text-cyan-600" : "text-slate-500"
                      )}>
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium">Payment Type</span>
                    </div>
                    {(filters.paymentTypes?.length || 0) > 0 && (
                      <Badge className="ml-2 neu-chip text-cyan-700 text-[10px] px-1.5 h-5">
                        {filters.paymentTypes?.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 rounded-2xl neu-surface-soft p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-cyan-500" />
                      Filter by Payment Type
                    </p>
                    {availablePaymentTypes.map((pt) => (
                      <div key={pt.value} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/55 transition-colors cursor-pointer" onClick={() => toggleArrayFilter('paymentTypes', pt.value)}>
                        <Checkbox
                          id={`paymentType-${pt.value}`}
                          checked={(localFilters.paymentTypes || []).includes(pt.value)}
                          onCheckedChange={() => toggleArrayFilter('paymentTypes', pt.value)}
                        />
                        <label
                          htmlFor={`paymentType-${pt.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {pt.label}
                        </label>
                      </div>
                    ))}
                    <Button onClick={handleApplyFilters} className="w-full mt-3 rounded-lg">
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
                    <Badge className="gap-1.5 neu-chip text-amber-700 rounded-lg px-3 py-1.5 cursor-default">
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
                    <Badge className="gap-1.5 neu-chip text-emerald-700 rounded-lg px-3 py-1.5 cursor-default">
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
                    <Badge key={status} className="gap-1.5 neu-chip text-blue-700 rounded-lg px-3 py-1.5 capitalize cursor-default">
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
                  {filters.paymentTypes?.map((pt) => (
                    <Badge key={pt} className="gap-1.5 neu-chip text-cyan-700 rounded-lg px-3 py-1.5 cursor-default">
                      {availablePaymentTypes.find(p => p.value === pt)?.label || pt}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-cyan-900 transition-colors ml-1"
                        onClick={() => {
                          const updated = filters.paymentTypes?.filter(p => p !== pt);
                          onFilterChange({ ...filters, paymentTypes: updated });
                          setLocalFilters(prev => ({ ...prev, paymentTypes: updated }));
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

import React, { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {
    label: string;
    value: string;
  }[];
}
const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  label,
  error,
  id,
  options,
  ...props
}, ref) => {
  const selectId = id || useId();
  return <div className="w-full">
        {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>}
        <div className="relative">
          <select className={cn('flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50', error && 'border-red-500 focus:ring-red-500', className)} ref={ref} id={selectId} {...props}>
            {options.map(option => <option key={option.value} value={option.value}>
                {option.label}
              </option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>;
});
Select.displayName = 'Select';
export { Select };
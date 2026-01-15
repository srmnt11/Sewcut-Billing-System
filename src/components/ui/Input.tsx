import React, { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  type,
  label,
  error,
  id,
  ...props
}, ref) => {
  const inputId = id || useId();
  return <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>}
        <input type={type} className={cn('flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500', error && 'border-red-500 focus:ring-red-500', className)} ref={ref} id={inputId} {...props} />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>;
});
Input.displayName = 'Input';
export { Input };
import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          'rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-100',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

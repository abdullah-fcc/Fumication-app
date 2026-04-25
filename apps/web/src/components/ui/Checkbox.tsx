import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const checkId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label htmlFor={checkId} className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        id={checkId}
        className={[
          'h-4 w-4 rounded border-gray-300 text-indigo-700',
          'focus:ring-2 focus:ring-indigo-600 focus:ring-offset-0',
          'cursor-pointer',
          className,
        ].join(' ')}
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

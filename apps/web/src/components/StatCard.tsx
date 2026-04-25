import { ReactNode } from 'react';

type Tone = 'teal' | 'blue' | 'amber' | 'red';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  teal:  'bg-indigo-50  text-indigo-700',
  blue:  'bg-blue-50  text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  red:   'bg-red-50   text-red-600',
};

export default function StatCard({ title, value, subtitle, icon, tone = 'teal' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${toneClasses[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

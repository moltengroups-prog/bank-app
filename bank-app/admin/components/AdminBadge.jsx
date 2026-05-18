'use client';

const VARIANTS = {
  active:         'bg-green-50 text-green-700 border border-green-200',
  frozen:         'bg-blue-50 text-blue-700 border border-blue-200',
  closed:         'bg-slate-100 text-slate-500 border border-slate-200',
  waiting:        'bg-amber-50 text-amber-700 border border-amber-200',
  pending:        'bg-amber-50 text-amber-700 border border-amber-200',
  completed:      'bg-green-50 text-green-700 border border-green-200',
  failed:         'bg-red-50 text-red-700 border border-red-200',
  admin:          'bg-purple-50 text-purple-700 border border-purple-200',
  'support-agent':'bg-blue-50 text-blue-700 border border-blue-200',
  user:           'bg-slate-100 text-slate-600 border border-slate-200',
  credit:         'bg-green-50 text-green-700 border border-green-200',
  debit:          'bg-red-50 text-red-700 border border-red-200',
  high:           'bg-red-50 text-red-700 border border-red-200',
  normal:         'bg-slate-100 text-slate-600 border border-slate-200',
  low:            'bg-green-50 text-green-600 border border-green-200',
};

export default function AdminBadge({ label, variant }) {
  const cls = VARIANTS[variant] || VARIANTS[label?.toLowerCase()] || VARIANTS.user;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

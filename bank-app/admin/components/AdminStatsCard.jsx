'use client';

export default function AdminStatsCard({ label, value, sub, trend, color = 'blue', icon }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    slate:  'bg-slate-100 text-slate-500',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{sub}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
              {trend.up ? '↑' : '↓'} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3 ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

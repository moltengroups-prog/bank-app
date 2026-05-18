'use client';
import { useSidebarStore } from '../store/sidebarStore.js';

export default function AdminTopbar({ title, subtitle, actions }) {
  const { toggle } = useSidebarStore();

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 flex-shrink-0 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggle}
        className="lg:hidden flex-shrink-0 p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '../store/adminStore.js';
import { useSidebarStore } from '../store/sidebarStore.js';

const NAV = [
  {
    label: 'Dashboard',
    href:  '/admin/dashboard',
    icon:  (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Users',
    href:  '/admin/users',
    icon:  (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Transfers',
    href:  '/admin/transfers',
    icon:  (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: 'Support',
    href:  '/admin/support',
    icon:  (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href:  '/admin/analytics',
    icon:  (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Security',
    href:  '/admin/security',
    icon:  (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname       = usePathname();
  const { user, logout } = useAdminStore();
  const { close }      = useSidebarStore();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full bg-[#0f172a] border-r border-[#1e293b]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e293b] flex-shrink-0">
        <p className="text-white font-bold text-sm tracking-wide">Bank of Molten</p>
        <p className="text-[#475569] text-[10px] mt-0.5 uppercase tracking-widest">Admin Console</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Admin navigation">
        <ul className="space-y-0.5 px-2">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[40px] ${
                    active
                      ? 'bg-[#1e293b] text-white font-medium'
                      : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-[#1e293b] flex-shrink-0">
        {user && (
          <div className="mb-3">
            <p className="text-white text-xs font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[#64748b] text-[10px] truncate mt-0.5 capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={() => { close(); logout(); }}
          className="w-full flex items-center gap-2 text-[#64748b] hover:text-[#f87171] text-xs transition-colors py-1.5 min-h-[36px]"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

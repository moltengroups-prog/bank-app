'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar.jsx';
import { useSidebarStore } from '../../store/sidebarStore.js';

const ADMIN_ROLES      = ['admin', 'support-agent'];
const INACTIVITY_MS    = 3 * 60 * 1000;
const ACTIVITY_KEY     = 'bom-admin-last-activity';
const ACTIVITY_EVENTS  = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

function readAuth() {
  const token = localStorage.getItem('adminToken');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('adminUser') || 'null'); } catch {}
  return {
    token,
    user,
    valid: !!(token && user && ADMIN_ROLES.includes(user.role)),
  };
}

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  const isPublic = pathname === '/admin/login';
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);

  const doLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.replace('/admin/login?expired=1');
  }, [router]);

  const resetTimer = useCallback(() => {
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLogout, INACTIVITY_MS);
  }, [doLogout]);

  // Inactivity timeout — only runs on authenticated pages
  useEffect(() => {
    if (isPublic || !ready) return;
    resetTimer();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    const handleStorage = (e) => {
      if (e.key !== ACTIVITY_KEY) return;
      const remaining = INACTIVITY_MS - (Date.now() - parseInt(e.newValue || '0', 10));
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doLogout, Math.max(0, remaining));
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener('storage', handleStorage);
    };
  }, [isPublic, ready, resetTimer, doLogout]);

  useEffect(() => {
    if (isPublic) return;
    const { valid } = readAuth();
    if (!valid) {
      router.replace('/admin/login');
    } else {
      setReady(true);
    }
  }, [pathname, isPublic, router]);

  // Close sidebar on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // ESC key closes sidebar
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex h-screen bg-[#0f172a] items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full shadow-xl">
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar — always visible at lg+ */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

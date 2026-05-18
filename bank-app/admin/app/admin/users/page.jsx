'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import AdminBadge from '../../../components/AdminBadge.jsx';
import { usersService } from '../../../services/adminService.js';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async (q, p) => {
    setLoading(true);
    try {
      const res = await usersService.getUsers({ search: q, page: p, limit });
      setUsers(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search, page), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, page, fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar
        title="Users"
        subtitle={`${total.toLocaleString()} registered customers`}
        actions={
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400 w-36 sm:w-56"
              aria-label="Search users by name or email"
            />
          </div>
        }
      />

      <div className="p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 text-[10px] font-bold">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-slate-900 text-xs block truncate max-w-[120px] sm:max-w-none">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate sm:hidden block max-w-[120px]">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{u.phoneNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <AdminBadge label={u.isVerified ? 'Verified' : 'Unverified'} variant={u.isVerified ? 'active' : 'pending'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-2">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} users
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

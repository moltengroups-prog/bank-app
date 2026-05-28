'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminTopbar from '../../../../components/AdminTopbar.jsx';
import { usersService } from '../../../../services/adminService.js';

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment'];

const emptyAccount = () => ({ type: 'checking', balance: '' });

export default function CreateUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName:   '',
    lastName:    '',
    email:       '',
    password:    '',
    phoneNumber: '',
    role:        'user',
  });
  const [accounts, setAccounts] = useState([emptyAccount()]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [created,    setCreated]    = useState(null);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setAcctField(index, key, value) {
    setAccounts((prev) => prev.map((a, i) => i === index ? { ...a, [key]: value } : a));
  }

  function addAccount() {
    if (accounts.length >= 4) return;
    setAccounts((prev) => [...prev, emptyAccount()]);
  }

  function removeAccount(index) {
    setAccounts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        phoneNumber: form.phoneNumber.trim() || undefined,
        accounts: accounts
          .filter((a) => a.type)
          .map((a) => ({ type: a.type, balance: parseFloat(a.balance) || 0 })),
      };
      const res = await usersService.createUser(payload);
      setCreated(res?.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="flex-1 overflow-y-auto">
        <AdminTopbar
          title="User Created"
          subtitle="New account is ready"
          actions={
            <Link href="/admin/users" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Users
            </Link>
          }
        />
        <div className="p-4 sm:p-6 max-w-lg">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {created.user.firstName} {created.user.lastName}
                </p>
                <p className="text-xs text-slate-500">{created.user.email}</p>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 border-t border-slate-100 pt-3">
              <p><span className="font-medium text-slate-700">Role:</span> {created.user.role}</p>
              <p><span className="font-medium text-slate-700">ID:</span> {created.user.id}</p>
            </div>

            {created.accounts.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Accounts</p>
                {created.accounts.map((acct) => (
                  <div key={acct.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 capitalize">{acct.accountType} {acct.maskedNumber}</span>
                    <span className="font-semibold text-slate-900">
                      ${Number(acct.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Link
                href={`/admin/users/${created.user.id}`}
                className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
              >
                View User Profile
              </Link>
              <button
                type="button"
                onClick={() => { setCreated(null); setForm({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'user' }); setAccounts([emptyAccount()]); }}
                className="flex-1 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar
        title="Create User"
        subtitle="Add a new customer account"
        actions={
          <Link href="/admin/users" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Users
          </Link>
        }
      />

      <div className="p-4 sm:p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Identity */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Identity</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                placeholder="jane.smith@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setField('phoneNumber', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Credentials</p>

            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="user">Customer (user)</option>
                <option value="support-agent">Support Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Accounts */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Accounts</p>
              {accounts.length < 4 && (
                <button
                  type="button"
                  onClick={addAccount}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Account
                </button>
              )}
            </div>

            {accounts.length === 0 && (
              <p className="text-xs text-slate-400">No accounts — user will have no banking accounts.</p>
            )}

            {accounts.map((acct, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 font-medium mb-1">Type</label>
                  <select
                    value={acct.type}
                    onChange={(e) => setAcctField(i, 'type', e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400 bg-white capitalize"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 font-medium mb-1">Starting Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={acct.balance}
                      onChange={(e) => setAcctField(i, 'balance', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded-md pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                {accounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAccount(i)}
                    className="mb-0.5 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Remove account"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

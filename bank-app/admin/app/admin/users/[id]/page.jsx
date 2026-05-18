'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminTopbar from '../../../../components/AdminTopbar.jsx';
import AdminBadge from '../../../../components/AdminBadge.jsx';
import AdminModal from '../../../../components/AdminModal.jsx';
import { usersService, accountsService } from '../../../../services/adminService.js';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtUSD  = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function AccountCard({ account, onStatusChange, onAdjustBalance }) {
  const frozen = account.status === 'frozen';
  const closed = account.status === 'closed';

  return (
    <div className={`border rounded-lg p-4 ${frozen ? 'border-blue-200 bg-blue-50/30' : closed ? 'border-slate-200 bg-slate-50/50 opacity-60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{account.accountName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{account.maskedNumber} · {account.accountType}</p>
        </div>
        <AdminBadge label={account.status} variant={account.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Balance</p>
          <p className="text-base font-bold text-slate-900">{fmtUSD(account.balance)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Available</p>
          <p className="text-base font-bold text-slate-700">{fmtUSD(account.availableBalance)}</p>
        </div>
      </div>

      {!closed && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onStatusChange(account, frozen ? 'active' : 'frozen')}
            className={`flex-1 min-w-[80px] text-xs py-2 rounded border font-medium transition-colors ${
              frozen
                ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            {frozen ? 'Unfreeze' : 'Freeze'}
          </button>
          <button
            onClick={() => onAdjustBalance(account)}
            className="flex-1 min-w-[80px] text-xs py-2 rounded border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors"
          >
            Adjust Balance
          </button>
          <button
            onClick={() => onStatusChange(account, 'closed')}
            className="flex-1 min-w-[80px] text-xs py-2 rounded border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [statusModal,   setStatusModal]   = useState({ open: false, account: null, newStatus: '' });
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusReason,  setStatusReason]  = useState('');

  const [balanceModal, setBalanceModal] = useState({ open: false, account: null });
  const [adjType,      setAdjType]      = useState('credit');
  const [adjAmount,    setAdjAmount]    = useState('');
  const [adjReason,    setAdjReason]    = useState('');
  const [adjLoading,   setAdjLoading]   = useState(false);
  const [adjError,     setAdjError]     = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await usersService.getUserById(id);
      setData(res?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = (account, newStatus) => {
    setStatusModal({ open: true, account, newStatus });
    setStatusReason('');
  };

  const confirmStatusChange = async () => {
    setStatusLoading(true);
    try {
      await accountsService.updateStatus(statusModal.account.id, statusModal.newStatus, statusReason);
      setStatusModal({ open: false, account: null, newStatus: '' });
      await fetchData();
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAdjustBalance = (account) => {
    setBalanceModal({ open: true, account });
    setAdjType('credit');
    setAdjAmount('');
    setAdjReason('');
    setAdjError('');
  };

  const confirmBalanceAdjust = async () => {
    if (!adjAmount || parseFloat(adjAmount) <= 0) { setAdjError('Enter a valid amount.'); return; }
    if (!adjReason.trim()) { setAdjError('Reason is required.'); return; }
    setAdjLoading(true);
    setAdjError('');
    try {
      await accountsService.adjustBalance(balanceModal.account.id, {
        adjustmentType: adjType,
        amount: parseFloat(adjAmount),
        reason: adjReason.trim(),
      });
      setBalanceModal({ open: false, account: null });
      await fetchData();
    } catch (err) {
      setAdjError(err.message);
    } finally {
      setAdjLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-red-500">{error}</p>
    </div>
  );

  const { user, accounts = [], recentTransactions = [] } = data || {};

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar
        title={user ? `${user.firstName} ${user.lastName}` : 'User Details'}
        subtitle={user?.email}
        actions={
          <Link href="/admin/users" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 whitespace-nowrap">
            ← Back
          </Link>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Profile + Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Customer Profile */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Profile</h2>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-bold text-base">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{user?.firstName} {user?.lastName}</p>
                <AdminBadge label={user?.isVerified ? 'Verified' : 'Unverified'} variant={user?.isVerified ? 'active' : 'pending'} />
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['Email',    user?.email],
                ['Phone',    user?.phoneNumber || '—'],
                ['Joined',   fmtDate(user?.createdAt)],
                ['Accounts', `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-xs text-slate-800 mt-0.5 break-all">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Accounts</h2>
            {accounts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-5 text-center text-sm text-slate-400">No accounts</div>
            ) : (
              accounts.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onStatusChange={handleStatusChange}
                  onAdjustBalance={handleAdjustBalance}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Transactions</h2>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-5 text-center text-sm text-slate-400">No transactions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table min-w-[400px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Description</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 hidden sm:table-cell">Account</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Type</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtDate(tx.transactionDate)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-800 max-w-[140px] sm:max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 hidden sm:table-cell">{tx.account?.maskedNumber || '—'}</td>
                      <td className="px-4 py-2.5"><AdminBadge label={tx.type} variant={tx.type} /></td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs font-semibold whitespace-nowrap ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-700'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Change Modal */}
      <AdminModal
        open={statusModal.open}
        onClose={() => setStatusModal({ open: false, account: null, newStatus: '' })}
        title={`${statusModal.newStatus === 'frozen' ? 'Freeze' : statusModal.newStatus === 'active' ? 'Unfreeze' : 'Close'} Account`}
        footer={
          <>
            <button
              onClick={() => setStatusModal({ open: false, account: null, newStatus: '' })}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmStatusChange}
              disabled={statusLoading}
              className={`px-3 py-1.5 text-xs rounded font-medium text-white disabled:opacity-50 transition-colors ${
                statusModal.newStatus === 'closed' ? 'bg-red-600 hover:bg-red-700' : statusModal.newStatus === 'frozen' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {statusLoading ? 'Processing…' : 'Confirm'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Account</p>
            <p className="text-sm font-medium text-slate-900 mt-0.5">
              {statusModal.account?.accountName} {statusModal.account?.maskedNumber}
            </p>
          </div>
          {statusModal.newStatus === 'closed' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs text-red-700 font-medium">⚠ This action is irreversible. The account will be permanently closed.</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Enter reason for audit log…"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </AdminModal>

      {/* Balance Adjust Modal */}
      <AdminModal
        open={balanceModal.open}
        onClose={() => setBalanceModal({ open: false, account: null })}
        title="Adjust Account Balance"
        footer={
          <>
            <button
              onClick={() => setBalanceModal({ open: false, account: null })}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmBalanceAdjust}
              disabled={adjLoading}
              className="px-3 py-1.5 text-xs rounded font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adjLoading ? 'Processing…' : 'Apply Adjustment'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Account</p>
            <p className="text-sm font-medium text-slate-900 mt-0.5">
              {balanceModal.account?.accountName} · Current balance: {fmtUSD(balanceModal.account?.balance)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['credit', 'debit'].map((t) => (
              <button
                key={t}
                onClick={() => setAdjType(t)}
                className={`py-2 text-xs font-medium rounded border transition-colors capitalize ${
                  adjType === t
                    ? t === 'credit' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'credit' ? '+ Credit' : '− Debit'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Enter reason for audit log…"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          {adjError && <p className="text-xs text-red-500">{adjError}</p>}
        </div>
      </AdminModal>
    </div>
  );
}

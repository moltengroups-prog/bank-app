'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminTopbar from '../../../../components/AdminTopbar.jsx';
import AdminBadge from '../../../../components/AdminBadge.jsx';
import AdminModal from '../../../../components/AdminModal.jsx';
import { usersService, accountsService, personasService } from '../../../../services/adminService.js';

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

  // Persona generation
  const [personas,         setPersonas]         = useState(null);
  const [genForm,          setGenForm]          = useState({ occupationId: '', rankOrClass: 'mid', personalityId: '', historyStartDate: '', activityIntensity: '1.0', clearExisting: false });
  const [genLoading,       setGenLoading]       = useState(false);
  const [genResult,        setGenResult]        = useState(null);
  const [genError,         setGenError]         = useState(null);
  const [genPanelOpen,     setGenPanelOpen]     = useState(false);

  useEffect(() => {
    personasService.getPersonas().then((res) => setPersonas(res?.data)).catch(() => {});
  }, []);

  const [statusModal,   setStatusModal]   = useState({ open: false, account: null, newStatus: '' });
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusReason,  setStatusReason]  = useState('');

  const [balanceModal, setBalanceModal] = useState({ open: false, account: null });
  const [adjType,      setAdjType]      = useState('credit');
  const [adjAmount,    setAdjAmount]    = useState('');
  const [adjReason,    setAdjReason]    = useState('');
  const [adjLoading,   setAdjLoading]   = useState(false);
  const [adjError,     setAdjError]     = useState('');

  // OTP actions
  const [otpModal,     setOtpModal]     = useState({ open: false, code: null, expiresAt: null, deliveryMethod: null });
  const [otpLoading,   setOtpLoading]   = useState(false);
  const [otpError,     setOtpError]     = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);

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

  const handleIssueOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await usersService.issueOTP(id);
      const otp = res?.otp;
      if (!otp?.code) throw new Error('Unexpected response from server.');
      setOtpModal({ open: true, code: otp.code, expiresAt: otp.expiresAt, deliveryMethod: otp.deliveryMethod });
    } catch (err) {
      setOtpError(err.message || 'Failed to issue OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRevokeOTP = async () => {
    setRevokeLoading(true);
    setOtpError('');
    try {
      await usersService.revokeOTP(id);
    } catch (err) {
      setOtpError(err.message || 'Failed to revoke OTP.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const selectedOccupation = personas?.occupations?.find((o) => o.id === genForm.occupationId);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenError(null);
    setGenResult(null);
    setGenLoading(true);
    try {
      const payload = {
        occupationId:      genForm.occupationId,
        rankOrClass:       genForm.rankOrClass || 'mid',
        personalityId:     genForm.personalityId || null,
        historyStartDate:  genForm.historyStartDate || null,
        activityIntensity: parseFloat(genForm.activityIntensity) || 1.0,
        clearExisting:     genForm.clearExisting,
      };
      const res = await usersService.generateHistory(id, payload);
      setGenResult(res?.data);
      fetchData(); // refresh account balances
    } catch (err) {
      setGenError(err?.response?.data?.message || err.message || 'Failed to generate history');
    } finally {
      setGenLoading(false);
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

        {/* Security Actions */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security Actions</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-medium text-slate-700 mb-1">Fallback Verification Code</p>
                <p className="text-[11px] text-slate-400 mb-2 leading-snug">
                  Issue a one-time 6-digit code to give to a locked-out user.
                  The code is shown once and expires in 10 minutes.
                </p>
                <button
                  type="button"
                  onClick={handleIssueOTP}
                  disabled={otpLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {otpLoading ? 'Generating…' : 'Issue Code'}
                </button>
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-medium text-slate-700 mb-1">Revoke Pending Codes</p>
                <p className="text-[11px] text-slate-400 mb-2 leading-snug">
                  Cancel all active verification codes for this user.
                  Use when a sign-in session looks suspicious.
                </p>
                <button
                  type="button"
                  onClick={handleRevokeOTP}
                  disabled={revokeLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {revokeLoading ? 'Revoking…' : 'Revoke Codes'}
                </button>
              </div>
            </div>
            {otpError && <p className="text-xs text-red-500">{otpError}</p>}
          </div>
        </div>

        {/* Generate History Panel */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { setGenPanelOpen((v) => !v); setGenResult(null); setGenError(null); }}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Generate Transaction History</h2>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${genPanelOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {genPanelOpen && (
            <form onSubmit={handleGenerate} className="p-4 space-y-3">
              {!personas ? (
                <p className="text-xs text-slate-400">Loading persona options…</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Occupation */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Occupation *</label>
                      <select
                        required
                        value={genForm.occupationId}
                        onChange={(e) => setGenForm((f) => ({ ...f, occupationId: e.target.value, rankOrClass: 'mid' }))}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="">Select occupation…</option>
                        {['military', 'professional', 'trades', 'business', 'entry'].map((cat) => (
                          <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                            {personas.occupations.filter((o) => o.category === cat).map((o) => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Rank / Income class */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {selectedOccupation?.ranks ? 'Rank' : 'Income Level'}
                      </label>
                      {selectedOccupation?.ranks ? (
                        <select
                          value={genForm.rankOrClass}
                          onChange={(e) => setGenForm((f) => ({ ...f, rankOrClass: e.target.value }))}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400"
                        >
                          {selectedOccupation.ranks.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={genForm.rankOrClass}
                          onChange={(e) => setGenForm((f) => ({ ...f, rankOrClass: e.target.value }))}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400"
                        >
                          <option value="entry">Entry-level</option>
                          <option value="mid">Mid-career</option>
                          <option value="senior">Senior / High-earner</option>
                        </select>
                      )}
                    </div>

                    {/* Personality */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Personality</label>
                      <select
                        value={genForm.personalityId}
                        onChange={(e) => setGenForm((f) => ({ ...f, personalityId: e.target.value }))}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="">None (balanced)</option>
                        {personas.personalities.map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Activity intensity */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Activity Intensity</label>
                      <select
                        value={genForm.activityIntensity}
                        onChange={(e) => setGenForm((f) => ({ ...f, activityIntensity: e.target.value }))}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="0.5">Low (0.5×)</option>
                        <option value="1.0">Normal (1×)</option>
                        <option value="1.5">High (1.5×)</option>
                        <option value="2.0">Very High (2×)</option>
                      </select>
                    </div>

                    {/* Start date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">History Start Date</label>
                      <input
                        type="date"
                        value={genForm.historyStartDate}
                        onChange={(e) => setGenForm((f) => ({ ...f, historyStartDate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use 18 months ago</p>
                    </div>

                    {/* Clear existing */}
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="clearExisting"
                        checked={genForm.clearExisting}
                        onChange={(e) => setGenForm((f) => ({ ...f, clearExisting: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="clearExisting" className="text-xs text-slate-600 select-none">
                        Clear existing transactions first
                      </label>
                    </div>
                  </div>

                  {genError && (
                    <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      <p className="text-xs text-red-700">{genError}</p>
                    </div>
                  )}

                  {genResult && (
                    <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 space-y-1">
                      <p className="text-xs font-semibold text-green-800">Generated {genResult.transactionsInserted.toLocaleString()} transactions</p>
                      {genResult.accounts.map((a) => (
                        <p key={a.accountId} className="text-xs text-green-700">
                          {a.accountName}: {a.transactions} txns · Final balance ${Number(a.finalBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={genLoading || !genForm.occupationId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    {genLoading ? 'Generating…' : 'Generate History'}
                  </button>
                </>
              )}
            </form>
          )}
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

      {/* OTP Reveal Modal */}
      <AdminModal
        open={otpModal.open}
        onClose={() => setOtpModal({ open: false, code: null, expiresAt: null, deliveryMethod: null })}
        title="Fallback Verification Code"
        footer={
          <button
            onClick={() => setOtpModal({ open: false, code: null, expiresAt: null, deliveryMethod: null })}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-amber-800 font-medium">⚠ Read this code to the customer directly. Never write it down or send it via email.</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">One-time verification code</p>
            <p className="text-4xl font-bold tracking-[0.3em] text-slate-900 font-mono">
              {otpModal.code ?? '——————'}
            </p>
            {otpModal.expiresAt && (
              <p className="text-xs text-slate-400 mt-2">
                Expires {new Date(otpModal.expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs text-slate-600">
              For: <span className="font-medium text-slate-800">{user?.email ?? '—'}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Delivery: <span className="font-medium">{otpModal.deliveryMethod ?? 'admin-issued'}</span>
              {' · '}Logged in audit trail.
            </p>
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

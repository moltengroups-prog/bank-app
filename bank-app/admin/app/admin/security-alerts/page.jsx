'use client';
import { useState, useEffect, useCallback } from 'react';
import { securityAlertsService, usersService } from '../../../services/adminService.js';

// ── Alert type templates ──────────────────────────────────────────
const ALERT_TEMPLATES = {
  suspicious_login: {
    title:   'Suspicious Login Detected',
    message: 'We detected a login attempt from a new device or location that does not match your normal activity.',
  },
  failed_login_attempts: {
    title:   'Multiple Failed Login Attempts',
    message: 'Several unsuccessful login attempts were detected on your account.',
  },
  large_wire_transfer: {
    title:   'Large Wire Transfer Detected',
    message: 'A wire transfer exceeding your normal transaction behavior was detected.',
  },
  card_security_review: {
    title:   'Card Temporarily Restricted',
    message: 'Your debit card has been temporarily restricted due to unusual spending activity.',
  },
  international_activity: {
    title:   'International Activity Detected',
    message: 'We noticed transactions from a region that differs from your normal activity.',
  },
  high_transaction_volume: {
    title:   'High Transaction Volume Detected',
    message: 'Multiple transactions were initiated within a short period.',
  },
  account_info_changed: {
    title:   'Account Information Updated',
    message: 'Recent changes were made to your profile information.',
  },
  identity_verification_required: {
    title:   'Identity Verification Required',
    message: 'Additional identity verification is required before certain banking services can be used.',
  },
  custom: { title: '', message: '' },
};

const ALERT_TYPE_LABELS = {
  suspicious_login:               'Suspicious Login Detected',
  failed_login_attempts:          'Multiple Failed Login Attempts',
  large_wire_transfer:            'Large Wire Transfer Detected',
  card_security_review:           'Card Security Review',
  international_activity:         'International Activity Detected',
  high_transaction_volume:        'High Transaction Volume',
  account_info_changed:           'Account Information Changed',
  identity_verification_required: 'Identity Verification Required',
  custom:                         'Custom Alert',
};

const SEVERITY_BADGES = {
  low:      'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  medium:   'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  high:     'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  critical: 'bg-red-500/10 text-red-300 border border-red-500/20',
};

const STATUS_BADGES = {
  active:   'bg-red-500/10 text-red-300 border border-red-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  resolved: 'bg-green-500/10 text-green-300 border border-green-500/20',
};

const RESTRICTION_KEYS = [
  { key: 'login',                     label: 'Disable Login' },
  { key: 'transfers',                 label: 'Disable Transfers' },
  { key: 'wires',                     label: 'Disable Wire Transfers' },
  { key: 'billPay',                   label: 'Disable Bill Pay' },
  { key: 'zelle',                     label: 'Disable Zelle' },
  { key: 'debitCard',                 label: 'Disable Debit Card' },
  { key: 'creditCard',                label: 'Disable Credit Card' },
  { key: 'internationalTransactions', label: 'Disable International Transactions' },
  { key: 'otpRequired',               label: 'Require OTP Verification' },
  { key: 'identityVerification',      label: 'Require Identity Verification' },
  { key: 'freezeAccount',             label: 'Freeze Entire Account' },
];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Reusable small components ─────────────────────────────────────

function Badge({ text, style }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${style}`}>{text}</span>
  );
}

function InputField({ label, value, onChange, type = 'text', required, disabled, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Create / Edit modal ───────────────────────────────────────────

function AlertModal({ existing, onClose, onSaved }) {
  const [users,      setUsers]      = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({
    userId:                 existing?.user?._id || existing?.user || '',
    alertType:              existing?.alertType  || 'suspicious_login',
    title:                  existing?.title      || ALERT_TEMPLATES.suspicious_login.title,
    message:                existing?.message    || ALERT_TEMPLATES.suspicious_login.message,
    severity:               existing?.severity   || 'high',
    requiresChatResolution: existing?.requiresChatResolution !== false,
    restrictions:           existing?.restrictions || {},
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Load users — server caps limit at 100; field is "id" not "_id"
  useEffect(() => {
    usersService.getUsers({ limit: 100 })
      .then((res) => setUsers(res?.data || []))
      .catch(() => {});
  }, []);

  // Auto-fill title + message when alert type changes
  const handleTypeChange = (type) => {
    const tmpl = ALERT_TEMPLATES[type] || { title: '', message: '' };
    setForm((f) => ({ ...f, alertType: type, title: tmpl.title, message: tmpl.message }));
  };

  // Toggle a restriction
  const toggleRestriction = (key) => {
    setForm((f) => ({
      ...f,
      restrictions: { ...f.restrictions, [key]: !f.restrictions[key] },
    }));
  };

  // Critical auto-sets common restrictions
  const handleSeverityChange = (sev) => {
    if (sev === 'critical') {
      setForm((f) => ({
        ...f,
        severity: 'critical',
        restrictions: {
          ...f.restrictions,
          transfers: true,
          wires:     true,
          billPay:   true,
          zelle:     true,
          debitCard: true,
        },
      }));
    } else {
      set('severity', sev);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    if (!form.userId) { setError('Please select a target user.'); return; }
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.message.trim()) { setError('Message is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (existing) {
        await securityAlertsService.updateAlert(existing._id, {
          alertType:              form.alertType,
          title:                  form.title,
          message:                form.message,
          severity:               form.severity,
          restrictions:           form.restrictions,
          requiresChatResolution: form.requiresChatResolution,
        });
      } else {
        await securityAlertsService.createAlert({
          userId:                 form.userId,
          alertType:              form.alertType,
          title:                  form.title,
          message:                form.message,
          severity:               form.severity,
          restrictions:           form.restrictions,
          requiresChatResolution: form.requiresChatResolution,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save alert.');
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = users.find((u) => String(u.id) === String(form.userId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-[#1e293b] rounded-xl border border-[#334155] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="text-white font-semibold">{existing ? 'Edit Alert' : 'Create Security Alert'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Target user */}
          {!existing && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Target User <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 mb-2"
              />
              {selectedUser && (
                <p className="text-green-400 text-xs mb-2">
                  ✓ Selected: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </p>
              )}
              <div className="max-h-36 overflow-y-auto bg-[#0f172a] border border-[#334155] rounded-md">
                {filteredUsers.slice(0, 30).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { set('userId', String(u.id)); setUserSearch(''); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#1e293b] transition-colors ${String(form.userId) === String(u.id) ? 'bg-blue-600/20 text-blue-300' : 'text-slate-300'}`}
                  >
                    {u.firstName} {u.lastName} <span className="text-slate-500">— {u.email}</span>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="px-3 py-2 text-slate-500 text-sm">No users found.</p>
                )}
              </div>
            </div>
          )}

          {/* Alert type */}
          <SelectField
            label="Alert Type"
            value={form.alertType}
            onChange={handleTypeChange}
            options={Object.entries(ALERT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Severity</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high', 'critical'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => handleSeverityChange(sev)}
                  className={`flex-1 py-2 rounded-md text-xs font-bold capitalize border transition-colors ${
                    form.severity === sev
                      ? sev === 'low'      ? 'bg-blue-600 border-blue-600 text-white'
                        : sev === 'medium' ? 'bg-amber-600 border-amber-600 text-white'
                        : sev === 'high'   ? 'bg-orange-600 border-orange-600 text-white'
                        :                    'bg-red-600 border-red-600 text-white'
                      : 'bg-transparent border-[#334155] text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <InputField label="Alert Title" value={form.title} onChange={(v) => set('title', v)} required />

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              rows={3}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Restrictions */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Account Restrictions</label>
            <div className="grid grid-cols-2 gap-2">
              {RESTRICTION_KEYS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.restrictions[key])}
                    onChange={() => toggleRestriction(key)}
                    className="w-3.5 h-3.5 rounded border-[#334155] bg-[#0f172a] accent-blue-500"
                  />
                  <span className="text-xs text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Require chat resolution */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requiresChatResolution}
              onChange={(e) => set('requiresChatResolution', e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#334155] bg-[#0f172a] accent-blue-500"
            />
            <span className="text-xs text-slate-300">Require chat with support to resolve</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#334155] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#334155] text-slate-300 text-sm rounded-md hover:border-slate-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors"
          >
            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resolve modal ─────────────────────────────────────────────────

function ResolveModal({ alert, onClose, onResolved }) {
  const [notes,    setNotes]    = useState('');
  const [resolving, setResolving] = useState(false);
  const [error,    setError]    = useState('');

  const handleResolve = async () => {
    setResolving(true);
    setError('');
    try {
      await securityAlertsService.resolve(alert._id, notes);
      onResolved();
    } catch (err) {
      setError(err.message || 'Failed to resolve alert.');
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-[#1e293b] rounded-xl border border-[#334155]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="text-white font-semibold">Resolve Alert</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-[#0f172a] rounded-lg p-3">
            <p className="text-slate-300 text-sm font-medium">{alert.title}</p>
            <p className="text-slate-500 text-xs mt-1">
              {alert.user?.firstName} {alert.user?.lastName} · {alert.user?.email}
            </p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Resolution Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe how the issue was resolved…"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#334155] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#334155] text-slate-300 text-sm rounded-md">Cancel</button>
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors"
          >
            {resolving ? 'Resolving…' : 'Mark as Resolved'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function SecurityAlertsPage() {
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState('all'); // all | active | inactive | resolved
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [resolving,  setResolving]  = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // alertId being acted on

  const load = useCallback(() => {
    setLoading(true);
    const params = filter === 'all' ? {} : { status: filter };
    securityAlertsService.getAlerts(params)
      .then((res) => setAlerts(res?.data || []))
      .catch((err) => setError(err.message || 'Failed to load alerts.'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (id) => {
    setActionLoading(id);
    try { await securityAlertsService.activate(id); load(); }
    catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleDeactivate = async (id) => {
    setActionLoading(id);
    try { await securityAlertsService.deactivate(id); load(); }
    catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const TABS = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Security Alerts</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage customer security alerts and account restrictions</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Alert
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-[#0f172a] rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === t.key ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm">No security alerts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  {['User', 'Alert', 'Severity', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={a._id} className={`border-b border-[#334155] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#0f172a]/30'}`}>
                    {/* User */}
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">
                        {a.user?.firstName} {a.user?.lastName}
                      </p>
                      <p className="text-slate-500 text-xs">{a.user?.email}</p>
                    </td>
                    {/* Alert */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-white text-sm font-medium truncate">{a.title}</p>
                      <p className="text-slate-500 text-xs capitalize">{ALERT_TYPE_LABELS[a.alertType] || a.alertType}</p>
                    </td>
                    {/* Severity */}
                    <td className="px-4 py-3">
                      <Badge text={a.severity} style={SEVERITY_BADGES[a.severity] || ''} />
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge text={a.status} style={STATUS_BADGES[a.status] || ''} />
                    </td>
                    {/* Created */}
                    <td className="px-4 py-3">
                      <p className="text-slate-400 text-xs">{fmtDate(a.createdAt)}</p>
                      {a.createdBy && (
                        <p className="text-slate-600 text-xs">
                          by {a.createdBy.firstName} {a.createdBy.lastName}
                        </p>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Edit */}
                        {a.status !== 'resolved' && (
                          <button
                            onClick={() => setEditing(a)}
                            className="px-2.5 py-1 text-xs bg-[#334155] hover:bg-[#475569] text-slate-300 rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {/* Activate / Deactivate */}
                        {a.status === 'inactive' && (
                          <button
                            onClick={() => handleActivate(a._id)}
                            disabled={actionLoading === a._id}
                            className="px-2.5 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        {a.status === 'active' && (
                          <button
                            onClick={() => handleDeactivate(a._id)}
                            disabled={actionLoading === a._id}
                            className="px-2.5 py-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded transition-colors disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        )}
                        {/* Resolve */}
                        {a.status !== 'resolved' && (
                          <button
                            onClick={() => setResolving(a)}
                            className="px-2.5 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        {a.status === 'resolved' && a.resolvedAt && (
                          <p className="text-slate-600 text-xs">
                            Resolved {fmtDate(a.resolvedAt)}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <AlertModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}
      {editing && (
        <AlertModal
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {resolving && (
        <ResolveModal
          alert={resolving}
          onClose={() => setResolving(null)}
          onResolved={() => { setResolving(null); load(); }}
        />
      )}
    </div>
  );
}

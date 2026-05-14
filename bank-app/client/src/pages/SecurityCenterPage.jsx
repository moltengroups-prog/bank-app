import React, { useState } from 'react';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgScamAlert from '../assets/images/security-scam-alert.jpg';
import imgTrendingScams from '../assets/images/security-trending-scams.jpg';

// ── Mock data ────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  {
    id: 'two-step',
    label: 'Two-step verification',
    subtitle: 'An extra layer of identity verification',
    status: 'active',
  },
  {
    id: 'otp',
    label: 'One Time Passcode',
    subtitle: 'Verify sign-in with a passcode sent to you',
    status: 'active',
  },
  {
    id: 'alerts',
    label: 'Account alerts',
    subtitle: 'Get notified of unusual activity',
    status: 'active',
  },
  {
    id: 'card-lock',
    label: 'Card lock',
    subtitle: 'Lock your card when not in use',
    status: 'inactive',
  },
  {
    id: 'trusted',
    label: 'Trusted browsers',
    subtitle: 'Recognize your devices for faster sign-in',
    status: 'inactive',
  },
  {
    id: 'voice',
    label: 'Voice ID',
    subtitle: 'Use your voice to verify your identity',
    status: 'inactive',
  },
];

const ARTICLES = [
  {
    id: 1,
    img: imgScamAlert,
    tag: 'Scam Alert',
    title: 'New scam targets mobile banking customers',
  },
  {
    id: 2,
    img: imgTrendingScams,
    tag: 'Trending',
    title: 'Top trending scams you should know about',
  },
];

// ── Security Meter SVG ───────────────────────────────────────────

function SecurityMeter() {
  const W = 280, H = 178;
  const cx = 140, cy = 150, r = 100;
  const sw = 4;
  const GREEN = '#3B9E6D';
  const TRACK = '#E5E7EB';

  const C = Math.PI * r;
  const progressFrac = 2 / 3;
  const progressLen = progressFrac * C;

  const pt = (s, radius) => {
    const theta = (180 + s * 180) * (Math.PI / 180);
    return [cx + radius * Math.cos(theta), cy + radius * Math.sin(theta)];
  };

  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  const [enhX, enhY] = pt(1 / 3, r + 26);
  const [advX, advY] = pt(2 / 3, r + 26);

  const LABELS = [
    { s: 0,   text: 'Standard', x: 20,   y: 167, anchor: 'start'  },
    { s: 1/3, text: 'Enhanced', x: enhX, y: enhY + 3, anchor: 'middle' },
    { s: 2/3, text: 'Advanced', x: advX, y: advY + 3, anchor: 'middle' },
    { s: 1,   text: 'High',     x: 260,  y: 167, anchor: 'end'    },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Gray background track */}
      <path d={arcPath} fill="none" stroke={TRACK} strokeWidth={sw} strokeLinecap="round" />

      {/* Green progress arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={GREEN}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${progressLen} ${C}`}
      />

      {/* Thin tick marks at left, top, right */}
      {[0, 0.5, 1].map(s => {
        const [x1, y1] = pt(s, r - 7);
        const [x2, y2] = pt(s, r + 7);
        return (
          <line key={s} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#C9CDD4" strokeWidth={1.5} strokeLinecap="round" />
        );
      })}

      {/* Level labels */}
      {LABELS.map(lv => (
        <text
          key={lv.text}
          x={lv.x}
          y={lv.y}
          textAnchor={lv.anchor}
          fontSize="8.5"
          fontWeight="500"
          fill={lv.s <= progressFrac ? '#4B5563' : '#9CA3AF'}
          fontFamily="system-ui,-apple-system,sans-serif"
          letterSpacing="0.01em"
        >
          {lv.text}
        </text>
      ))}

      {/* Lock icon — small, light weight */}
      <g transform={`translate(${cx}, ${cy - 58})`}>
        <path
          d="M-4.5,0 V-5 Q-4.5,-9.5 0,-9.5 Q4.5,-9.5 4.5,-5 V0"
          fill="none" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round"
        />
        <rect x="-6.5" y="0" width="13" height="10" rx="2" fill="#6B7280" />
        <circle cx="0" cy="5" r="1.6" fill="white" />
        <rect x="-0.7" y="5" width="1.4" height="2.8" rx="0.7" fill="white" />
      </g>

      {/* "Advanced Security" */}
      <text x={cx} y={cy - 30} textAnchor="middle" fontSize="13.5" fontWeight="600"
        fill="#111827" fontFamily="system-ui,-apple-system,sans-serif">
        Advanced Security
      </text>

      {/* "3 features to High" */}
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="10"
        fill="#9CA3AF" fontFamily="system-ui,-apple-system,sans-serif">
        3 features to High
      </text>
    </svg>
  );
}

// ── Shared small components ──────────────────────────────────────

const IconChevronRight = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-[#3B9E6D]' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  );
}

function ChecklistRow({ item }) {
  const active = item.status === 'active';
  return (
    <>
      <button
        type="button"
        className="w-full flex items-center px-5 py-4 text-left active:bg-gray-50"
      >
        {/* Status icon */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mr-4 ${active ? 'bg-green-50' : 'bg-orange-50'}`}>
          {active ? (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base text-gray-900 font-medium leading-snug">{item.label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.subtitle}</p>
        </div>

        {!active && (
          <span className="text-xs text-[#1a6bbf] font-semibold mr-2 flex-shrink-0">Set up</span>
        )}
        <IconChevronRight />
      </button>
    </>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`mx-4 bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

function LinkRow({ label, subtitle, last = false }) {
  return (
    <>
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-gray-50"
      >
        <div>
          <p className="text-base text-gray-900">{label}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <IconChevronRight />
      </button>
      {!last && <InsetDivider color={200} />}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function SecurityCenterPage() {
  const [touchIdEnabled, setTouchIdEnabled] = useState(true);
  const [quickBalanceEnabled, setQuickBalanceEnabled] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Security Center" showSpacer />

      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        <EricaSearchBar ericaCount={3} />

        {/* ── Security Meter Card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-5 pb-2">
            <SecurityMeter />
          </div>
          <div className="flex justify-between px-4 pb-5">
            <button type="button" className="text-sm text-[#1a6bbf] font-semibold">
              Learn more
            </button>
            <button type="button" className="text-sm text-[#1a6bbf] font-semibold">
              Get to High
            </button>
          </div>
        </div>

        {/* ── Your Security Checklist ── */}
        <div className="mx-4 mt-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 px-1">
            Your Security Checklist
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {CHECKLIST_ITEMS.map((item, i) => (
              <React.Fragment key={item.id}>
                <ChecklistRow item={item} />
                {i < CHECKLIST_ITEMS.length - 1 && <InsetDivider color={200} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Login Preferences ── */}
        <SectionCard title="Login Preferences" className="mt-4">
          <InsetDivider color={200} />
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-base text-gray-900">Touch ID</p>
              <p className="text-xs text-gray-500 mt-0.5">Use fingerprint to sign in</p>
            </div>
            <Toggle enabled={touchIdEnabled} onToggle={() => setTouchIdEnabled(v => !v)} />
          </div>
          <InsetDivider color={200} />
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-base text-gray-900">Quick balance</p>
              <p className="text-xs text-gray-500 mt-0.5">See balance without signing in</p>
            </div>
            <Toggle enabled={quickBalanceEnabled} onToggle={() => setQuickBalanceEnabled(v => !v)} />
          </div>
          <InsetDivider color={200} />
          <LinkRow label="Change passcode" last />
        </SectionCard>

        {/* ── Manage Your Data ── */}
        <SectionCard title="Manage Your Data" className="mt-4">
          <InsetDivider color={200} />
          <LinkRow label="Manage data sharing" subtitle="Control how your data is used" />
          <LinkRow label="Ad preferences" subtitle="Manage personalized ads" />
          <LinkRow label="Privacy policy" last />
        </SectionCard>

        {/* ── Device Security ── */}
        <SectionCard title="Device Security" className="mt-4">
          <InsetDivider color={200} />
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">Your device is secure</p>
                <p className="text-xs text-gray-500 mt-0.5">Last checked: Today</p>
              </div>
            </div>
            <InsetDivider color={200} />
          </div>
          <LinkRow label="Trusted devices" subtitle="Devices recognized for quick sign-in" />
          <LinkRow label="Sign out of all devices" last />
        </SectionCard>

        {/* ── Enhanced Security ── */}
        <SectionCard title="Enhanced Security" className="mt-4">
          <InsetDivider color={200} />
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Get the latest security updates and features by keeping the app up to date in the App Store.
            </p>
            <button
              type="button"
              className="w-full py-3 border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full active:bg-gray-50"
            >
              GO TO APP STORE
            </button>
          </div>
          <InsetDivider color={200} />
          <LinkRow label="SafePass" subtitle="An extra layer of security for large transfers" />
          <LinkRow label="Voice ID" subtitle="Use your voice to verify your identity" last />
        </SectionCard>

        {/* ── Security Tips ── */}
        <div className="mx-4 mt-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
              Security Tips
            </p>
            <button type="button" className="text-sm text-[#1a6bbf] font-semibold">
              View all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ARTICLES.map(article => (
              <button
                key={article.id}
                type="button"
                className="flex-shrink-0 w-48 bg-white rounded-2xl shadow-sm overflow-hidden text-left active:opacity-90"
              >
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-28 object-cover"
                />
                <div className="px-3 py-3">
                  <span className="text-[10px] font-bold text-[#1a6bbf] uppercase tracking-wide">
                    {article.tag}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">
                    {article.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Legal ── */}
        <div className="mt-6">
          <LegalDisclosure />
        </div>

      </div>
    </div>
  );
}

export default SecurityCenterPage;

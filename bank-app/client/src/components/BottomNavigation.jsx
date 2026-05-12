import React from 'react';
import { useNavigate } from 'react-router-dom';
import InsetDivider from './InsetDivider';

const IconDollar = ({ active }) => (
  <svg className={`w-7 h-7 ${active ? 'text-[#1a6bbf]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 116 0" />
  </svg>
);
const IconTransfer = ({ active }) => (
  <svg className={`w-7 h-7 ${active ? 'text-[#1a6bbf]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const IconDeposit = ({ active }) => (
  <svg className={`w-7 h-7 ${active ? 'text-[#1a6bbf]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="6" width="18" height="13" rx="2" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M8 14h.01M12 14h4" />
  </svg>
);
const IconPie = ({ active }) => (
  <svg className={`w-7 h-7 ${active ? 'text-[#1a6bbf]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

const TABS = [
  { id: 'accounts',       label: 'Accounts',       route: '/dashboard' },
  { id: 'pay-transfer',   label: 'Pay & Transfer',  route: '/pay-transfer' },
  { id: 'deposit-checks', label: 'Deposit Checks',  route: '/deposit-checks' },
  { id: 'invest',         label: 'Invest',          route: '/invest' },
];

function TabIcon({ id, active }) {
  if (id === 'accounts')       return <IconDollar active={active} />;
  if (id === 'pay-transfer')   return <IconTransfer active={active} />;
  if (id === 'deposit-checks') return <IconDeposit active={active} />;
  return <IconPie active={active} />;
}

function BottomNavigation({ activeTab }) {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
      <InsetDivider color={200} />
      <div className="flex">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !isActive && navigate(tab.route)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5"
            >
              <TabIcon id={tab.id} active={isActive} />
              <span className={`text-[11px] ${isActive ? 'font-semibold text-[#1a6bbf]' : 'font-medium text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNavigation;

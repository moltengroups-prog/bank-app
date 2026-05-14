import React from 'react';
import { useNavigate } from 'react-router-dom';
import imgErica from '../assets/images/btn-erica-red.jpeg';
import InsetDivider from './InsetDivider';

const IconHamburger = () => (
  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconEnvelope = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconCart = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const IconLogOut = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconBack = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const gapClasses = { 3: 'gap-3', 4: 'gap-4', 5: 'gap-5' };

function AppHeader({
  // Left side (mutually exclusive)
  showMenuButton = false,
  showBackButton = false,
  onBack = null,

  // Center title (back-button pages only)
  title = null,

  // Right side: grouped icons (main pages)
  showInbox = false,
  inboxCount = 0,
  showProducts = false,
  showLogout = false,
  iconGap = 4,

  // Right side: Erica inline in top bar (MainDashboardPage only)
  showEricaInline = false,
  ericaInlineCount = 0,

  // Right side: single elements (detail pages)
  showEricaRight = false,
  ericaRightCount = 0,
  showCartRight = false,
  showCartAndErica = false,
  showSpacer = false,

  // Sub-nav tabs
  showAccountsNav = false,
  activeSubNav = 'accounts',
  showSubNavDivider = false,
}) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));
  const gapClass = gapClasses[iconGap] || 'gap-4';
  const hasRightGroup = showInbox || showProducts || showLogout || showEricaInline;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">

        {/* Left */}
        {showMenuButton && (
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <IconHamburger />
            <span className="text-[10px] font-medium text-gray-600">Menu</span>
          </button>
        )}
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 flex-shrink-0"
          >
            <IconBack />
          </button>
        )}

        {/* Center */}
        {title && (
          <span className="text-base font-normal text-gray-500 tracking-wide">{title}</span>
        )}

        {/* Right: grouped icons */}
        {hasRightGroup && (
          <div className={`flex items-end ${gapClass} flex-shrink-0`}>
            {showEricaInline && (
              <div className="relative flex-shrink-0 mb-3 -translate-x-1">
                <img src={imgErica} alt="Erica assistant" className="w-8 h-8 rounded-full object-cover" />
                {ericaInlineCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {ericaInlineCount}
                  </span>
                )}
              </div>
            )}
            {showInbox && (
              <button
                type="button"
                onClick={() => navigate('/communications')}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  <IconEnvelope />
                  {inboxCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {inboxCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-gray-600">Inbox</span>
              </button>
            )}
            {showProducts && (
              <button type="button" className="flex flex-col items-center gap-0.5">
                <IconCart />
                <span className="text-[10px] font-medium text-gray-600">Products</span>
              </button>
            )}
            {showLogout && (
              <button type="button" className="flex flex-col items-center gap-0.5">
                <IconLogOut />
                <span className="text-[10px] font-medium text-gray-600">Log Out</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Erica avatar (detail pages) */}
        {showEricaRight && (
          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica assistant" className="w-10 h-10 rounded-full object-cover" />
            {ericaRightCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {ericaRightCount}
              </span>
            )}
          </div>
        )}

        {/* Right: cart button (TransactionDetailsPage) */}
        {showCartRight && (
          <button type="button" className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            <IconCart />
          </button>
        )}

        {/* Right: cart + Erica (StatementsAndDocumentsPage) */}
        {showCartAndErica && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button type="button" className="flex items-center justify-center w-8 h-8">
              <IconCart />
            </button>
            <img src={imgErica} alt="Erica assistant" className="w-10 h-10 rounded-full object-cover" />
          </div>
        )}

        {/* Right: spacer (CommunicationsPage, MenuPage) */}
        {showSpacer && (
          <div className="w-8 h-8 flex-shrink-0" aria-hidden="true" />
        )}

      </div>

      {/* Accounts / Dashboard sub-nav */}
      {showAccountsNav && (
        <>
          <div className="flex">
            <button
              type="button"
              onClick={() => activeSubNav !== 'accounts' && navigate('/dashboard')}
              className={`flex-1 py-3 text-sm tracking-wide border-b-2 ${
                activeSubNav === 'accounts'
                  ? 'font-bold text-red-600 border-red-600'
                  : 'font-medium text-gray-400 border-transparent'
              }`}
            >
              Accounts
            </button>
            <button
              type="button"
              onClick={() => activeSubNav !== 'dashboard' && navigate('/main-dashboard')}
              className={`flex-1 py-3 text-sm tracking-wide border-b-2 ${
                activeSubNav === 'dashboard'
                  ? 'font-bold text-red-600 border-red-600'
                  : 'font-medium text-gray-400 border-transparent'
              }`}
            >
              Dashboard
            </button>
          </div>
          {showSubNavDivider && <InsetDivider color={200} />}
        </>
      )}
    </div>
  );
}

export default AppHeader;

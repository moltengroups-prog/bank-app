import React, { useState } from 'react';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';

// ── Section header logos ──────────────────────────────────────────
import imgBoaMini    from '../assets/images/boa-mini-logo.png';
import imgMerrill    from '../assets/images/icon-merrill-investing.png';

// ── Product icon assets ───────────────────────────────────────────
import imgCreditCard    from '../assets/images/icon-credit-card.png';
import imgSavings       from '../assets/images/icon-savings.png';
import imgChecking      from '../assets/images/icon-checking.png';
import imgAutoLoan      from '../assets/images/icon-auto-loan.png';
import imgHomeEquity    from '../assets/images/icon-home-equity.png';
import imgMortgage      from '../assets/images/icon-mortgage.png';
import imgRefinance     from '../assets/images/icon-refinance.png';
import imgSmallBusiness from '../assets/images/icon-small-business.png';
import imgMerrillInvest from '../assets/images/icon-merrill-investing.png';

// CSS filter that normalises any icon PNG to #002D72 navy.
// Pipeline: strip original colour → re-colour to target.
const NAVY_FILTER =
  'brightness(0) saturate(100%) invert(12%) sepia(83%) saturate(2100%) hue-rotate(209deg) brightness(89%)';

// ── Data ──────────────────────────────────────────────────────────

const BOA_PRODUCTS = [
  { id: 'credit-cards',   title: 'Credit Cards',   subtitle: '$500 Cash Rewards Bonus Offer', src: imgCreditCard    },
  { id: 'savings',        title: 'Savings',                                                    src: imgSavings       },
  { id: 'checking',       title: 'Checking',                                                   src: imgChecking      },
  { id: 'auto',           title: 'Auto',                                                       src: imgAutoLoan      },
  { id: 'home-equity',    title: 'Home Equity',                                                src: imgHomeEquity    },
  { id: 'mortgage',       title: 'Mortgage',                                                   src: imgMortgage      },
  { id: 'refinance',      title: 'Refinance',                                                  src: imgRefinance     },
  { id: 'small-business', title: 'Small Business',                                             src: imgSmallBusiness },
];

const MERRILL_PRODUCTS = [
  { id: 'merrill-investing', title: 'Merrill Investing', src: imgMerrillInvest },
];

const TABS = ['Products', 'Offers', 'Saved'];

// ── Sub-components ────────────────────────────────────────────────

function ProductOfferTabs({ active, onChange }) {
  return (
    <div className="flex">
      {TABS.map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 py-3.5 text-[13px] font-semibold tracking-wide relative transition-colors ${
            active === tab ? 'text-red-600' : 'text-gray-400'
          }`}
        >
          {tab}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600" />
          )}
        </button>
      ))}
    </div>
  );
}

function ProductSectionHeader({ logoSrc, label }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 bg-white">
      <img src={logoSrc} alt="" className="w-8 h-8 object-contain" />
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function ProductListItem({ title, subtitle, src }) {
  return (
    <>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50 text-left bg-white"
      >
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[17px] font-bold text-gray-900 leading-snug">{title}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <div className="w-[65px] h-[65px] flex-shrink-0 flex items-center justify-center">
          <img
            src={src}
            alt={title}
            className="w-[58px] h-[58px] object-contain"
            style={{ filter: NAVY_FILTER }}
          />
        </div>
      </button>
      <div className="h-px bg-gray-200" />
    </>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-gray-400 text-base">{message}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

function ProductsOffersPage() {
  const [activeTab, setActiveTab] = useState('Products');

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader showBackButton title="Products and Offers" showChatRight />

      {/* Tab bar — fixed below header, never scrolls */}
      <div className="flex-shrink-0 pt-[64px] border-b border-gray-200 bg-white">
        <ProductOfferTabs active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-white">

        {activeTab === 'Products' && (
          <>
            <ProductSectionHeader logoSrc={imgBoaMini}  label="PROVIDED BY BANK OF AMERICA" />
            {BOA_PRODUCTS.map(p => (
              <ProductListItem key={p.id} title={p.title} subtitle={p.subtitle} src={p.src} />
            ))}
            <ProductSectionHeader logoSrc={imgMerrill}  label="PROVIDED BY MERRILL" />
            {MERRILL_PRODUCTS.map(p => (
              <ProductListItem key={p.id} title={p.title} subtitle={p.subtitle} src={p.src} />
            ))}
            <LegalDisclosure />
          </>
        )}

        {activeTab === 'Offers' && <EmptyState message="No offers available" />}
        {activeTab === 'Saved'  && <EmptyState message="No saved products"   />}

      </div>
    </div>
  );
}

export default ProductsOffersPage;

import React from 'react';
import InsetDivider from './InsetDivider';

function LegalDisclosure() {
  return (
    <>
      {/* Legal info and disclosures */}
      <InsetDivider />
      <div className="px-4 pt-4 pb-4">
        <h3 className="font-semibold text-xl text-gray-900 mb-4">Legal info and disclosures</h3>
        <p className="text-sm text-gray-700 mb-3">
          Investment, insurance and annuity products:
        </p>
        <ul className="text-sm text-gray-500 space-y-1 mb-4">
          <li>&#8226; <strong>Are Not FDIC Insured</strong></li>
          <li>&#8226; <strong>Are Not Bank Guaranteed</strong></li>
          <li>&#8226; <strong>May Lose Value</strong></li>
          <li>&#8226; <strong>Are Not Deposits</strong></li>
          <li>&#8226; <strong>Are Not Insured by Any Federal Government Agency</strong></li>
          <li>&#8226; <strong>Are Not a Condition to Any Banking Service or Activity</strong></li>
        </ul>
        <InsetDivider color={200} inset={false} className="mb-4" />
        <p className="text-sm text-gray-900 font-bold leading-relaxed mb-4">
          Investing involves risk. There is always the potential of losing money when you
          invest in securities. Asset allocation, diversification, and rebalancing do not
          ensure a profit or protect against loss in declining markets.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Bank of Molten, Merrill, their affiliates and advisors do not provide legal,
          tax or accounting advice. Clients should consult their legal and/or tax advisors
          before making any financial decisions.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Merrill offers a broad range of brokerage, investment advisory and other
          services. Additional information is available in our{' '}
          <button type="button" className="text-[#1a6bbf] font-medium">
            Client Relationship Summary.
          </button>
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Merrill Lynch, Pierce, Fenner &amp; Smith Incorporated (also referred to as
          &#8220;MLPF&amp;S&#8221; or &#8220;Merrill&#8221;) makes available certain investment
          products sponsored, managed, distributed or provided by companies that are affiliates
          of Bank of Molten Corporation (&#8220;BofM Corp.&#8221;). MLPF&amp;S is a registered
          broker-dealer, registered investment adviser,{' '}
          <button type="button" className="text-[#1a6bbf] font-medium">Member SIPC</button>{' '}
          and a wholly owned subsidiary of BofM Corp.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Insurance and annuity products are offered through Merrill Lynch Life Agency
          Inc. (&#8220;MLLA&#8221;), a licensed insurance agency and wholly owned subsidiary of
          BofM Corp.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Bank of Molten Private Bank is a division of Bank of Molten, N.A., Member FDIC
          and a wholly owned subsidiary of BofM Corp. Trust, fiduciary, and investment
          management services offered through Bank of Molten Private Bank are provided by
          Bank of Molten N.A. and its agents, Member FDIC, or U.S. Trust Company of
          Delaware. Both are wholly owned subsidiaries of BofM Corp.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Banking products are provided by Bank of Molten, N.A. (&#8220;BANA&#8221;) and
          affiliated banks, Members FDIC and wholly owned subsidiaries of BofM Corp.
        </p>
        <button type="button" className="text-[#1a6bbf] text-sm font-medium leading-snug text-left">
          See additional information about Merrill and Bank of Molten
        </button>
      </div>

      {/* Footer links */}
      <InsetDivider />
      <div className="px-4 pt-6 pb-8 space-y-3">
        <div className="flex justify-center gap-8">
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Browse with Specialist</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Security</button>
        </div>
        <div className="flex justify-center gap-10">
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Privacy</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Children&#39;s Privacy</button>
        </div>
        <div className="flex justify-center gap-6">
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">
            Your Privacy Choices <span className="text-xs align-middle">&#9746;</span>
          </button>
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">AdChoices</button>
        </div>
        <div className="flex justify-center gap-6 flex-wrap">
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Legal Info &amp; Disclosures</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Equal Housing Lender &#127968;</button>
        </div>
        <p className="text-center text-gray-500 text-xs pt-2">
          Bank of Molten, N.A. Member FDIC. &#169; 2026 Bank of America Corporation.
        </p>
      </div>
    </>
  );
}

export default LegalDisclosure;
